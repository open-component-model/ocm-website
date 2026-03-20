/** Converts Kubernetes CRD YAML into SchemaModel(s). Handles multi-doc and multi-version CRDs. */

import yaml from "js-yaml";
import { SchemaMeta, SchemaModel } from "./schema-model.js";
import { jsonSchemaToModel } from "./json-schema-converter.js";

/** @typedef {import("./crd-yaml-converter.types.js").CrdDocument} CrdDocument */
/** @typedef {import("./crd-yaml-converter.types.js").CrdVersion} CrdVersion */

/**
 * Extract SchemaMeta from a CRD document + version entry.
 * @param {CrdDocument} crd
 * @param {CrdVersion} version
 */
function extractCrdMeta(crd, version) {
  const schema = version.schema?.openAPIV3Schema || {};
  return SchemaMeta({
    description: schema.description || "",
    apiVersions: [`${crd.spec.group}/${version.name}`],
    kind: crd.spec.names?.kind || "",
  });
}

/**
 * Convert a single CRD version into a SchemaModel.
 * @param {CrdDocument} crd
 * @param {CrdVersion} version
 */
function versionToModel(crd, version) {
  const schema = version.schema?.openAPIV3Schema;
  if (!schema) {
    return SchemaModel({ meta: extractCrdMeta(crd, version), sections: [] });
  }
  const model = jsonSchemaToModel(schema);
  return SchemaModel({ meta: extractCrdMeta(crd, version), sections: model.sections });
}

/** Convert a CRD YAML string into one or more SchemaModels. */
export function crdYamlToModels(text) {
  const docs = yaml.loadAll(text).filter(Boolean);
  const crds = /** @type {CrdDocument[]} */ (docs.filter((d) => d.kind === "CustomResourceDefinition"));
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

/** Check whether a URL points to a YAML file based on its extension. */
export function isYamlUrl(url) {
  try {
    return /\.ya?ml$/i.test(url);
  } catch {
    return false;
  }
}
