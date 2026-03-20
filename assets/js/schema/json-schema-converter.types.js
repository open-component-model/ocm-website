/** JSON Schema input types (JSON Schema / OpenAPI v3 nodes). */

/**
 * @typedef {Object} SchemaNode
 * @property {string|string[]}              [type]
 * @property {string}                       [description]
 * @property {string}                       [$ref]
 * @property {Record<string, SchemaNode>}   [properties]
 * @property {string[]}                     [required]
 * @property {SchemaNode}                   [items]
 * @property {SchemaNode[]}                 [oneOf]
 * @property {SchemaNode[]}                 [anyOf]
 * @property {string[]}                     [enum]
 * @property {string}                       [const]
 * @property {Record<string, SchemaNode>}   [$defs]
 * @property {Array<{rule?: string}>}       [x-kubernetes-validations]
 */
