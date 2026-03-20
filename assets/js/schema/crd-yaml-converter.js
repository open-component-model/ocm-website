/**
 * Converts Kubernetes CRD YAML into SchemaModel(s).
 *
 * A YAML file may contain multiple documents (separated by `---`),
 * each CRD may have multiple served versions, and each version has
 * its own openAPIV3Schema. This converter handles all of that and
 * delegates the actual schema-to-fields conversion to jsonSchemaToModel.
 */

import yaml from "js-yaml";
import { createMeta, createModel } from "./schema-model.js";
import { jsonSchemaToModel } from "./json-schema-converter.js";

/**
 * Extract SchemaMeta from a CRD document + version entry.
 *
 * @param {object} crd     - The full CRD document.
 * @param {object} version - A single entry from spec.versions[].
 * @returns {import("./schema-model.js").SchemaMeta}
 */
function extractCrdMeta(crd, version) {
  const schema = version.schema?.openAPIV3Schema || {};
  return createMeta({
    description: schema.description || "",
    apiVersions: [`${crd.spec.group}/${version.name}`],
    kind: crd.spec.names?.kind || "",
  });
}

/**
 * Convert a single CRD version into a SchemaModel.
 * Delegates field conversion to jsonSchemaToModel (the openAPIV3Schema
 * is just a JSON Schema), then replaces the meta with CRD envelope data.
 *
 * @param {object} crd     - The full CRD document.
 * @param {object} version - A single entry from spec.versions[].
 * @returns {import("./schema-model.js").SchemaModel}
 */
function versionToModel(crd, version) {
  const schema = version.schema?.openAPIV3Schema;
  if (!schema) {
    return createModel({
      meta: extractCrdMeta(crd, version),
      sections: [],
    });
  }

  // jsonSchemaToModel handles the field conversion; we just override meta
  const model = jsonSchemaToModel(schema);
  return createModel({
    meta: extractCrdMeta(crd, version),
    sections: model.sections,
  });
}

/**
 * Convert a CRD YAML string into one or more SchemaModels.
 *
 * Returns an array because a YAML file may contain multiple CRDs,
 * and each CRD may have multiple served versions — each combination
 * produces its own SchemaModel.
 *
 * @param {string} text - Raw YAML content (may contain multiple documents).
 * @returns {import("./schema-model.js").SchemaModel[]}
 */
export function crdYamlToModels(text) {
  const docs = yaml.loadAll(text).filter(Boolean);
  const crds = docs.filter((d) => d.kind === "CustomResourceDefinition");

  if (!crds.length) return [];

  const models = [];
  for (const crd of crds) {
    const versions = (crd.spec?.versions || []).filter((v) => v.served !== false);
    for (const version of versions) {
      models.push(versionToModel(crd, version));
    }
  }

  return models;
}

/**
 * Check whether a URL points to a YAML file based on its extension.
 * @param {string} url
 * @returns {boolean}
 */
export function isYamlUrl(url) {
  try {
    return /\.ya?ml$/i.test(url);
  } catch {
    return false;
  }
}
