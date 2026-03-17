#!/usr/bin/env node
/**
 * Resolve JSON Schema $ref/$defs and transform into a Hugo-friendly flat data structure.
 *
 * Usage:
 *   node .github/scripts/resolve-schema.js <input.json> <output-key>
 *
 * Example:
 *   node .github/scripts/resolve-schema.js static/schemas/ocm-descriptor.json descriptor
 *   -> writes data/schemas/descriptor.json
 *
 * The output is a flat tree structure that Hugo templates can iterate
 * to render an interactive, collapsible schema reference page.
 *
 * The script uses @apidevtools/json-schema-ref-parser to resolve all references
 * and then transforms the schema into a format that captures types, descriptions,
 * constraints, and variants in a way that's easy to render in the documentation.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');
const $RefParser = require('@apidevtools/json-schema-ref-parser');

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'data', 'schemas');

// Track visited schemas during recursion to prevent infinite loops from circular $ref
const MAX_DEPTH = 12;

/**
 * Determine the display type string for a schema node.
 */
function getDisplayType(schema) {
  if (!schema) return 'any';
  if (schema.const !== undefined) return `const: ${JSON.stringify(schema.const)}`;
  if (schema.enum) return `enum`;
  if (schema.type === 'array') {
    if (schema.items) return `[]${getDisplayType(schema.items)}`;
    return '[]any';
  }
  if (schema.type) return Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
  if (schema.oneOf) return 'oneOf';
  if (schema.anyOf) return 'anyOf';
  if (schema.allOf) return 'allOf';
  return 'any';
}

/**
 * Collect constraints (pattern, format, minLength, etc.) from a schema node.
 */
function getConstraints(schema) {
  const constraints = {};
  const keys = [
    'pattern', 'format', 'minLength', 'maxLength', 'minimum', 'maximum',
    'exclusiveMinimum', 'exclusiveMaximum', 'minItems', 'maxItems',
    'minProperties', 'maxProperties', 'additionalProperties',
  ];
  for (const k of keys) {
    if (schema[k] !== undefined) constraints[k] = schema[k];
  }
  return Object.keys(constraints).length > 0 ? constraints : undefined;
}

/**
 * Derive a readable label for a variant (oneOf/anyOf/allOf option).
 */
function getVariantLabel(variant, index) {
  if (variant.type) return Array.isArray(variant.type) ? variant.type.join(' | ') : variant.type;
  if (variant.description) return variant.description.slice(0, 60);
  return `Option ${index + 1}`;
}

/**
 * Recursively transform a resolved JSON Schema node into a Hugo-friendly field tree.
 *
 * @param {string} name - Field name
 * @param {object} schema - The (dereferenced) JSON Schema node
 * @param {string[]} requiredList - Parent's required array
 * @param {number} depth - Current nesting depth
 * @param {Set} visited - Set of schema objects already visited (circular ref guard)
 * @returns {object} Hugo-friendly field descriptor
 */
function transformField(name, schema, requiredList = [], depth = 0, visited = new Set()) {
  if (!schema || typeof schema !== 'object') {
    return { name, type: 'any', description: '' };
  }

  // Circular reference guard
  if (visited.has(schema) || depth > MAX_DEPTH) {
    return {
      name,
      type: getDisplayType(schema),
      description: schema.description || '',
      circular: true,
    };
  }
  visited.add(schema);

  const field = {
    name,
    type: getDisplayType(schema),
    description: schema.description || '',
    required: requiredList.includes(name),
  };

  const constraints = getConstraints(schema);
  if (constraints) field.constraints = constraints;
  if (schema.enum) field.enumValues = schema.enum;
  if (schema.examples && schema.examples.length > 0) {
    // Pre-filter to only simple types that the Hugo template can render
    const simple = schema.examples.filter((e) => ['string', 'number', 'boolean'].includes(typeof e));
    if (simple.length > 0) field.examples = simple;
  }

  // Handle object properties
  if (schema.properties) {
    const req = schema.required || [];
    field.properties = Object.entries(schema.properties).map(
      ([childName, childSchema]) => transformField(childName, childSchema, req, depth + 1, new Set(visited))
    );
  }

  // Handle array items
  if (schema.type === 'array' && schema.items) {
    if (schema.items.properties) {
      const req = schema.items.required || [];
      field.properties = Object.entries(schema.items.properties).map(
        ([childName, childSchema]) => transformField(childName, childSchema, req, depth + 1, new Set(visited))
      );
    }
  }

  // Handle oneOf / anyOf / allOf -- expose as variants
  for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
    if (schema[keyword] && Array.isArray(schema[keyword])) {
      field.variants = {
        type: keyword,
        options: schema[keyword].map((variant, i) => {
          const variantField = transformField(
            `${keyword}[${i}]`,
            variant,
            [],
            depth + 1,
            new Set(visited)
          );
          // Promote a readable label
          variantField.label = getVariantLabel(variant, i);
          return variantField;
        }),
      };
      // If there are no direct properties but variants have properties, note it
      if (!field.properties && field.variants.options.some((v) => v.properties)) {
        field.type = keyword;
      }
    }
  }

  // Handle propertyNames
  if (schema.propertyNames) {
    field.propertyNames = {
      description: schema.propertyNames.description || '',
      constraints: getConstraints(schema.propertyNames),
    };
  }

  visited.delete(schema);
  return field;
}

/**
 * Transform the top-level schema into a structured document.
 */
function transformSchema(schema, originalSchema) {
  const doc = {
    title: schema.title || originalSchema.title || '',
    description: schema.description || originalSchema.description || '',
    schemaId: originalSchema.$id || '',
    schemaVersion: originalSchema.$schema || '',
  };

  // Top-level properties
  if (schema.properties) {
    const req = schema.required || [];
    doc.fields = Object.entries(schema.properties).map(
      ([name, prop]) => transformField(name, prop, req, 0, new Set())
    );
  }

  // Handle top-level oneOf (like the Constructor schema)
  if (schema.oneOf) {
    doc.variants = {
      type: 'oneOf',
      options: schema.oneOf.map((variant, i) => {
        const variantField = transformField(
          `oneOf[${i}]`,
          variant,
          [],
          0,
          new Set()
        );
        variantField.label = getVariantLabel(variant, i);
        return variantField;
      }),
    };
  }

  return doc;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    throw new Error('Usage: resolve-schema.js <input.json> <output-key>\n  Example: resolve-schema.js static/schemas/ocm-descriptor.json descriptor');
  }

  const [inputRelative, outputKey] = args;
  const inputPath = path.resolve(REPO_ROOT, inputRelative);
  const outputPath = path.join(OUTPUT_DIR, `${outputKey}.json`);

  // Read original schema (before resolution) for metadata
  const originalContent = await fsp.readFile(inputPath, 'utf8');
  const originalSchema = JSON.parse(originalContent);

  // Resolve all $ref/$defs
  const resolved = await $RefParser.dereference(inputPath, {
    dereference: {
      circular: 'ignore', // prevent infinite expansion of circular refs
    },
  });

  // Transform into Hugo-friendly structure
  const doc = transformSchema(resolved, originalSchema);

  // Ensure output directory exists
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  // Write output
  await fsp.writeFile(outputPath, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`Schema resolved and written to ${path.relative(REPO_ROOT, outputPath)}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { getDisplayType, getConstraints, getVariantLabel, transformField, transformSchema };
