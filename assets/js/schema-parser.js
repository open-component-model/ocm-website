/**
 * Schema parsing logic for the schema-renderer component.
 * Extracted to a separate module so it can be tested independently.
 *
 * @typedef {{
 *   enum?: string[], const?: string, type?: string, description?: string,
 *   properties?: Record<string, SchemaNode>, $ref?: string, items?: SchemaNode,
 *   oneOf?: SchemaNode[], anyOf?: SchemaNode[], required?: string[],
 *   'x-kubernetes-validations'?: Array<{rule?: string}>
 * }} SchemaNode
 */

/**
 * Resolve a JSON Schema node by following `$ref` pointers against
 * the root document and picking the first non-null `oneOf`/`anyOf` branch.
 *
 * The OCM schema uses JSON Schema 2020-12 with `$defs`/`$ref` extensively
 * (unlike Kubernetes CRDs which inline everything). This function
 * dereferences those so the rest of the code can treat every node as
 * fully inlined.
 *
 * @param {SchemaNode} node
 * @param {object} root - Full root schema document for $ref lookup.
 * @param {Set} [seen] - Tracks visited $ref paths to prevent cycles.
 * @returns {SchemaNode}
 */
export function resolve(node, root, seen = new Set()) {
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
    return resolve({ ...target, ...siblings }, root, seen);
  }

  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(node[kw])) {
      const options = node[kw].map((o) => resolve(o, root, new Set(seen)));
      const pick = options.find((o) => o && o.type !== "null");
      if (pick) {
        const { [kw]: _, ...rest } = node;
        return resolve({ ...rest, ...pick }, root, seen);
      }
    }
  }

  return node;
}

/**
 * Parse a schema property into a field descriptor, resolving $ref pointers.
 * @returns {{name: string, type: string, description: string, required: boolean, properties: ?Array, immutable?: boolean}}
 */
export function parseProperty(name, raw, requiredList, root, seen = new Set()) {
  const prop = resolve(raw, root, new Set(seen));

  // JSON Schema allows type as an array (e.g. ["string", "null"])
  const rawType = Array.isArray(prop.type)
    ? prop.type.find((t) => t !== "null") || prop.type[0]
    : prop.type;

  const field = {
    name,
    type: rawType || "object",
    description: prop.description || "",
    required: requiredList.includes(name),
    properties: null,
  };

  if (prop["x-kubernetes-validations"]?.some((v) => v.rule?.includes("== oldSelf"))) {
    field.immutable = true;
  }

  if (prop.type === "array" && prop.items) {
    const items = resolve(prop.items, root, new Set(seen));
    field.type = `[]${items.type || "object"}`;
    if (items.properties) {
      field.properties = Object.entries(items.properties).map(
        ([k, v]) => parseProperty(k, v, items.required || [], root, new Set(seen)),
      );
    }
  }

  if (prop.properties) {
    field.properties = Object.entries(prop.properties).map(
      ([k, v]) => parseProperty(k, v, prop.required || [], root, new Set(seen)),
    );
  }

  return field;
}

/** Unwrap CRD-style `spec.versions[0].schema.openAPIV3Schema` or return as-is. */
// noinspection JSUnresolvedReference — CRD-specific deep path
export function getRoot(data) {
  return data?.spec?.versions?.[0]?.schema?.openAPIV3Schema || data;
}

/** Parse fields from a resolved schema node. */
export function fieldsFrom(resolved, root) {
  const props = resolved?.properties || {};
  const req = resolved?.required || [];
  return Object.entries(props).map(([k, v]) => parseProperty(k, v, req, root));
}

/**
 * Parse the root schema into one or more sections.
 * If the root uses `oneOf`/`anyOf`, each variant becomes its own section
 * so all possible document shapes are visible.
 *
 * @param {object} data - The parsed JSON document.
 * @returns {Array<{title: string, description: string, fields: Array}>}
 */
export function parseSchema(data) {
  const root = getRoot(data);

  if (root?.properties) {
    return [{ title: "Schema", description: "", fields: fieldsFrom(root, root) }];
  }

  for (const kw of ["oneOf", "anyOf"]) {
    if (Array.isArray(root?.[kw])) {
      return root[kw].map((option, i) => {
        const resolved = resolve(option, root);
        const rawType = Array.isArray(resolved.type)
          ? resolved.type.find((t) => t !== "null") || resolved.type[0]
          : resolved.type;
        return {
          title: `Variant ${i + 1}: ${rawType || "object"}`,
          description: resolved.description || "",
          fields: fieldsFrom(resolved, root),
        };
      });
    }
  }

  return [];
}

/**
 * Extract apiVersion/kind metadata from the schema's own property definitions.
 * @param {object} data - The parsed JSON document.
 * @returns {{description: string, apiVersions: string[], kind: string}}
 */
export function extractMeta(data) {
  const root = getRoot(data);
  const resolved = root?.properties ? root : resolve(root, root);
  const props = resolved?.properties || {};

  const av = resolve(props.apiVersion || {}, root);
  const kind = resolve(props.kind || {}, root);

  return {
    description: root.description || "",
    apiVersions: av.enum || (av.const ? [av.const] : []),
    kind: kind.const || (kind.enum ? kind.enum.join(", ") : ""),
  };
}
