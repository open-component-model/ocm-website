import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { crdYamlToModels, isYamlUrl } from "./crd-yaml-converter.js";

const CRD_YAML_URL = "https://raw.githubusercontent.com/open-component-model/open-component-model/main/kubernetes/controller/config/crd/bases/delivery.ocm.software_components.yaml";

let crdModels;

before(async () => {
  const resp = await fetch(CRD_YAML_URL);
  assert.ok(resp.ok, `Failed to fetch CRD YAML: ${resp.status}`);
  crdModels = crdYamlToModels(await resp.text());
});

// ---------------------------------------------------------------------------
// CRD YAML converter
// ---------------------------------------------------------------------------
describe("crdYamlToModels", () => {
  it("produces one model per served version", () => {
    assert.ok(crdModels.length >= 1, "must produce at least one model");
  });

  it("model has correct meta from CRD envelope", () => {
    const meta = crdModels[0].meta;
    assert.equal(meta.kind, "Component");
    assert.ok(meta.apiVersions.length > 0);
    assert.ok(meta.apiVersions[0].includes("delivery.ocm.software"));
    assert.ok(meta.description.length > 0);
  });

  it("model has a single Schema section with fields", () => {
    assert.equal(crdModels[0].sections.length, 1);
    assert.equal(crdModels[0].sections[0].title, "Schema");
    assert.ok(crdModels[0].sections[0].fields.length > 0);
  });

  it("has expected top-level fields", () => {
    const names = crdModels[0].sections[0].fields.map((f) => f.name);
    for (const expected of ["apiVersion", "kind", "metadata", "spec", "status"]) {
      assert.ok(names.includes(expected), `missing field: ${expected}`);
    }
  });

  it("spec has nested properties", () => {
    const spec = crdModels[0].sections[0].fields.find((f) => f.name === "spec");
    assert.ok(spec.properties?.length > 0);
  });

  it("fields conform to SchemaField shape", () => {
    function checkField(field) {
      assert.equal(typeof field.name, "string");
      assert.equal(typeof field.type, "string");
      assert.equal(typeof field.description, "string");
      assert.equal(typeof field.required, "boolean");
      assert.equal(typeof field.immutable, "boolean");
      if (field.properties) field.properties.forEach(checkField);
    }
    crdModels[0].sections[0].fields.forEach(checkField);
  });

  it("handles multi-CRD documents", () => {
    const multiYaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: foos.example.com
spec:
  group: example.com
  names:
    kind: Foo
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                bar:
                  type: string
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: bars.example.com
spec:
  group: example.com
  names:
    kind: Bar
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                baz:
                  type: integer
`;
    const models = crdYamlToModels(multiYaml);
    assert.equal(models.length, 2);
    assert.equal(models[0].meta.kind, "Foo");
    assert.equal(models[1].meta.kind, "Bar");
  });

  it("handles multi-version CRDs", () => {
    const multiVersionYaml = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: widgets.example.com
spec:
  group: example.com
  names:
    kind: Widget
  versions:
    - name: v1alpha1
      served: true
      storage: false
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                color:
                  type: string
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                color:
                  type: string
                size:
                  type: integer
`;
    const models = crdYamlToModels(multiVersionYaml);
    assert.equal(models.length, 2);
    assert.equal(models[0].meta.apiVersions[0], "example.com/v1alpha1");
    assert.equal(models[1].meta.apiVersions[0], "example.com/v1");
    // v1 has an extra field (size)
    const v1Spec = models[1].sections[0].fields.find((f) => f.name === "spec");
    const v1alpha1Spec = models[0].sections[0].fields.find((f) => f.name === "spec");
    assert.ok(v1Spec.properties.length > v1alpha1Spec.properties.length);
  });

  it("skips non-served versions", () => {
    const yamlText = `
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: things.example.com
spec:
  group: example.com
  names:
    kind: Thing
  versions:
    - name: v1alpha1
      served: false
      storage: false
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
`;
    const models = crdYamlToModels(yamlText);
    assert.equal(models.length, 1);
    assert.equal(models[0].meta.apiVersions[0], "example.com/v1");
  });

  it("returns empty array for non-CRD YAML", () => {
    const models = crdYamlToModels("apiVersion: v1\nkind: ConfigMap\n");
    assert.equal(models.length, 0);
  });
});

// ---------------------------------------------------------------------------
// isYamlUrl
// ---------------------------------------------------------------------------
describe("isYamlUrl", () => {
  it("detects .yaml", () => assert.equal(isYamlUrl("https://example.com/crd.yaml"), true));
  it("detects .yml", () => assert.equal(isYamlUrl("https://example.com/crd.yml"), true));
  it("rejects .json", () => assert.equal(isYamlUrl("https://example.com/schema.json"), false));
});
