// Tests for resolve-schema.js
//
// Run: node --test .github/scripts/resolve-schema.test.js
//      (or via `npm test`)

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fsp = require('node:fs/promises');
const { getDisplayType, getConstraints, transformField, transformSchema } = require('./resolve-schema');

// ===========================================================================
// getDisplayType
// ===========================================================================

test('getDisplayType: returns "any" for null/undefined/empty', () => {
  assert.equal(getDisplayType(null), 'any');
  assert.equal(getDisplayType(undefined), 'any');
  assert.equal(getDisplayType({}), 'any');
});

test('getDisplayType: simple types', () => {
  assert.equal(getDisplayType({ type: 'string' }), 'string');
  assert.equal(getDisplayType({ type: 'integer' }), 'integer');
  assert.equal(getDisplayType({ type: 'number' }), 'number');
  assert.equal(getDisplayType({ type: 'boolean' }), 'boolean');
  assert.equal(getDisplayType({ type: 'object' }), 'object');
});

test('getDisplayType: union types (type array)', () => {
  assert.equal(getDisplayType({ type: ['string', 'null'] }), 'string | null');
});

test('getDisplayType: array type with items', () => {
  assert.equal(getDisplayType({ type: 'array', items: { type: 'string' } }), '[]string');
  assert.equal(getDisplayType({ type: 'array', items: { type: 'object' } }), '[]object');
  assert.equal(getDisplayType({ type: 'array' }), '[]any');
});

test('getDisplayType: nested array', () => {
  assert.equal(
    getDisplayType({ type: 'array', items: { type: 'array', items: { type: 'integer' } } }),
    '[][]integer'
  );
});

test('getDisplayType: const', () => {
  assert.equal(getDisplayType({ const: 'local' }), 'const: "local"');
  assert.equal(getDisplayType({ const: 42 }), 'const: 42');
});

test('getDisplayType: enum', () => {
  assert.equal(getDisplayType({ enum: ['a', 'b'] }), 'enum');
});

test('getDisplayType: composition keywords', () => {
  assert.equal(getDisplayType({ oneOf: [{ type: 'string' }] }), 'oneOf');
  assert.equal(getDisplayType({ anyOf: [{ type: 'string' }] }), 'anyOf');
  assert.equal(getDisplayType({ allOf: [{ type: 'string' }] }), 'allOf');
});

test('getDisplayType: const takes precedence over type', () => {
  assert.equal(getDisplayType({ const: 'local', type: 'string' }), 'const: "local"');
});

test('getDisplayType: enum takes precedence over type', () => {
  assert.equal(getDisplayType({ enum: ['a'], type: 'string' }), 'enum');
});

// ===========================================================================
// getConstraints
// ===========================================================================

test('getConstraints: returns undefined when no constraints', () => {
  assert.equal(getConstraints({}), undefined);
  assert.equal(getConstraints({ type: 'string', description: 'hello' }), undefined);
});

test('getConstraints: extracts string constraints', () => {
  const result = getConstraints({ pattern: '^v2', minLength: 1, maxLength: 255 });
  assert.deepEqual(result, { pattern: '^v2', minLength: 1, maxLength: 255 });
});

test('getConstraints: extracts numeric constraints', () => {
  const result = getConstraints({ minimum: 0, maximum: 100, exclusiveMinimum: -1, exclusiveMaximum: 101 });
  assert.deepEqual(result, { minimum: 0, maximum: 100, exclusiveMinimum: -1, exclusiveMaximum: 101 });
});

test('getConstraints: extracts array constraints', () => {
  const result = getConstraints({ minItems: 1, maxItems: 10 });
  assert.deepEqual(result, { minItems: 1, maxItems: 10 });
});

test('getConstraints: extracts object constraints', () => {
  const result = getConstraints({ minProperties: 1, additionalProperties: false });
  assert.deepEqual(result, { minProperties: 1, additionalProperties: false });
});

test('getConstraints: extracts format', () => {
  const result = getConstraints({ format: 'date-time' });
  assert.deepEqual(result, { format: 'date-time' });
});

test('getConstraints: ignores non-constraint keys', () => {
  const result = getConstraints({ type: 'string', description: 'test', pattern: '^x' });
  assert.deepEqual(result, { pattern: '^x' });
});

// ===========================================================================
// transformField — basic
// ===========================================================================

test('transformField: handles null/non-object schema', () => {
  const result = transformField('foo', null);
  assert.equal(result.name, 'foo');
  assert.equal(result.type, 'any');
  assert.equal(result.description, '');
});

test('transformField: simple string field', () => {
  const schema = { type: 'string', description: 'A name' };
  const result = transformField('name', schema, ['name']);
  assert.equal(result.name, 'name');
  assert.equal(result.type, 'string');
  assert.equal(result.description, 'A name');
  assert.equal(result.required, true);
});

test('transformField: non-required field', () => {
  const result = transformField('name', { type: 'string' }, []);
  assert.equal(result.required, false);
});

test('transformField: field with constraints', () => {
  const schema = { type: 'string', pattern: '^v[0-9]+$', minLength: 1 };
  const result = transformField('version', schema);
  assert.deepEqual(result.constraints, { pattern: '^v[0-9]+$', minLength: 1 });
});

test('transformField: field with enum', () => {
  const schema = { type: 'string', enum: ['local', 'external'] };
  const result = transformField('relation', schema);
  assert.equal(result.type, 'enum');
  assert.deepEqual(result.enumValues, ['local', 'external']);
});

test('transformField: field with const', () => {
  const result = transformField('relation', { const: 'local' });
  assert.match(result.type, /^const/);
  assert.equal(result.constValue, 'local');
});

test('transformField: field with examples', () => {
  const result = transformField('version', { type: 'string', examples: ['v1.0.0', 'v2.0.0'] });
  assert.deepEqual(result.examples, ['v1.0.0', 'v2.0.0']);
});

test('transformField: field with default value', () => {
  const result = transformField('replicas', { type: 'integer', default: 1 });
  assert.equal(result.defaultValue, 1);
});

// ===========================================================================
// transformField — nested object properties
// ===========================================================================

test('transformField: object with nested properties', () => {
  const schema = {
    type: 'object',
    description: 'A person',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Full name' },
      age: { type: 'integer', description: 'Age in years' },
    },
  };
  const result = transformField('person', schema);
  assert.equal(result.type, 'object');
  assert.equal(result.properties.length, 2);

  const nameField = result.properties.find((f) => f.name === 'name');
  assert.equal(nameField.required, true);
  assert.equal(nameField.type, 'string');

  const ageField = result.properties.find((f) => f.name === 'age');
  assert.equal(ageField.required, false);
  assert.equal(ageField.type, 'integer');
});

// ===========================================================================
// transformField — array items
// ===========================================================================

test('transformField: array with object items', () => {
  const schema = {
    type: 'array',
    description: 'List of labels',
    items: {
      type: 'object',
      required: ['name', 'value'],
      properties: {
        name: { type: 'string', description: 'Label name' },
        value: { type: 'string', description: 'Label value' },
      },
    },
  };
  const result = transformField('labels', schema);
  assert.equal(result.type, '[]object');
  assert.equal(result.properties.length, 2);
  assert.equal(result.properties[0].name, 'name');
  assert.equal(result.properties[0].required, true);
});

test('transformField: array with simple items (no properties)', () => {
  const result = transformField('tags', { type: 'array', items: { type: 'string' } });
  assert.equal(result.type, '[]string');
  assert.equal(result.properties, undefined);
});

// ===========================================================================
// transformField — oneOf / anyOf / allOf (composition)
// ===========================================================================

test('transformField: oneOf variants', () => {
  const schema = {
    description: 'Nullable array',
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'null' },
    ],
  };
  const result = transformField('labels', schema);
  assert.ok(result.variants);
  assert.equal(result.variants.type, 'oneOf');
  assert.equal(result.variants.options.length, 2);
  assert.equal(result.variants.options[0].label, 'array');
  assert.equal(result.variants.options[1].label, 'null');
});

test('transformField: anyOf variants', () => {
  const schema = {
    anyOf: [{ type: 'string' }, { type: 'integer' }],
  };
  const result = transformField('value', schema);
  assert.ok(result.variants);
  assert.equal(result.variants.type, 'anyOf');
  assert.equal(result.variants.options.length, 2);
});

test('transformField: variant label falls back to description then default', () => {
  const schema = {
    oneOf: [
      { description: 'A string variant with more text than sixty chars is truncated at the boundary' },
      {},
    ],
  };
  const result = transformField('x', schema);
  assert.equal(result.variants.options[0].label, 'A string variant with more text than sixty chars is truncate');
  assert.equal(result.variants.options[1].label, 'Option 2');
});

// ===========================================================================
// transformField — propertyNames
// ===========================================================================

test('transformField: propertyNames', () => {
  const schema = {
    type: 'object',
    description: 'Extra identity',
    propertyNames: { description: 'Key format', pattern: '^[a-z]+$', minLength: 2 },
  };
  const result = transformField('extraId', schema);
  assert.ok(result.propertyNames);
  assert.equal(result.propertyNames.description, 'Key format');
  assert.deepEqual(result.propertyNames.constraints, { pattern: '^[a-z]+$', minLength: 2 });
});

// ===========================================================================
// transformField — circular reference guard
// ===========================================================================

test('transformField: circular reference is detected', () => {
  const schema = { type: 'object', description: 'Self-ref' };
  schema.properties = { self: schema };
  const result = transformField('root', schema, [], 0, new Set());
  assert.equal(result.properties.length, 1);
  assert.equal(result.properties[0].name, 'self');
  assert.equal(result.properties[0].circular, true);
});

test('transformField: max depth is respected', () => {
  const result = transformField('deep', { type: 'object', description: 'Deep' }, [], 13, new Set());
  assert.equal(result.circular, true);
});

// ===========================================================================
// transformSchema — top-level structure
// ===========================================================================

test('transformSchema: extracts metadata', () => {
  const resolved = { type: 'object', description: 'Resolved desc' };
  const original = {
    $id: 'my-schema.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'My Schema',
    description: 'Original desc',
  };
  const doc = transformSchema(resolved, original);
  assert.equal(doc.title, 'My Schema');
  assert.equal(doc.description, 'Resolved desc');
  assert.equal(doc.schemaId, 'my-schema.json');
  assert.equal(doc.schemaVersion, 'https://json-schema.org/draft/2020-12/schema');
});

test('transformSchema: extracts top-level fields', () => {
  const schema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Component name' },
      version: { type: 'string', description: 'Component version' },
    },
  };
  const doc = transformSchema(schema, {});
  assert.ok(doc.fields);
  assert.equal(doc.fields.length, 2);
  assert.equal(doc.fields[0].name, 'name');
  assert.equal(doc.fields[0].required, true);
  assert.equal(doc.fields[1].name, 'version');
  assert.equal(doc.fields[1].required, false);
});

test('transformSchema: handles top-level oneOf (constructor pattern)', () => {
  const schema = {
    oneOf: [
      { type: 'object', properties: { components: { type: 'array' } } },
      { type: 'object', description: 'A single component' },
    ],
  };
  const doc = transformSchema(schema, {});
  assert.ok(doc.variants);
  assert.equal(doc.variants.type, 'oneOf');
  assert.equal(doc.variants.options.length, 2);
  assert.equal(doc.variants.options[0].label, 'object');
});

test('transformSchema: collects $defs names from original schema', () => {
  const original = {
    $defs: { componentName: { type: 'string' }, label: { type: 'object' }, access: { type: 'object' } },
  };
  const doc = transformSchema({}, original);
  assert.deepEqual(doc.definitionNames, ['componentName', 'label', 'access']);
});

test('transformSchema: no $defs means no definitionNames', () => {
  const doc = transformSchema({}, {});
  assert.equal(doc.definitionNames, undefined);
});

// ===========================================================================
// transformSchema — realistic OCM descriptor-like schema
// ===========================================================================

test('transformSchema: handles OCM descriptor-like structure', () => {
  const schema = {
    type: 'object',
    description: 'OCM Component Descriptor v2',
    required: ['meta', 'component'],
    properties: {
      meta: {
        type: 'object',
        description: 'Descriptor metadata',
        required: ['schemaVersion'],
        properties: {
          schemaVersion: { type: 'string', description: 'Schema version', pattern: '^v2' },
        },
      },
      component: {
        type: 'object',
        description: 'The component spec',
        required: ['name', 'version', 'provider'],
        properties: {
          name: { type: 'string', description: 'Component name', maxLength: 255, pattern: '^[a-z]' },
          version: { type: 'string', description: 'Semver', examples: ['v1.0.0'] },
          provider: { type: 'string', description: 'Provider', minLength: 1 },
          labels: {
            oneOf: [
              {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    name: { type: 'string', description: 'Label name' },
                    value: { description: 'Label value' },
                  },
                },
              },
              { type: 'null' },
            ],
          },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type', 'access'],
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                relation: { type: 'string', enum: ['local', 'external'] },
                access: { type: 'object', required: ['type'], properties: { type: { type: 'string' } } },
              },
            },
          },
        },
      },
      signatures: {
        oneOf: [
          { type: 'array', items: { type: 'object' } },
          { type: 'null' },
        ],
      },
    },
  };

  const original = {
    $id: 'descriptor.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $defs: { meta: {}, component: {}, signature: {} },
  };

  const doc = transformSchema(schema, original);

  // Metadata
  assert.equal(doc.schemaId, 'descriptor.json');
  assert.deepEqual(doc.definitionNames, ['meta', 'component', 'signature']);

  // Top-level fields
  assert.equal(doc.fields.length, 3);
  assert.equal(doc.fields[0].name, 'meta');
  assert.equal(doc.fields[0].required, true);
  assert.equal(doc.fields[1].name, 'component');
  assert.equal(doc.fields[1].required, true);
  assert.equal(doc.fields[2].name, 'signatures');
  assert.equal(doc.fields[2].required, false);

  // meta.schemaVersion
  const meta = doc.fields[0];
  assert.equal(meta.properties.length, 1);
  assert.equal(meta.properties[0].name, 'schemaVersion');
  assert.deepEqual(meta.properties[0].constraints, { pattern: '^v2' });

  // component nested fields
  const comp = doc.fields[1];
  assert.ok(comp.properties.length >= 4);

  const compName = comp.properties.find((f) => f.name === 'name');
  assert.equal(compName.required, true);
  assert.deepEqual(compName.constraints, { maxLength: 255, pattern: '^[a-z]' });

  const compVersion = comp.properties.find((f) => f.name === 'version');
  assert.deepEqual(compVersion.examples, ['v1.0.0']);

  // labels oneOf (nullable array)
  const labels = comp.properties.find((f) => f.name === 'labels');
  assert.ok(labels.variants);
  assert.equal(labels.variants.type, 'oneOf');
  assert.equal(labels.variants.options.length, 2);

  // resources (array with item properties)
  const resources = comp.properties.find((f) => f.name === 'resources');
  assert.equal(resources.type, '[]object');
  assert.ok(resources.properties.length >= 3);

  const relation = resources.properties.find((f) => f.name === 'relation');
  assert.deepEqual(relation.enumValues, ['local', 'external']);

  // access nested inside resources
  const access = resources.properties.find((f) => f.name === 'access');
  assert.equal(access.type, 'object');
  assert.ok(access.properties.length >= 1);

  // signatures oneOf
  const sigs = doc.fields[2];
  assert.ok(sigs.variants);
  assert.equal(sigs.variants.type, 'oneOf');
});

// ===========================================================================
// Integration: resolve actual OCM schemas
// ===========================================================================

const REPO_ROOT = path.resolve(__dirname, '../..');
const DESCRIPTOR_PATH = path.join(REPO_ROOT, 'static/schemas/ocm-descriptor.json');
const CONSTRUCTOR_PATH = path.join(REPO_ROOT, 'static/schemas/ocm-constructor.json');
const DESCRIPTOR_DATA = path.join(REPO_ROOT, 'data/schemas/descriptor.json');
const CONSTRUCTOR_DATA = path.join(REPO_ROOT, 'data/schemas/constructor.json');

test('integration: descriptor schema resolves without error', async () => {
  await assert.doesNotReject(fsp.access(DESCRIPTOR_PATH));

  const { execFile } = require('node:child_process');
  const { promisify } = require('node:util');
  const execFileAsync = promisify(execFile);

  await execFileAsync('node', [
    path.join(__dirname, 'resolve-schema.js'),
    'static/schemas/ocm-descriptor.json',
    'descriptor',
  ], { cwd: REPO_ROOT });

  const content = await fsp.readFile(DESCRIPTOR_DATA, 'utf8');
  const doc = JSON.parse(content);

  // Structure
  assert.equal(doc.schemaVersion, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(doc.schemaId.includes('descriptor'));
  assert.ok(doc.description.length > 0, 'description should not be empty');
  assert.ok(Array.isArray(doc.fields), 'should have top-level fields');
  assert.ok(doc.fields.length >= 2, 'descriptor should have at least meta and component');

  // meta
  const meta = doc.fields.find((f) => f.name === 'meta');
  assert.ok(meta, 'should have meta field');
  assert.equal(meta.required, true);
  assert.equal(meta.type, 'object');
  assert.ok(meta.properties.length >= 1);

  // component
  const comp = doc.fields.find((f) => f.name === 'component');
  assert.ok(comp, 'should have component field');
  assert.equal(comp.required, true);
  assert.ok(comp.properties.length >= 5);

  // $ref resolution: component.name should have componentName pattern + maxLength
  const compName = comp.properties.find((f) => f.name === 'name');
  assert.ok(compName);
  assert.ok(compName.constraints);
  assert.ok(compName.constraints.pattern, 'name should have pattern from resolved $ref');
  assert.ok(compName.constraints.maxLength, 'name should have maxLength from resolved $ref');

  // resources (oneOf or direct properties)
  const resources = comp.properties.find((f) => f.name === 'resources');
  assert.ok(resources);
  assert.ok(resources.variants || resources.properties, 'resources should have variants or properties');

  // signatures
  const sigs = doc.fields.find((f) => f.name === 'signatures');
  assert.ok(sigs);
  assert.equal(sigs.required, false);

  // definitionNames
  assert.ok(Array.isArray(doc.definitionNames));
  assert.ok(doc.definitionNames.includes('component'));
  assert.ok(doc.definitionNames.includes('label'));
  assert.ok(doc.definitionNames.includes('signature'));
});

test('integration: constructor schema resolves without error', async () => {
  await assert.doesNotReject(fsp.access(CONSTRUCTOR_PATH));

  const { execFile } = require('node:child_process');
  const { promisify } = require('node:util');
  const execFileAsync = promisify(execFile);

  await execFileAsync('node', [
    path.join(__dirname, 'resolve-schema.js'),
    'static/schemas/ocm-constructor.json',
    'constructor',
  ], { cwd: REPO_ROOT });

  const content = await fsp.readFile(CONSTRUCTOR_DATA, 'utf8');
  const doc = JSON.parse(content);

  assert.equal(doc.schemaVersion, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(doc.description.includes('Constructor'));
  assert.ok(doc.variants);
  assert.equal(doc.variants.type, 'oneOf');
  assert.equal(doc.variants.options.length, 2);

  // Variant 1: components array
  const variant1 = doc.variants.options[0];
  assert.ok(variant1.properties);
  const components = variant1.properties.find((f) => f.name === 'components');
  assert.ok(components);
  assert.equal(components.required, true);

  // Variant 2: single component
  const variant2 = doc.variants.options[1];
  assert.ok(variant2.properties);
  const v2name = variant2.properties.find((f) => f.name === 'name');
  assert.ok(v2name);
  assert.equal(v2name.required, true);
});

test('integration: no circular references produce infinite nesting', async () => {
  const stats = await fsp.stat(DESCRIPTOR_DATA);
  assert.ok(stats.size < 500_000, `descriptor.json should be < 500KB (was ${stats.size})`);

  const content = await fsp.readFile(DESCRIPTOR_DATA, 'utf8');
  const countCircular = (content.match(/"circular"\s*:\s*true/g) || []).length;
  assert.ok(countCircular < 50, `should not have excessive circular markers (found ${countCircular})`);
});

// ===========================================================================
// Integration: Hugo build + HTML output
// ===========================================================================

test('integration: Hugo build succeeds with schema pages', async () => {
  const { execFile } = require('node:child_process');
  const { promisify } = require('node:util');
  const execFileAsync = promisify(execFile);

  const { stdout, stderr } = await execFileAsync(
    './node_modules/.bin/hugo',
    ['--minify', '--gc'],
    { cwd: REPO_ROOT, timeout: 60_000 }
  );

  const output = stdout + stderr;
  assert.ok(!output.includes('ERROR'), `Hugo build should not have errors:\n${output.slice(0, 500)}`);
});

test('integration: descriptor HTML page structure', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // Container + table structure
  assert.ok(content.includes('ocm-schema-reference'), 'should have schema reference container');
  assert.ok(content.includes('ocm-schema-table'), 'should have schema table');
  assert.ok(content.includes('ocm-schema-meta'), 'should have schema metadata section');

  // Metadata
  assert.ok(content.includes('json-schema.org/draft/2020-12/schema'), 'should show schema version');
  assert.ok(content.includes('ocm-descriptor.json'), 'should have download link');

  // Fields
  assert.ok(content.includes('ocm-schema-field-code'), 'should have field code elements');
  assert.ok(content.includes('>meta<'), 'should render meta field');
  assert.ok(content.includes('>component<'), 'should render component field');

  // Type badges
  assert.ok(content.includes('ocm-type-object'), 'should have object type badge');
  assert.ok(content.includes('ocm-type-string'), 'should have string type badge');

  // Required badges
  assert.ok(content.includes('ocm-schema-badge-required'), 'should have required badges');

  // Constraints
  assert.ok(content.includes('pattern:'), 'should render pattern constraints');

  // Toggle buttons (collapse/expand)
  assert.ok(content.includes('ocm-schema-toggle'), 'should have toggle buttons');
  assert.ok(content.includes('data-schema-toggle'), 'should have toggle data attributes');
  assert.ok(content.includes('data-schema-parent'), 'should have parent data attributes');

  // JS collapse/expand (minified — check stable markers only)
  assert.ok(content.includes('ocm-schema-expanded'), 'should have expanded state class');

  // No Hugo template escaping bugs
  assert.ok(!content.includes('ZgotmplZ'), 'should not contain ZgotmplZ escaped styles');

  // No raw Go map[] from complex examples
  assert.ok(!content.includes('map['), 'should not contain Go map[] string output');
});

test('integration: descriptor HTML has stable anchor IDs', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // Helper: match both quoted and unquoted HTML attribute forms
  const hasAttr = (attr, val) => content.includes(`${attr}="${val}"`) || content.includes(`${attr}=${val}`);

  // Top-level fields: simple name as ID
  assert.ok(hasAttr('id', 'meta'), 'should have id="meta"');
  assert.ok(hasAttr('id', 'component'), 'should have id="component"');

  // Nested fields: dot-separated path as ID
  assert.ok(hasAttr('id', 'component.name'), 'should have id="component.name"');
  assert.ok(hasAttr('id', 'component.version'), 'should have id="component.version"');
  assert.ok(hasAttr('id', 'component.provider'), 'should have id="component.provider"');

  // Anchor href links match the IDs
  assert.ok(hasAttr('href', '#meta'), 'should have anchor href to #meta');
  assert.ok(hasAttr('href', '#component.name'), 'should have anchor href to #component.name');

  // Anchor links use the correct class
  assert.ok(content.includes('ocm-schema-anchor'), 'should have ocm-schema-anchor class');
});

test('integration: descriptor HTML has hash-navigation JS', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // Hash navigation: auto-expand ancestors + scroll + highlight
  assert.ok(content.includes('hashchange'), 'should listen for hashchange events');
  assert.ok(content.includes('scrollIntoView'), 'should scroll to anchored field');
  assert.ok(content.includes('ocm-schema-highlight'), 'should apply highlight class');
});

test('integration: constructor HTML page structure', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-constructor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // Variants section
  assert.ok(content.includes('Schema Variants'), 'should have schema variants section');
  assert.ok(content.includes('Variant 1'), 'should have variant 1');
  assert.ok(content.includes('Variant 2'), 'should have variant 2');

  // Table
  assert.ok(content.includes('ocm-schema-table'), 'should have schema table');
  assert.ok(content.includes('ocm-schema-field-code'), 'should have field code elements');

  // No bugs
  assert.ok(!content.includes('ZgotmplZ'), 'should not contain ZgotmplZ');

  // Anchor links present
  assert.ok(content.includes('ocm-schema-anchor'), 'should have anchor links');
  assert.ok(content.match(/id="?components"?/), 'should have id for components field');
});

test('integration: raw JSON schemas served in static/', async () => {
  const descriptorRaw = path.join(REPO_ROOT, 'public/schemas/ocm-descriptor.json');
  const constructorRaw = path.join(REPO_ROOT, 'public/schemas/ocm-constructor.json');

  const descContent = await fsp.readFile(descriptorRaw, 'utf8');
  const descJson = JSON.parse(descContent);
  assert.equal(descJson.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(descJson.$defs, 'raw descriptor should have $defs (not resolved)');

  const consContent = await fsp.readFile(constructorRaw, 'utf8');
  const consJson = JSON.parse(consContent);
  assert.equal(consJson.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(consJson.$defs, 'raw constructor should have $defs (not resolved)');
});

// ===========================================================================
// Bugfix regression tests
// ===========================================================================

test('bugfix: depth 0 and depth 1 fields start expanded', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // No depth-1 row should have data-schema-collapsed
  const depth1Collapsed = (content.match(/data-schema-depth="?1"?[^>]*data-schema-collapsed/g) || []);
  assert.equal(depth1Collapsed.length, 0, 'no depth-1 row should be collapsed');

  // Depth-2 rows that are expandable should have data-schema-collapsed
  const depth2Collapsed = (content.match(/data-schema-depth="?2"?[^>]*data-schema-collapsed/g) || []);
  assert.ok(depth2Collapsed.length > 0, 'some depth-2 rows should start collapsed');
});

test('bugfix: oneOf with simple types has no toggle button', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // component.labels.version is oneOf(string|null) — should NOT have a toggle.
  // Extract the row by finding the id and its surrounding <tr>...</tr>.
  // The id attribute may be quoted or unquoted depending on Hugo minification.
  const versionRowMatch = content.match(/id="?component\.labels\.version"?[\s\S]*?<\/tr>/);
  assert.ok(versionRowMatch, 'should find component.labels.version row');
  const versionRow = versionRowMatch[0];
  assert.ok(versionRow.includes('ocm-schema-expand-space'), 'oneOf(string|null) should have expand-space, not toggle');
  assert.ok(!versionRow.includes('ocm-schema-toggle'), 'oneOf(string|null) should NOT have toggle button');

  // It should show inline variant options instead
  assert.ok(versionRow.includes('ocm-schema-variant-inline'), 'should show inline variant type info');
  assert.ok(versionRow.includes('ocm-schema-variant-option'), 'should list variant options (string, null)');
});

test('bugfix: no orphan toggle buttons (every toggle has children)', async () => {
  const htmlPath = path.join(REPO_ROOT, 'public/dev/docs/reference/ocm-descriptor/index.html');
  const content = await fsp.readFile(htmlPath, 'utf8');

  // Extract all toggle target IDs (handle both quoted and unquoted attributes)
  const toggleMatches = content.match(/data-schema-toggle="?([a-z0-9-]+)"?/g) || [];
  const toggleIds = toggleMatches.map((m) => m.replace(/data-schema-toggle="?/, '').replace(/"$/, ''));

  // Each toggle ID should have at least one child row
  for (const id of toggleIds) {
    // Handle both quoted and unquoted attribute forms
    const hasChild = content.includes(`data-schema-parent="${id}"`) || content.includes(`data-schema-parent=${id}`);
    assert.ok(hasChild, `toggle ${id} should have at least one child row`);
  }
});
