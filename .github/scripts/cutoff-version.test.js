// Tests for cutoff-version.js

// Run: `npm test` or `node --test .github/scripts/cutoff-version.test.js`

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArguments, hasMountForVersion, hasImportForVersion, buildModuleBlocks } = require('./cutoff-version');

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

// Test buildModuleBlocks
test('buildModuleBlocks: returns correct mount', () => {
    const { mount } = buildModuleBlocks('1.2.3');
    assert.deepEqual(mount.files, ['**', '!blog/**']);
    assert.equal(mount.source, 'content_versioned/version-1.2.3');
    assert.equal(mount.target, 'content');
    assert.deepEqual(mount.sites.matrix.versions, ['1.2.3']);
});

test('buildModuleBlocks: returns 4 imports (CLI + 3 schema)', () => {
    const { imports } = buildModuleBlocks('1.2.3');
    assert.equal(imports.length, 4);
});

test('buildModuleBlocks: CLI import is correct', () => {
    const { imports } = buildModuleBlocks('1.2.3');
    const cli = imports.find(i => i.path.endsWith('/cli'));
    assert.ok(cli, 'CLI import should exist');
    assert.equal(cli.version, 'v1.2.3');
    assert.equal(cli.mounts[0].target, 'content/docs/reference/ocm-cli');
    assert.deepEqual(cli.mounts[0].sites.matrix.versions, ['1.2.3']);
});

test('buildModuleBlocks: schema imports have correct targets', () => {
    const { imports } = buildModuleBlocks('2.0.0');
    const targets = imports.map(i => i.mounts[0].target).sort();
    assert.deepEqual(targets, [
        'content/docs/reference/ocm-cli',
        'static/2.0.0/schemas/bindings/go/constructor',
        'static/2.0.0/schemas/bindings/go/descriptor/v2',
        'static/2.0.0/schemas/kubernetes/controller',
    ]);
});

test('buildModuleBlocks: CLI and controller use versioned tag, bindings use latest', () => {
    const { imports } = buildModuleBlocks('3.1.4');
    const cli = imports.find(i => i.path.endsWith('/cli'));
    const controller = imports.find(i => i.path.endsWith('/kubernetes/controller'));
    const constructor = imports.find(i => i.path.endsWith('/bindings/go/constructor'));
    const descriptor = imports.find(i => i.path.endsWith('/bindings/go/descriptor/v2'));
    assert.equal(cli.version, 'v3.1.4');
    assert.equal(controller.version, 'v3.1.4');
    assert.equal(constructor.version, 'latest');
    assert.equal(descriptor.version, 'latest');
});

test('buildModuleBlocks: schema imports have correct sources', () => {
    const { imports } = buildModuleBlocks('1.0.0');
    const schemaImports = imports.filter(i => !i.path.endsWith('/cli'));
    const sources = schemaImports.map(i => i.mounts[0].source).sort();
    assert.deepEqual(sources, [
        'config/crd/bases',
        'resources',
        'spec/v1/resources',
    ]);
});

 