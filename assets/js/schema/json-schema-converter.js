/**
 * Converts a JSON Schema document into a SchemaModel.
 *
 * Produces the canonical SchemaModel/SchemaField/FieldVariant types
 * defined in schema-model.js — including proper polymorphism handling
 * for nested oneOf/anyOf.
 */

import { createField, createVariant, createSection, createMeta, createModel } from "./schema-model.js";

// ---------------------------------------------------------------------------
// $ref resolution
// ---------------------------------------------------------------------------

/**
 * Follow a `$ref` pointer against the root document.
 * Does NOT collapse oneOf/anyOf — that is handled separately.
 *
 * @param {object} node
 * @param {object} root
 * @param {Set}    [seen]
 * @returns {object}
 */
function resolveRef(node, root, seen = new Set()) {
  if (!node || typeof node !== "object") return node || {};

  if (node.$ref) {
    if (seen.has(node.$ref)) return { type: "object", description: "(circular)" };
    seen.add(node.$ref);

    let target = root;
    for (const p of node.$ref.replace("#/", "").split("/")) {
      target = target?.[p];
      if (!target) return {};
    }

    const { $ref: _, ...siblings } = node;
    return resolveRef({ ...target, ...siblings }, root, seen);
  }

  return node;
}

// ---------------------------------------------------------------------------
// oneOf / anyOf classification
// ---------------------------------------------------------------------------

/**
 * Classify a oneOf/anyOf array into either a nullable shorthand or
 * true polymorphism.
 *
 * @param {object[]} branches - Resolved branch nodes.
 * @returns {{ kind: "nullable", resolved: object } | { kind: "polymorphic", branches: object[] }}
 */
function classifyUnion(branches) {
  const nonNull = branches.filter((b) => b && b.type !== "null");
  if (nonNull.length === 1) {
    return { kind: "nullable", resolved: nonNull[0] };
  }
  return { kind: "polymorphic", branches: nonNull.length ? nonNull : branches };
}

/**
 * Fully resolve a node: dereference $ref, then handle oneOf/anyOf.
 * - Nullable unions (1 real + null) → collapse to the real branch.
 * - True polymorphism (2+ real branches) → returns the node as-is
 *   so the caller can build variants.
 *
 * @param {object} node
 * @param {object} root
 * @param {Set}    [seen]
 * @returns {object}
 */
function resolve(node, root, seen = new Set()) {
  const derefed = resolveRef(node, root, new Set(seen));

  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(derefed[kw])) {
      const resolved = derefed[kw].map((o) => resolveRef(o, root, new Set(seen)));
      const union = classifyUnion(resolved);
      if (union.kind === "nullable") {
        const { [kw]: _, ...rest } = derefed;
        return resolve({ ...rest, ...union.resolved }, root, seen);
      }
      // polymorphic — return the node with resolved branches for the caller
      return { ...derefed, [kw]: resolved };
    }
  }

  return derefed;
}

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

/** Normalize JSON Schema type (which may be an array like ["string","null"]). */
function normalizeType(type) {
  if (Array.isArray(type)) {
    return type.find((t) => t !== "null") || type[0] || "object";
  }
  return type || "object";
}

/**
 * Merge shared parent properties/required into a oneOf/anyOf branch.
 *
 * When a schema node has both `properties` and `oneOf`, the properties are
 * shared across all branches (e.g. sourceDefinition has shared name/type/labels
 * from $ref, plus oneOf for access vs input). Each branch only carries its
 * distinguishing properties, so we merge the parent's shared ones in.
 */
function mergeParentInto(branch, parent, kw) {
  const { [kw]: _, ...shared } = parent;
  if (!shared.properties && !shared.required) return branch;

  return {
    ...branch,
    properties: { ...shared.properties, ...branch.properties },
    required: [...(shared.required || []), ...(branch.required || [])],
  };
}

// ---------------------------------------------------------------------------
// Field conversion
// ---------------------------------------------------------------------------

/**
 * Derive a variant title from a resolved branch node.
 * Tries to find a distinguishing label — a required property name,
 * the type name, or falls back to "Variant N".
 */
function variantTitle(branch, index) {
  // If the branch has a distinguishing required property, use it
  if (branch.required?.length) {
    const distinctive = branch.required.find(
      (r) => !["type", "name", "version"].includes(r),
    );
    if (distinctive) return distinctive;
  }
  const t = normalizeType(branch.type);
  if (t !== "object") return t;
  return `Variant ${index + 1}`;
}

/**
 * Convert a resolved schema node's properties into SchemaField[].
 */
function fieldsFrom(node, root, seen) {
  const props = node?.properties || {};
  const req = node?.required || [];
  return Object.entries(props).map(([k, v]) => convertField(k, v, req, root, seen));
}

/**
 * Convert a single schema property into a SchemaField, handling:
 * - $ref resolution
 * - nullable oneOf/anyOf → collapse
 * - polymorphic oneOf/anyOf → FieldVariant[]
 * - arrays with items
 * - nested object properties (recursive)
 *
 * @param {string}   name
 * @param {object}   raw
 * @param {string[]} requiredList
 * @param {object}   root
 * @param {Set}      [seen]
 * @returns {import("./schema-model.js").SchemaField}
 */
function convertField(name, raw, requiredList, root, seen = new Set()) {
  const prop = resolve(raw, root, new Set(seen));

  const immutable = prop["x-kubernetes-validations"]?.some(
    (v) => v.rule?.includes("== oldSelf"),
  ) || false;

  const required = requiredList.includes(name);

  // --- Polymorphic oneOf/anyOf at this field level ---------------------------
  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(prop[kw])) {
      const branches = prop[kw];
      const hasSharedProps = !!prop.properties;
      const variants = branches.map((branch, i) => {
        const merged = mergeParentInto(branch, prop, kw);
        const resolved = resolve(merged, root, new Set(seen));
        const title = variantTitle(resolved, i);
        const fields = resolved.properties ? fieldsFrom(resolved, root, new Set(seen)) : null;
        return createVariant({
          title,
          type: normalizeType(resolved.type),
          description: resolved.description || "",
          // When shared parent properties are merged in, the distinguishing
          // property (e.g. "access") is redundant with the tab title — remove it.
          properties: hasSharedProps ? fields?.filter((f) => f.name !== title) || null : fields,
        });
      });
      return createField({
        name,
        type: normalizeType(prop.type),
        description: prop.description || "",
        required,
        immutable,
        variants,
      });
    }
  }

  // --- Array with items ------------------------------------------------------
  if (prop.type === "array" && prop.items) {
    const items = resolve(prop.items, root, new Set(seen));

    // Items themselves may be polymorphic
    for (const kw of ["oneOf", "anyOf"]) {
      if (Array.isArray(items[kw])) {
        const branches = items[kw];
        const hasSharedItemProps = !!items.properties;
        const variants = branches.map((branch, i) => {
          const merged = mergeParentInto(branch, items, kw);
          const resolved = resolve(merged, root, new Set(seen));
          const title = variantTitle(resolved, i);
          const fields = resolved.properties ? fieldsFrom(resolved, root, new Set(seen)) : null;
          return createVariant({
            title,
            type: `[]${normalizeType(resolved.type)}`,
            description: resolved.description || "",
            properties: hasSharedItemProps ? fields?.filter((f) => f.name !== title) || null : fields,
          });
        });
        return createField({
          name,
          type: `[]${normalizeType(items.type)}`,
          description: prop.description || "",
          required,
          immutable,
          variants,
        });
      }
    }

    const itemType = normalizeType(items.type);
    return createField({
      name,
      type: `[]${itemType}`,
      description: prop.description || "",
      required,
      immutable,
      properties: items.properties ? fieldsFrom(items, root, new Set(seen)) : null,
    });
  }

  // --- Plain object or scalar ------------------------------------------------
  return createField({
    name,
    type: normalizeType(prop.type),
    description: prop.description || "",
    required,
    immutable,
    properties: prop.properties ? fieldsFrom(prop, root, new Set(seen)) : null,
  });
}

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

/**
 * Extract SchemaMeta from a JSON Schema document.
 * Looks at the apiVersion/kind property definitions for enum/const values.
 */
function extractMeta(data, schemaRoot) {
  const resolved = schemaRoot?.properties ? schemaRoot : resolve(schemaRoot, schemaRoot);
  const props = resolved?.properties || {};

  const av = resolveRef(props.apiVersion || {}, schemaRoot);
  const kind = resolveRef(props.kind || {}, schemaRoot);

  return createMeta({
    description: schemaRoot.description || "",
    apiVersions: av.enum || (av.const ? [av.const] : []),
    kind: kind.const || (kind.enum ? kind.enum.join(", ") : ""),
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Unwrap CRD-style `spec.versions[0].schema.openAPIV3Schema` or return as-is. */
function getSchemaRoot(data) {
  return data?.spec?.versions?.[0]?.schema?.openAPIV3Schema || data;
}

/**
 * Convert a parsed JSON Schema document into a SchemaModel.
 *
 * @param {object} data - The parsed JSON object (JSON Schema or CRD wrapper).
 * @returns {import("./schema-model.js").SchemaModel}
 */
export function jsonSchemaToModel(data) {
  const root = getSchemaRoot(data);

  // --- Root has direct properties → single section ---------------------------
  if (root?.properties) {
    return createModel({
      meta: extractMeta(data, root),
      sections: [
        createSection({
          title: "Schema",
          fields: fieldsFrom(root, root, new Set()),
        }),
      ],
    });
  }

  // --- Root oneOf/anyOf → one section per variant ----------------------------
  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(root?.[kw])) {
      const sections = root[kw].map((option, i) => {
        const resolved = resolve(option, root);
        return createSection({
          title: `Variant ${i + 1}: ${normalizeType(resolved.type)}`,
          description: resolved.description || "",
          fields: fieldsFrom(resolved, root, new Set()),
        });
      });
      return createModel({
        meta: extractMeta(data, root),
        sections,
      });
    }
  }

  // --- Empty / unrecognised ---------------------------------------------------
  return createModel({
    meta: extractMeta(data, root),
    sections: [],
  });
}
