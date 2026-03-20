/** Converts a JSON Schema document into a SchemaModel with polymorphism handling. */

import { SchemaField, FieldVariant, SchemaSection, SchemaMeta, SchemaModel } from "./schema-model.js";

/** @typedef {import("./json-schema-converter.types.js").SchemaNode} SchemaNode */

/**
 * Follow a `$ref` pointer. Does NOT collapse oneOf/anyOf.
 * @param {SchemaNode} node
 * @param {SchemaNode} root
 * @param {Set} [seen]
 * @returns {SchemaNode}
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

/**
 * Classify oneOf/anyOf as nullable (1 real + null) or polymorphic (2+ real).
 * @param {SchemaNode[]} branches
 */
function classifyUnion(branches) {
  const nonNull = branches.filter((b) => b && b.type !== "null");
  if (nonNull.length === 1) return { kind: "nullable", resolved: nonNull[0] };
  return { kind: "polymorphic", branches: nonNull.length ? nonNull : branches };
}

/**
 * Resolve $ref then handle oneOf/anyOf (collapse nullable, preserve polymorphic).
 * @param {SchemaNode} node
 * @param {SchemaNode} root
 * @param {Set} [seen]
 * @returns {SchemaNode}
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
      return { ...derefed, [kw]: resolved };
    }
  }

  return derefed;
}

/** @param {string|string[]} type */
function normalizeType(type) {
  if (Array.isArray(type)) return type.find((t) => t !== "null") || type[0] || "object";
  return type || "object";
}

/**
 * Merge shared parent properties into a oneOf/anyOf branch.
 * @param {SchemaNode} branch
 * @param {SchemaNode} parent
 * @param {string} kw
 * @returns {SchemaNode}
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

/**
 * Derive a variant title from a distinguishing required property, type, or index.
 * @param {SchemaNode} branch
 * @param {number} index
 */
function variantTitle(branch, index) {
  if (branch.required?.length) {
    const distinctive = branch.required.find((r) => !["type", "name", "version"].includes(r));
    if (distinctive) return distinctive;
  }
  const t = normalizeType(branch.type);
  return t !== "object" ? t : `Variant ${index + 1}`;
}

/**
 * Convert a schema node's properties into SchemaField[].
 * @param {SchemaNode} node
 * @param {SchemaNode} root
 * @param {Set} seen
 */
function fieldsFrom(node, root, seen) {
  const props = node?.properties || {};
  const req = node?.required || [];
  return Object.entries(props).map(([k, v]) => convertField(k, v, req, root, seen));
}

/**
 * Convert a single schema property into a SchemaField.
 * @param {string} name
 * @param {SchemaNode} raw
 * @param {string[]} requiredList
 * @param {SchemaNode} root
 * @param {Set} [seen]
 */
function convertField(name, raw, requiredList, root, seen = new Set()) {
  const prop = resolve(raw, root, new Set(seen));
  const immutable = prop["x-kubernetes-validations"]?.some((v) => v.rule?.includes("== oldSelf")) || false;
  const required = requiredList.includes(name);

  // Polymorphic oneOf/anyOf
  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(prop[kw])) {
      const hasSharedProps = !!prop.properties;
      const variants = prop[kw].map((branch, i) => {
        const merged = mergeParentInto(branch, prop, kw);
        const resolved = resolve(merged, root, new Set(seen));
        const title = variantTitle(resolved, i);
        const fields = resolved.properties ? fieldsFrom(resolved, root, new Set(seen)) : null;
        return FieldVariant({
          title, type: normalizeType(resolved.type), description: resolved.description || "",
          // Filter out the distinguishing property when shared props are present (redundant with tab)
          properties: hasSharedProps ? fields?.filter((f) => f.name !== title) || null : fields,
        });
      });
      return SchemaField({
        name, type: normalizeType(prop.type), description: prop.description || "",
        required, immutable, variants,
      });
    }
  }

  // Array with items
  if (prop.type === "array" && prop.items) {
    const items = resolve(prop.items, root, new Set(seen));

    for (const kw of ["oneOf", "anyOf"]) {
      if (Array.isArray(items[kw])) {
        const hasSharedItemProps = !!items.properties;
        const variants = items[kw].map((branch, i) => {
          const merged = mergeParentInto(branch, items, kw);
          const resolved = resolve(merged, root, new Set(seen));
          const title = variantTitle(resolved, i);
          const fields = resolved.properties ? fieldsFrom(resolved, root, new Set(seen)) : null;
          return FieldVariant({
            title, type: `[]${normalizeType(resolved.type)}`, description: resolved.description || "",
            properties: hasSharedItemProps ? fields?.filter((f) => f.name !== title) || null : fields,
          });
        });
        return SchemaField({
          name, type: `[]${normalizeType(items.type)}`, description: prop.description || "",
          required, immutable, variants,
        });
      }
    }

    return SchemaField({
      name, type: `[]${normalizeType(items.type)}`, description: prop.description || "",
      required, immutable,
      properties: items.properties ? fieldsFrom(items, root, new Set(seen)) : null,
    });
  }

  // Plain object or scalar
  return SchemaField({
    name, type: normalizeType(prop.type), description: prop.description || "",
    required, immutable,
    properties: prop.properties ? fieldsFrom(prop, root, new Set(seen)) : null,
  });
}

/**
 * Extract SchemaMeta from apiVersion/kind property definitions.
 * @param {SchemaNode} data
 * @param {SchemaNode} schemaRoot
 */
function extractMeta(data, schemaRoot) {
  const resolved = schemaRoot?.properties ? schemaRoot : resolve(schemaRoot, schemaRoot);
  const props = resolved?.properties || {};
  const av = resolveRef(props.apiVersion || {}, schemaRoot);
  const kind = resolveRef(props.kind || {}, schemaRoot);

  return SchemaMeta({
    description: schemaRoot.description || "",
    apiVersions: av.enum || (av["const"] ? [av["const"]] : []),
    kind: kind["const"] || (kind.enum ? kind.enum.join(", ") : ""),
  });
}

/**
 * Unwrap CRD-style openAPIV3Schema or return as-is.
 * @param {SchemaNode} data
 * @returns {SchemaNode}
 */
function getSchemaRoot(data) {
  return data?.spec?.versions?.[0]?.schema?.openAPIV3Schema || data;
}

/**
 * Convert a parsed JSON Schema document into a SchemaModel.
 * @param {SchemaNode} data
 * @returns {import("./schema-model.types.js").SchemaModel}
 */
export function jsonSchemaToModel(data) {
  const root = getSchemaRoot(data);

  if (root?.properties) {
    return SchemaModel({
      meta: extractMeta(data, root),
      sections: [SchemaSection({ title: "Schema", fields: fieldsFrom(root, root, new Set()) })],
    });
  }

  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(root?.[kw])) {
      const sections = root[kw].map((option, i) => {
        const resolved = resolve(option, root);
        return SchemaSection({
          title: `Variant ${i + 1}: ${normalizeType(resolved.type)}`,
          description: resolved.description || "",
          fields: fieldsFrom(resolved, root, new Set()),
        });
      });
      return SchemaModel({ meta: extractMeta(data, root), sections });
    }
  }

  return SchemaModel({ meta: extractMeta(data, root), sections: [] });
}
