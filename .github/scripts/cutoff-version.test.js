// Tests for cutoff-version.js
// Executed with: `node .github/scripts/cutoff-version.test.js` or `npm test`

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hasMountForVersion,
  hasImportForVersion,
  buildVersionBlock,
  parseArguments,
} = require('./cutoff-version');

/* buildVersionBlock tests */

test('buildVersionBlock includes comment and mount/import blocks', () => {
  const block = buildVersionBlock('2.3.4');
  assert.ok(block.includes('# 2.3.4'));
  assert.ok(block.includes('[[mounts]]'));
  assert.ok(block.includes('[[imports]]'));
  assert.ok(block.includes('versions = ["2.3.4"]'));
  assert.ok(block.includes('version = "v2.3.4"'));
  assert.ok(block.includes('content_versioned/version-2.3.4'));
});

/* hasMountForVersion tests */

test('hasMountForVersion returns true when version exists', () => {
  const parsed = { mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] };
  assert.equal(hasMountForVersion(parsed, '1.0.0'), true);
});

test('hasMountForVersion returns false when version missing', () => {
  const parsed = { mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] };
  assert.equal(hasMountForVersion(parsed, '2.0.0'), false);
});

test('hasMountForVersion handles null/undefined gracefully', () => {
  assert.equal(hasMountForVersion(null, '1.0.0'), false);
  assert.equal(hasMountForVersion(undefined, '1.0.0'), false);
  assert.equal(hasMountForVersion({}, '1.0.0'), false);
  assert.equal(hasMountForVersion({ mounts: null }, '1.0.0'), false);
  assert.equal(hasMountForVersion({ mounts: [] }, '1.0.0'), false);
  assert.equal(hasMountForVersion({ mounts: [{}] }, '1.0.0'), false);
  assert.equal(hasMountForVersion({ mounts: [{ sites: null }] }, '1.0.0'), false);
});

/* hasImportForVersion tests */

test('hasImportForVersion returns true when version exists', () => {
  const parsed = {
    imports: [{ mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] }],
  };
  assert.equal(hasImportForVersion(parsed, '1.0.0'), true);
});

test('hasImportForVersion returns false when version missing', () => {
  const parsed = {
    imports: [{ mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] }],
  };
  assert.equal(hasImportForVersion(parsed, '2.0.0'), false);
});

test('hasImportForVersion handles null/undefined gracefully', () => {
  assert.equal(hasImportForVersion(null, '1.0.0'), false);
  assert.equal(hasImportForVersion(undefined, '1.0.0'), false);
  assert.equal(hasImportForVersion({}, '1.0.0'), false);
  assert.equal(hasImportForVersion({ imports: null }, '1.0.0'), false);
  assert.equal(hasImportForVersion({ imports: [] }, '1.0.0'), false);
  assert.equal(hasImportForVersion({ imports: [{}] }, '1.0.0'), false);
  assert.equal(hasImportForVersion({ imports: [{ mounts: null }] }, '1.0.0'), false);
});

/* parseArguments tests */

test('parseArguments parses version correctly', () => {
  const result = parseArguments(['1.2.3']);
  assert.equal(result.version, '1.2.3');
  assert.equal(result.keepDefault, false);
});

test('parseArguments handles --keepDefault flag', () => {
  const result = parseArguments(['1.2.3', '--keepDefault']);
  assert.equal(result.version, '1.2.3');
  assert.equal(result.keepDefault, true);
});

test('parseArguments handles flag before version', () => {
  const result = parseArguments(['--keepDefault', '1.2.3']);
  assert.equal(result.version, '1.2.3');
  assert.equal(result.keepDefault, true);
});

test('parseArguments throws on missing version', () => {
  assert.throws(
    () => parseArguments([]),
    { message: /Missing version argument/ }
  );
});

test('parseArguments throws on invalid version format', () => {
  assert.throws(
    () => parseArguments(['v1.2.3']),
    { message: /Invalid version.*Expected numeric SemVer/ }
  );
  assert.throws(
    () => parseArguments(['1.2']),
    { message: /Invalid version/ }
  );
  assert.throws(
    () => parseArguments(['1.2.3-beta']),
    { message: /Invalid version/ }
  );
});

test('parseArguments throws on unknown flags', () => {
  assert.throws(
    () => parseArguments(['1.2.3', '--unknown']),
    { message: /Unknown flag.*--unknown/ }
  );
  assert.throws(
    () => parseArguments(['1.2.3', '--foo', '--bar']),
    { message: /Unknown flag.*--foo.*--bar/ }
  );
});

test('parseArguments trims whitespace from version', () => {
  const result = parseArguments(['  1.2.3  ']);
  assert.equal(result.version, '1.2.3');
});