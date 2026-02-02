const assert = require('assert');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');

const {
  parseVersionArgument,
  updateHugoToml,
  buildGroupedVersionBlock,
  updateModuleToml,
} = require('./cutoff-version.js');

// Test parseVersionArgument
console.log('Testing parseVersionArgument...');

assert.strictEqual(
  parseVersionArgument(['1.2.3']),
  '1.2.3',
  'Should accept numeric SemVer X.Y.Z'
);

assert.throws(
  () => parseVersionArgument(['1.2.3-rc.1']),
  /Invalid version/, 
  'Should reject prerelease versions and other suffixes'
);

assert.throws(
  () => parseVersionArgument([]),
  /Missing version argument/, 
  'Should reject missing argument'
);

// Test buildGroupedVersionBlock (module.toml snippet)
console.log('Testing buildGroupedVersionBlock...');

const block = buildGroupedVersionBlock('1.2.3');
assert.ok(
  block.includes('content_versioned/version-1.2.3'),
  'Block should include content mount source'
);
assert.ok(
  block.includes('versions = ["1.2.3"]'),
  'Block should include version in sites matrix'
);
assert.ok(
  block.includes('version = "v1.2.3"'),
  'Block should include CLI import version'
);

async function withTempConfigFile(filename, content, fn) {
  const tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'ocm-website-'));
  const configDir = path.join(tmpRoot, 'config', '_default');
  await fsp.mkdir(configDir, { recursive: true });
  const tomlPath = path.join(configDir, filename);
  await fsp.writeFile(tomlPath, content, 'utf-8');
  try {
    await fn(tmpRoot, tomlPath);
  } finally {
    await fsp.rm(tmpRoot, { recursive: true, force: true });
  }
}

async function runAsyncTests() {
  // Test updateHugoToml
  console.log('Testing updateHugoToml...');

  const baseToml = `
[versions]
  [versions."dev"]
    weight = 1
  [versions."1.0.0"]
    weight = 2

[params]
  foo = "bar"
`;

  await withTempConfigFile('hugo.toml', baseToml, async (tmpRoot, tomlPath) => {
    await updateHugoToml(tmpRoot, '1.2.3');
    const updated = await fsp.readFile(tomlPath, 'utf-8');

    const indexOld = updated.indexOf('[versions."1.0.0"]');
    const indexNew = updated.indexOf('[versions."1.2.3"]');
    assert.ok(indexNew > indexOld, 'New stanza should be appended after last version stanza');
  });

  // Test updateModuleToml
  console.log('Testing updateModuleToml...');

  const baseModuleToml = `
[[mounts]]
  source = "content"
  target = "content"
`;

  await withTempConfigFile('module.toml', baseModuleToml, async (tmpRoot, tomlPath) => {
    await updateModuleToml(tmpRoot, '1.2.3');
    const updated = await fsp.readFile(tomlPath, 'utf-8');

    const expectedSnippets = [
      'source = "content_versioned/version-1.2.3"',
      'versions = ["1.2.3"]',
    ];

    expectedSnippets.forEach((snippet) => {
      assert.ok(updated.includes(snippet), `module.toml should include '${snippet}'`);
    });
  });
}

runAsyncTests()
  .then(() => {
    console.log('✅ All tests passed.');
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });