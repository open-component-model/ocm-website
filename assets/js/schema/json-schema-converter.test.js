import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { jsonSchemaToModel } from "./json-schema-converter.js";

const DESCRIPTOR_URL = "https://raw.githubusercontent.com/open-component-model/open-component-model/main/bindings/go/descriptor/v2/resources/schema-2020-12.json";
const CONSTRUCTOR_URL = "https://raw.githubusercontent.com/open-component-model/open-component-model/main/bindings/go/constructor/spec/v1/resources/schema-2020-12.json";

let descriptorModel;
let constructorModel;

before(async () => {
  const [descResp, consResp] = await Promise.all([
    fetch(DESCRIPTOR_URL),
    fetch(CONSTRUCTOR_URL),
  ]);
  assert.ok(descResp.ok, `Failed to fetch descriptor schema: ${descResp.status}`);
  assert.ok(consResp.ok, `Failed to fetch constructor schema: ${consResp.status}`);
  descriptorModel = jsonSchemaToModel(await descResp.json());
  constructorModel = jsonSchemaToModel(await consResp.json());
});

// ---------------------------------------------------------------------------
// SchemaModel structure
// ---------------------------------------------------------------------------
describe("model structure", () => {
  it("has meta and sections", () => {
    assert.ok(descriptorModel.meta);
    assert.ok(Array.isArray(descriptorModel.sections));
    assert.ok(constructorModel.meta);
    assert.ok(Array.isArray(constructorModel.sections));
  });
});

// ---------------------------------------------------------------------------
// Descriptor schema (single section, nullable oneOf only)
// ---------------------------------------------------------------------------
describe("descriptor schema", () => {
  it("produces a single section titled 'Schema'", () => {
    assert.equal(descriptorModel.sections.length, 1);
    assert.equal(descriptorModel.sections[0].title, "Schema");
  });

  it("has expected top-level fields", () => {
    const names = descriptorModel.sections[0].fields.map((f) => f.name);
    for (const expected of ["meta", "component", "signatures", "nestedDigests"]) {
      assert.ok(names.includes(expected), `missing field: ${expected}`);
    }
  });

  it("meta field has nested properties", () => {
    const meta = descriptorModel.sections[0].fields.find((f) => f.name === "meta");
    assert.ok(meta.properties?.length > 0);
    assert.ok(meta.properties.some((f) => f.name === "schemaVersion"));
  });

  it("component.resources is an array with nested properties", () => {
    const component = descriptorModel.sections[0].fields.find((f) => f.name === "component");
    const resources = component.properties.find((f) => f.name === "resources");
    assert.match(resources.type, /\[\]/);
    assert.ok(resources.properties?.length > 0);
  });

  it("nullable oneOf (digest) collapses to single object, no variants", () => {
    const component = descriptorModel.sections[0].fields.find((f) => f.name === "component");
    const resources = component.properties.find((f) => f.name === "resources");
    const digest = resources.properties.find((f) => f.name === "digest");
    assert.ok(digest, "digest must exist");
    assert.equal(digest.type, "object");
    assert.ok(digest.properties?.length > 0, "digest must have properties");
    assert.equal(digest.variants, null, "nullable oneOf should not produce variants");
  });

  it("all fields have the expected shape", () => {
    function checkField(field) {
      assert.equal(typeof field.name, "string");
      assert.equal(typeof field.type, "string");
      assert.equal(typeof field.description, "string");
      assert.equal(typeof field.required, "boolean");
      assert.equal(typeof field.immutable, "boolean");
      if (field.properties) field.properties.forEach(checkField);
      if (field.variants) {
        field.variants.forEach((v) => {
          assert.equal(typeof v.title, "string");
          assert.equal(typeof v.type, "string");
          assert.equal(typeof v.description, "string");
          if (v.properties) v.properties.forEach(checkField);
        });
      }
    }
    descriptorModel.sections[0].fields.forEach(checkField);
  });

  it("extractMeta returns description", () => {
    assert.ok(descriptorModel.meta.description.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Constructor schema (root oneOf, nested polymorphism)
// ---------------------------------------------------------------------------
describe("constructor schema", () => {
  it("produces two variant sections", () => {
    assert.equal(constructorModel.sections.length, 2);
    assert.match(constructorModel.sections[0].title, /Variant 1/);
    assert.match(constructorModel.sections[1].title, /Variant 2/);
  });

  it("variant 1 has a 'components' array field", () => {
    const fields = constructorModel.sections[0].fields;
    assert.equal(fields.length, 1);
    assert.equal(fields[0].name, "components");
    assert.match(fields[0].type, /\[\]/);
  });

  it("variant 2 has direct component fields", () => {
    const names = constructorModel.sections[1].fields.map((f) => f.name);
    for (const expected of ["name", "version", "provider", "resources"]) {
      assert.ok(names.includes(expected), `variant 2 missing: ${expected}`);
    }
  });

  it("resourceDefinition has variants (access vs input)", () => {
    // variant 2 is a direct component
    const resources = constructorModel.sections[1].fields.find((f) => f.name === "resources");
    assert.ok(resources, "resources must exist");
    // resources is an array whose items have oneOf
    assert.ok(
      resources.variants?.length >= 2,
      `expected >=2 variants on resources, got ${resources.variants?.length}`,
    );
  });

  it("sourceDefinition has variants (access vs input)", () => {
    const sources = constructorModel.sections[1].fields.find((f) => f.name === "sources");
    assert.ok(sources, "sources must exist");
    assert.ok(
      sources.variants?.length >= 2,
      `expected >=2 variants on sources, got ${sources.variants?.length}`,
    );
  });

  it("label.value has variants (string vs object)", () => {
    // dig into variant 2 → resources → first variant's properties → labels → items → value
    const resources = constructorModel.sections[1].fields.find((f) => f.name === "resources");
    // find a variant that has properties with labels
    const variant = resources.variants?.find((v) =>
      v.properties?.some((f) => f.name === "labels"),
    );
    if (variant) {
      const labels = variant.properties.find((f) => f.name === "labels");
      if (labels?.properties) {
        const value = labels.properties.find((f) => f.name === "value");
        if (value) {
          assert.ok(
            value.variants?.length >= 2,
            "label.value should have variants (string vs object)",
          );
        }
      }
    }
  });

  it("extractMeta returns description", () => {
    assert.ok(constructorModel.meta.description.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases (synthetic schemas)
// ---------------------------------------------------------------------------
describe("edge cases", () => {
  it("handles empty schema", () => {
    const model = jsonSchemaToModel({});
    assert.ok(model.meta);
    assert.equal(model.sections.length, 0);
  });

  it("handles schema with only properties", () => {
    const model = jsonSchemaToModel({
      type: "object",
      properties: { foo: { type: "string", description: "a foo" } },
    });
    assert.equal(model.sections.length, 1);
    assert.equal(model.sections[0].fields[0].name, "foo");
    assert.equal(model.sections[0].fields[0].type, "string");
  });

  it("immutable detection works", () => {
    const model = jsonSchemaToModel({
      type: "object",
      properties: {
        name: {
          type: "string",
          "x-kubernetes-validations": [{ rule: "self == oldSelf" }],
        },
      },
    });
    assert.equal(model.sections[0].fields[0].immutable, true);
  });

  it("required detection works", () => {
    const model = jsonSchemaToModel({
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        optional: { type: "string" },
      },
    });
    assert.equal(model.sections[0].fields.find((f) => f.name === "name").required, true);
    assert.equal(model.sections[0].fields.find((f) => f.name === "optional").required, false);
  });

  it("circular $ref produces a field without crashing", () => {
    const schema = {
      type: "object",
      $defs: { loop: { $ref: "#/$defs/loop" } },
      properties: { x: { $ref: "#/$defs/loop" } },
    };
    const model = jsonSchemaToModel(schema);
    const x = model.sections[0].fields.find((f) => f.name === "x");
    assert.equal(x.type, "object");
  });

  it("nested polymorphic oneOf produces variants, not properties", () => {
    const schema = {
      type: "object",
      properties: {
        access: {
          oneOf: [
            {
              type: "object",
              required: ["localPath"],
              properties: { localPath: { type: "string" } },
            },
            {
              type: "object",
              required: ["imageRef"],
              properties: { imageRef: { type: "string" } },
            },
          ],
        },
      },
    };
    const model = jsonSchemaToModel(schema);
    const access = model.sections[0].fields.find((f) => f.name === "access");
    assert.equal(access.properties, null, "polymorphic field should not have properties");
    assert.equal(access.variants.length, 2);
    assert.equal(access.variants[0].title, "localPath");
    assert.equal(access.variants[1].title, "imageRef");
    assert.ok(access.variants[0].properties.some((f) => f.name === "localPath"));
    assert.ok(access.variants[1].properties.some((f) => f.name === "imageRef"));
  });

  it("polymorphic oneOf merges shared parent properties into each variant", () => {
    const schema = {
      type: "object",
      properties: {
        source: {
          type: "object",
          properties: {
            name: { type: "string", description: "shared name" },
            type: { type: "string" },
          },
          required: ["name"],
          oneOf: [
            {
              type: "object",
              required: ["access"],
              properties: { access: { type: "object", description: "access spec" } },
            },
            {
              type: "object",
              required: ["input"],
              properties: { input: { type: "object", description: "input spec" } },
            },
          ],
        },
      },
    };
    const model = jsonSchemaToModel(schema);
    const source = model.sections[0].fields.find((f) => f.name === "source");
    assert.equal(source.variants.length, 2);
    // Each variant should have the shared properties merged in
    for (const v of source.variants) {
      const names = v.properties.map((f) => f.name);
      assert.ok(names.includes("name"), `variant "${v.title}" must include shared "name"`);
      assert.ok(names.includes("type"), `variant "${v.title}" must include shared "type"`);
    }
    // Distinguishing properties should be filtered out (redundant with tab title)
    assert.ok(!source.variants[0].properties.some((f) => f.name === "access"),
      "access should be filtered — it's the tab title");
    assert.ok(!source.variants[1].properties.some((f) => f.name === "input"),
      "input should be filtered — it's the tab title");
  });

  it("constructor sources variants include shared fields (name, type, etc.)", () => {
    const sources = constructorModel.sections[1].fields.find((f) => f.name === "sources");
    assert.ok(sources.variants?.length >= 2);
    for (const v of sources.variants) {
      const names = v.properties.map((f) => f.name);
      assert.ok(names.includes("name"), `variant "${v.title}" missing shared field "name"`);
      assert.ok(names.includes("type"), `variant "${v.title}" missing shared field "type"`);
    }
  });

  it("nullable oneOf (type + null) collapses without variants", () => {
    const schema = {
      type: "object",
      properties: {
        label: {
          oneOf: [
            { type: "null" },
            { type: "string", description: "a label" },
          ],
        },
      },
    };
    const model = jsonSchemaToModel(schema);
    const label = model.sections[0].fields.find((f) => f.name === "label");
    assert.equal(label.type, "string");
    assert.equal(label.description, "a label");
    assert.equal(label.variants, null);
  });
});
