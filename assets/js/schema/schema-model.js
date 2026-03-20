/**
 * Canonical view-models for the schema renderer.
 *
 * Both JSON Schema and CRD YAML converters produce these models;
 * the renderer consumes only these — never raw schema data.
 */

// ---------------------------------------------------------------------------
// SchemaField — a single property in a schema
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SchemaField
 * @property {string}              name        - Property name (e.g. "replicas").
 * @property {string}              type        - Display type. Scalars: "string", "integer",
 *                                               "number", "boolean". Compounds: "object",
 *                                               "[]string", "[]object", etc.
 * @property {string}              description - Human-readable description (may be empty).
 * @property {boolean}             required    - Whether the parent lists this field as required.
 * @property {boolean}             immutable   - Whether the field is immutable (e.g. via
 *                                               x-kubernetes-validations "self == oldSelf").
 * @property {SchemaField[]|null}  properties  - Nested child fields for objects / array-of-objects.
 *                                               `null` when the field is a leaf or when `variants`
 *                                               is used instead.
 * @property {FieldVariant[]|null} variants    - When this field accepts multiple distinct shapes
 *                                               (true oneOf/anyOf polymorphism), each variant
 *                                               describes one possible shape. `null` when the
 *                                               field has a single fixed shape (use `properties`).
 *                                               Mutually exclusive with `properties` — a field
 *                                               uses one or the other (or neither for scalars).
 */

// ---------------------------------------------------------------------------
// FieldVariant — one possible shape of a polymorphic field
// ---------------------------------------------------------------------------

/**
 * Represents one branch of a oneOf/anyOf at the field level.
 *
 * Example: an `access` field with oneOf localBlob | ociArtifact would produce
 * two variants, each with their own type, description, and properties.
 *
 * @typedef {Object} FieldVariant
 * @property {string}             title       - Short label for this variant
 *                                              (e.g. "localBlob", "ociArtifact", or "Variant 1").
 * @property {string}             type        - The type of this variant (e.g. "object", "string").
 * @property {string}             description - Variant-specific description (may be empty).
 * @property {SchemaField[]|null} properties  - Fields within this variant (null for scalars).
 */

// ---------------------------------------------------------------------------
// SchemaSection — a group of fields rendered as one table
// ---------------------------------------------------------------------------

/**
 * A section represents one renderable table of fields.
 *
 * Most schemas produce a single section titled "Schema".
 * When the root uses `oneOf`/`anyOf`, each variant becomes its own section
 * so every possible document shape is visible.
 *
 * @typedef {Object} SchemaSection
 * @property {string}        title       - Section heading (e.g. "Schema", "Variant 1: object").
 * @property {string}        description - Optional section-level description.
 * @property {SchemaField[]} fields      - Top-level fields in this section.
 */

// ---------------------------------------------------------------------------
// SchemaMeta — header metadata
// ---------------------------------------------------------------------------

/**
 * Metadata shown in the header above the field tables.
 *
 * For JSON Schema sources these come from property definitions (enum/const
 * on `apiVersion` and `kind`).
 * For CRD YAML sources these come from the CRD envelope (`spec.group`,
 * `spec.versions[].name`, `spec.names.kind`).
 *
 * @typedef {Object} SchemaMeta
 * @property {string}   description - Top-level schema description.
 * @property {string[]} apiVersions - Known API versions (e.g. ["delivery.ocm.software/v1alpha1"]).
 * @property {string}   kind        - Resource kind (e.g. "Component"). Empty string if unknown.
 */

// ---------------------------------------------------------------------------
// SchemaModel — the top-level model the renderer receives
// ---------------------------------------------------------------------------

/**
 * The complete, source-agnostic model that the renderer works with.
 *
 * Produced by a converter (JSON Schema → SchemaModel, CRD YAML → SchemaModel).
 * The renderer never touches raw schema data — only this model.
 *
 * @typedef {Object} SchemaModel
 * @property {SchemaMeta}      meta     - Header metadata (apiVersion, kind, description).
 * @property {SchemaSection[]} sections - One or more field tables.
 *                                        Single section for simple schemas;
 *                                        multiple sections for oneOf/anyOf variants.
 */

/**
 * Create a SchemaField.
 *
 * @param {Object} opts
 * @param {string}              opts.name
 * @param {string}              opts.type
 * @param {string}              [opts.description=""]
 * @param {boolean}             [opts.required=false]
 * @param {boolean}             [opts.immutable=false]
 * @param {SchemaField[]|null}  [opts.properties=null]
 * @param {FieldVariant[]|null} [opts.variants=null]
 * @returns {SchemaField}
 */
export function createField({ name, type, description = "", required = false, immutable = false, properties = null, variants = null }) {
  return { name, type, description, required, immutable, properties, variants };
}

/**
 * Create a FieldVariant.
 *
 * @param {Object} opts
 * @param {string}             opts.title
 * @param {string}             opts.type
 * @param {string}             [opts.description=""]
 * @param {SchemaField[]|null} [opts.properties=null]
 * @returns {FieldVariant}
 */
export function createVariant({ title, type, description = "", properties = null }) {
  return { title, type, description, properties };
}

/**
 * Create a SchemaSection.
 *
 * @param {Object} opts
 * @param {string}        opts.title
 * @param {string}        [opts.description=""]
 * @param {SchemaField[]} opts.fields
 * @returns {SchemaSection}
 */
export function createSection({ title, description = "", fields }) {
  return { title, description, fields };
}

/**
 * Create a SchemaMeta.
 *
 * @param {Object} opts
 * @param {string}   [opts.description=""]
 * @param {string[]} [opts.apiVersions=[]]
 * @param {string}   [opts.kind=""]
 * @returns {SchemaMeta}
 */
export function createMeta({ description = "", apiVersions = [], kind = "" } = {}) {
  return { description, apiVersions, kind };
}

/**
 * Create a SchemaModel.
 *
 * @param {Object} opts
 * @param {SchemaMeta}      opts.meta
 * @param {SchemaSection[]} opts.sections
 * @returns {SchemaModel}
 */
export function createModel({ meta, sections }) {
  return { meta, sections };
}
