import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { resolve, parseProperty, parseSchema, extractMeta, fieldsFrom, getRoot } from "./schema-parser.js";

const DESCRIPTOR_URL = "https://raw.githubusercontent.com/open-component-model/open-component-model/main/bindings/go/descriptor/v2/resources/schema-2020-12.json";
const CONSTRUCTOR_URL = "https://raw.githubusercontent.com/open-component-model/open-component-model/main/bindings/go/constructor/spec/v1/resources/schema-2020-12.json";

let descriptorSchema;
let constructorSchema;

before(async () => {
  const [descResp, consResp] = await Promise.all([
    fetch(DESCRIPTOR_URL),
    fetch(CONSTRUCTOR_URL),
  ]);
  assert.ok(descResp.ok, `Failed to fetch descriptor schema: ${descResp.status}`);
  assert.ok(consResp.ok, `Failed to fetch constructor schema: ${consResp.status}`);
  descriptorSchema = await descResp.json();
  constructorSchema = await consResp.json();
});

// ---------------------------------------------------------------------------
// resolve()
// ---------------------------------------------------------------------------
describe("resolve", () => {
  it("returns the node as-is when no $ref", () => {
    const node = { type: "string", description: "hello" };
    assert.deepStrictEqual(resolve(node, {}), node);
  });

  it("follows a $ref pointer", () => {
    const root = { $defs: { foo: { type: "string", description: "a foo" } } };
    const result = resolve({ $ref: "#/$defs/foo" }, root);
    assert.equal(result.type, "string");
    assert.equal(result.description, "a foo");
  });

  it("merges sibling keys over the resolved $ref", () => {
    const root = { $defs: { foo: { type: "string", description: "from def" } } };
    const result = resolve({ $ref: "#/$defs/foo", description: "overridden" }, root);
    assert.equal(result.description, "overridden");
    assert.equal(result.type, "string");
  });

  it("picks first non-null oneOf option", () => {
    const node = { oneOf: [{ type: "null" }, { type: "string", description: "picked" }] };
    const result = resolve(node, {});
    assert.equal(result.type, "string");
    assert.equal(result.description, "picked");
  });

  it("resolves $ref inside oneOf options", () => {
    const root = { $defs: { bar: { type: "object", description: "bar obj" } } };
    const node = { oneOf: [{ type: "null" }, { $ref: "#/$defs/bar" }] };
    const result = resolve(node, root);
    assert.equal(result.type, "object");
    assert.equal(result.description, "bar obj");
  });

  it("handles circular $ref gracefully", () => {
    const root = { $defs: { loop: { $ref: "#/$defs/loop" } } };
    const result = resolve({ $ref: "#/$defs/loop" }, root);
    assert.equal(result.type, "object");
    assert.match(result.description, /circular/);
  });

  it("returns empty object for broken $ref", () => {
    const result = resolve({ $ref: "#/$defs/nonexistent" }, { $defs: {} });
    assert.deepStrictEqual(result, {});
  });
});

// ---------------------------------------------------------------------------
// Descriptor schema
// ---------------------------------------------------------------------------
describe("descriptor schema", () => {
  it("has root-level properties (no oneOf)", () => {
    assert.ok(descriptorSchema.properties, "descriptor should have root properties");
    assert.ok(!descriptorSchema.oneOf, "descriptor should not have root oneOf");
  });

  it("parseSchema returns a single section titled 'Schema'", () => {
    const sections = parseSchema(descriptorSchema);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, "Schema");
  });

  it("parses all expected top-level fields", () => {
    const sections = parseSchema(descriptorSchema);
    const fieldNames = sections[0].fields.map((f) => f.name);
    for (const expected of ["meta", "component", "signatures", "nestedDigests"]) {
      assert.ok(fieldNames.includes(expected), `missing top-level field: ${expected}`);
    }
  });

  it("resolves $ref fields into objects with nested properties", () => {
    const sections = parseSchema(descriptorSchema);
    const meta = sections[0].fields.find((f) => f.name === "meta");
    assert.ok(meta, "meta field must exist");
    assert.equal(meta.type, "object");
    assert.ok(meta.properties?.length > 0, "meta must have nested properties");
    const childNames = meta.properties.map((f) => f.name);
    assert.ok(childNames.includes("schemaVersion"), "meta must have schemaVersion child");
  });

  it("resolves nested $ref in array items (e.g. component.resources)", () => {
    const sections = parseSchema(descriptorSchema);
    const component = sections[0].fields.find((f) => f.name === "component");
    assert.ok(component?.properties?.length > 0, "component must have nested properties");
    const resources = component.properties.find((f) => f.name === "resources");
    assert.ok(resources, "component.resources must exist");
    assert.match(resources.type, /\[\]/);
    assert.ok(resources.properties?.length > 0, "resources items must have nested properties");
  });

  it("handles oneOf at field level (e.g. digest: null | digestSpec)", () => {
    const sections = parseSchema(descriptorSchema);
    const component = sections[0].fields.find((f) => f.name === "component");
    const resources = component?.properties?.find((f) => f.name === "resources");
    assert.ok(resources?.properties?.length > 0, "resources items must have properties");
    const digest = resources.properties.find((f) => f.name === "digest");
    assert.ok(digest, "digest field must exist");
    assert.equal(digest.type, "object");
    assert.ok(digest.properties?.length > 0, "digest must resolve to digestSpec with children");
  });

  it("extractMeta returns description", () => {
    const meta = extractMeta(descriptorSchema);
    assert.ok(meta.description.length > 0, "must have a description");
  });
});

// ---------------------------------------------------------------------------
// Constructor schema
// ---------------------------------------------------------------------------
describe("constructor schema", () => {
  it("has root-level oneOf (no direct properties)", () => {
    assert.ok(!constructorSchema.properties, "constructor should not have root properties");
    assert.ok(constructorSchema.oneOf, "constructor should have root oneOf");
    assert.equal(constructorSchema.oneOf.length, 2);
  });

  it("parseSchema returns two variant sections", () => {
    const sections = parseSchema(constructorSchema);
    assert.equal(sections.length, 2, `expected 2 sections, got ${sections.length}`);
    assert.match(sections[0].title, /Variant 1: object/);
    assert.match(sections[1].title, /Variant 2: object/);
  });

  it("variant 1 has a 'components' array field", () => {
    const sections = parseSchema(constructorSchema);
    const fields = sections[0].fields;
    assert.equal(fields.length, 1);
    assert.equal(fields[0].name, "components");
    assert.match(fields[0].type, /\[\]/);
  });

  it("variant 1 components items have nested fields", () => {
    const sections = parseSchema(constructorSchema);
    const components = sections[0].fields[0];
    assert.ok(components.properties?.length > 0, "components items must have nested properties");
    const childNames = components.properties.map((f) => f.name);
    assert.ok(childNames.includes("name"), "components items must have 'name'");
    assert.ok(childNames.includes("version"), "components items must have 'version'");
    assert.ok(childNames.includes("resources"), "components items must have 'resources'");
  });

  it("variant 2 is a single component with direct fields", () => {
    const sections = parseSchema(constructorSchema);
    const fields = sections[1].fields;
    const fieldNames = fields.map((f) => f.name);
    for (const expected of ["name", "version", "provider", "resources"]) {
      assert.ok(fieldNames.includes(expected), `variant 2 missing field: ${expected}`);
    }
  });

  it("deeply nested fields resolve correctly (resources.access)", () => {
    const sections = parseSchema(constructorSchema);
    // Check in variant 2 (single component)
    const resources = sections[1].fields.find((f) => f.name === "resources");
    assert.ok(resources, "resources must exist");
    assert.match(resources.type, /\[\]/);
    if (resources.properties) {
      const access = resources.properties.find((f) => f.name === "access");
      assert.ok(access, "resources items must have 'access'");
    }
  });

  it("extractMeta returns description for constructor schema", () => {
    const meta = extractMeta(constructorSchema);
    assert.ok(meta.description.length > 0, "must have a description");
    // Constructor has no apiVersion/kind at root
    assert.equal(meta.apiVersions.length, 0);
    assert.equal(meta.kind, "");
  });
});

// ---------------------------------------------------------------------------
// parseProperty edge cases
// ---------------------------------------------------------------------------
describe("parseProperty", () => {
  it("sets required flag correctly", () => {
    const field = parseProperty("foo", { type: "string" }, ["foo"], {});
    assert.equal(field.required, true);
    const field2 = parseProperty("foo", { type: "string" }, ["bar"], {});
    assert.equal(field2.required, false);
  });

  it("detects immutable from x-kubernetes-validations", () => {
    const raw = {
      type: "string",
      "x-kubernetes-validations": [{ rule: "self == oldSelf" }],
    };
    const field = parseProperty("test", raw, [], {});
    assert.equal(field.immutable, true);
  });

  it("normalizes array type (e.g. ['string', 'null']) to a string", () => {
    const field = parseProperty("ts", { type: ["string", "null"] }, [], {});
    assert.equal(field.type, "string");
  });

  it("defaults type to 'object' when missing", () => {
    const field = parseProperty("test", {}, [], {});
    assert.equal(field.type, "object");
  });

  it("parses array with $ref items", () => {
    const root = {
      $defs: {
        item: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
            value: { type: "number" },
          },
        },
      },
    };
    const raw = { type: "array", items: { $ref: "#/$defs/item" } };
    const field = parseProperty("items", raw, [], root);
    assert.equal(field.type, "[]object");
    assert.equal(field.properties?.length, 2);
    assert.equal(field.properties[0].name, "id");
    assert.equal(field.properties[0].required, true);
  });
});
