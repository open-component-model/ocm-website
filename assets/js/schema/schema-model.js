/** Factory functions for schema view-models. See schema-model.types.js for type definitions. */

/** @returns {import("./schema-model.types.js").SchemaField} */
export function SchemaField({ name, type, description = "", required = false, immutable = false, properties = null, variants = null }) {
  return { name, type, description, required, immutable, properties, variants };
}

/** @returns {import("./schema-model.types.js").FieldVariant} */
export function FieldVariant({ title, type, description = "", properties = null }) {
  return { title, type, description, properties };
}

/** @returns {import("./schema-model.types.js").SchemaSection} */
export function SchemaSection({ title, description = "", fields }) {
  return { title, description, fields };
}

/** @returns {import("./schema-model.types.js").SchemaMeta} */
export function SchemaMeta({ description = "", apiVersions = [], kind = "" } = {}) {
  return { description, apiVersions, kind };
}

/** @returns {import("./schema-model.types.js").SchemaModel} */
export function SchemaModel({ meta, sections }) {
  return { meta, sections };
}
