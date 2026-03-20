/** View-model types for the schema renderer. */

/**
 * @typedef {Object} SchemaField
 * @property {string}              name
 * @property {string}              type        - Display type ("string", "object", "[]object", etc.)
 * @property {string}              description
 * @property {boolean}             required
 * @property {boolean}             immutable
 * @property {SchemaField[]|null}  properties  - Nested fields (null for leaves or when variants is set)
 * @property {FieldVariant[]|null} variants    - Polymorphic shapes (mutually exclusive with properties)
 */

/**
 * @typedef {Object} FieldVariant
 * @property {string}             title       - Variant label (e.g. "access", "input")
 * @property {string}             type
 * @property {string}             description
 * @property {SchemaField[]|null} properties
 */

/**
 * @typedef {Object} SchemaSection
 * @property {string}        title
 * @property {string}        description
 * @property {SchemaField[]} fields
 */

/**
 * @typedef {Object} SchemaMeta
 * @property {string}   description
 * @property {string[]} apiVersions
 * @property {string}   kind
 */

/**
 * @typedef {Object} SchemaModel
 * @property {SchemaMeta}      meta
 * @property {SchemaSection[]} sections
 */
