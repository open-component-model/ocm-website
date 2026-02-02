// Tests for cutoff-version.js
// Executed with: `node .github/scripts/cutoff-version.test.js` or `npm test`

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ensureHugoTomlVersion,
  buildGroupedVersionBlock,
  hasMountForVersion,
  hasImportForVersion,
  detectEol,
  parseArguments,
} = require('./cutoff-version');

test('ensureHugoTomlVersion sets defaultContentVersion without weight', () => {
  const parsed = {
    defaultContentVersion: 'legacy',
    versions: {
      legacy: { weight: 1 },
      dev: { weight: 2 },
    },
  };

  const updated = ensureHugoTomlVersion(parsed, '1.2.3', false);

  assert.equal(updated.defaultContentVersion, '1.2.3');
  assert.deepEqual(updated.versions['1.2.3'], {});
});

test('ensureHugoTomlVersion keeps defaultContentVersion when requested', () => {
  const parsed = {
    defaultContentVersion: 'legacy',
    versions: {
      legacy: { weight: 1 },
      dev: { weight: 2 },
    },
  };

  const updated = ensureHugoTomlVersion(parsed, '1.2.3', true);

  assert.equal(updated.defaultContentVersion, 'legacy');
  assert.deepEqual(updated.versions['1.2.3'], {});
});

test('buildGroupedVersionBlock omits comment and contains mount/import', () => {
  const block = buildGroupedVersionBlock('2.3.4');
  assert.ok(!block.includes('# 2.3.4'));
  assert.ok(block.includes('[[mounts]]'));
  assert.ok(block.includes('[[imports]]'));
  assert.ok(block.includes('versions = ["2.3.4"]'));
});

test('hasMountForVersion/hasImportForVersion detect versions correctly', () => {
  const parsed = {
    mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }],
    imports: [
      {
        mounts: [{ sites: { matrix: { versions: ['1.0.0'] } } }],
      },
    ],
  };

  assert.equal(hasMountForVersion(parsed, '1.0.0'), true);
  assert.equal(hasImportForVersion(parsed, '1.0.0'), true);
  assert.equal(hasMountForVersion(parsed, '2.0.0'), false);
  assert.equal(hasImportForVersion(parsed, '2.0.0'), false);
});

test('detectEol prefers CRLF when present', () => {
  assert.equal(detectEol('line\r\nnext\r\n'), '\r\n');
  assert.equal(detectEol('line\nnext\n'), '\n');
});

test('parseArguments handles --keepDefault flag', () => {
  const parsed = parseArguments(['1.2.3', '--keepDefault']);
  assert.equal(parsed.version, '1.2.3');
  assert.equal(parsed.keepDefault, true);
});