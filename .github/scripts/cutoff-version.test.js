// Tests for cutoff-version.js

// Run: `npm test` or `node --test .github/scripts/cutoff-version.test.js`

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArguments, hasMountForVersion, hasImportForVersion } = require('./cutoff-version');

// Test parseArguments
test('parseArguments: valid version', () => {
    const result = parseArguments(['1.2.3']);
    assert.equal(result.version, '1.2.3');
    assert.equal(result.keepDefault, false);
});

test('parseArguments: with --keepDefault', () => {
    const result = parseArguments(['1.2.3', '--keepDefault']);
    assert.equal(result.version, '1.2.3');
    assert.equal(result.keepDefault, true);
});

test('parseArguments: missing version throws', () => {
    assert.throws(() => parseArguments([]), /Missing version/);
});

test('parseArguments: invalid version throws', () => {
    assert.throws(() => parseArguments(['v1.2.3']), /Invalid version/);
    assert.throws(() => parseArguments(['1.2']), /Invalid version/);
    assert.throws(() => parseArguments(['--keepDefault', 'test', '1.2.3']), /Invalid version/);
});

test('parseArguments: unknown flag throws', () => {
    assert.throws(() => parseArguments(['1.2.3', '--unknown']), /Unknown flag/);
});

// Test hasMountForVersion
test('hasMountForVersion: returns true/false correctly', () => {
    const parsed = { mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] };
    assert.equal(hasMountForVersion(parsed, '1.0.0'), true);
    assert.equal(hasMountForVersion(parsed, '2.0.0'), false);
    assert.equal(hasMountForVersion(null, '1.0.0'), false);
    assert.equal(hasMountForVersion({}, '1.0.0'), false);
});

// Test hasImportForVersion
test('hasImportForVersion: returns true/false correctly', () => {
    const parsed = { imports: [{ mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }] }] };
    assert.equal(hasImportForVersion(parsed, '1.0.0'), true);
    assert.equal(hasImportForVersion(parsed, '2.0.0'), false);
    assert.equal(hasImportForVersion(null, '1.0.0'), false);
    assert.equal(hasImportForVersion({}, '1.0.0'), false);
});

 