#!/usr/bin/env node
/**
 * Cut off a new versioned snapshot of content
 *
 * Usage:
 *   node .github/scripts/cutoff-version.js X.Y.Z [--keepDefault]
 *
 * Behavior:
 * - Accepts SemVer version X.Y.Z (no leading "v" or any suffix)
 * - Copies folder content/ to content_versioned/version-X.Y.Z
 * - Appends [versions."X.Y.Z"] to hugo.toml
 * - Appends mount/import blocks to module.toml
 * - Optional --keepDefault keeps defaultContentVersion unchanged
 */

const fsp = require('node:fs/promises');
const path = require('node:path');

/* TOML module lazy loader */
let tomlModule;
async function getTomlModule() {
  if (!tomlModule) {
    tomlModule = await import('@rainbowatcher/toml-edit-js');
    if (typeof tomlModule.init === 'function') await tomlModule.init();
  }
  return tomlModule;
}

// Log error and exit
function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
  throw new Error(msg); // Ensures execution stops when process.exit is mocked in tests
}

// Check if path exists
async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

// Parse TOML content
async function parseToml(content, filePath) {
  try {
    const { parse } = await getTomlModule();
    return parse(content);
  } catch (e) {
    fail(`Failed to parse ${filePath}: ${e.message}`);
  }
}

// Parse CLI arguments into { version, keepDefault }
function parseArguments(args) {
  let version = null;
  let keepDefault = false;
  const unknownFlags = [];

  for (const arg of args) {
    if (arg === '--keepDefault') {
      keepDefault = true;
    } else if (arg.startsWith('--')) {
      unknownFlags.push(arg);
    } else if (!version) {
      version = arg.trim();
    }
  }

  if (!version) {
    throw new Error('Missing version argument. Usage: node .github/scripts/cutoff-version.js X.Y.Z [--keepDefault]');
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version '${version}'. Expected numeric SemVer X.Y.Z (e.g., 1.2.3) without leading 'v' or suffix.`);
  }
  if (unknownFlags.length) {
    throw new Error(`Unknown flag(s): ${unknownFlags.join(', ')}`);
  }

  return { version, keepDefault };
}

/* Update config/_default/hugo.toml */

async function updateHugoToml(repoRoot, version, keepDefault) {
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  const parsed = await parseToml(content, tomlPath);

  if (parsed?.versions?.[version]) {
    console.log(`hugo.toml already contains ${version}, skipping.`);
    return;
  }

  const { edit } = await getTomlModule();
  let updated = edit(content, `versions."${version}"`, {}, { inline: false });

  // Normalize indentation of new stanza header
  const stanzaHeader = `[versions."${version}"]`;
  updated = updated.replace(new RegExp(`\\n\\n?${stanzaHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `\n  ${stanzaHeader}`);

  if (!keepDefault) {
    updated = edit(updated, 'defaultContentVersion', version);
  }

  await fsp.writeFile(tomlPath, updated, 'utf-8');
  console.log(`Updated hugo.toml with version ${version}.`);
}

/* Update config/_default/module.toml */

// Build mount/import block as TOML formatted string
function buildVersionBlock(version) {
  return `
# ${version}
[[mounts]]
  source = "content_versioned/version-${version}"
  target = "content"
  [mounts.sites.matrix]
    versions = ["${version}"]

[[imports]]
  path = "ocm.software/open-component-model/cli"
  version = "v${version}"
  [[imports.mounts]]
    source = "docs/reference"
    target = "content/docs/reference/ocm-cli"
    [imports.mounts.sites.matrix]
      versions = ["${version}"]
`;
}

function hasMountForVersion(parsed, version) {
  return parsed?.mounts?.some((m) => m?.sites?.matrix?.versions?.includes(version)) ?? false;
}

function hasImportForVersion(parsed, version) {
  return parsed?.imports?.some((i) =>
    i?.mounts?.some((m) => m?.sites?.matrix?.versions?.includes(version))
  ) ?? false;
}

async function updateModuleToml(repoRoot, version) {
  const modulePath = path.join(repoRoot, 'config', '_default', 'module.toml');
  let content;
  try {
    content = await fsp.readFile(modulePath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${modulePath}: ${e.message}`);
  }

  const parsed = await parseToml(content, modulePath);
  const hasMount = hasMountForVersion(parsed, version);
  const hasImport = hasImportForVersion(parsed, version);

  if (hasMount && hasImport) {
    console.log(`module.toml already contains ${version}, skipping.`);
    return;
  }

  if (hasMount || hasImport) {
    fail(`module.toml has incomplete block for ${version}. Fix manually before retrying.`);
  }

  content = content.trimEnd() + '\n' + buildVersionBlock(version);
  await fsp.writeFile(modulePath, content, 'utf-8');
  console.log(`Updated module.toml with version ${version}.`);
}

/* Main execution */

async function main() {
  const { version, keepDefault } = parseArguments(process.argv.slice(2));

  const repoRoot = path.resolve(__dirname, '../..');
  const srcContent = path.join(repoRoot, 'content');
  const destDir = path.join(repoRoot, 'content_versioned', `version-${version}`);

  // Validate source content exists
  try {
    const st = await fsp.stat(srcContent);
    if (!st.isDirectory()) {
      fail(`Source content path is not a directory: ${srcContent}`);
    }
  } catch {
    fail(`Source content folder not found: ${srcContent}`);
  }

  // Prevent overwrite
  if (await pathExists(destDir)) {
    fail(`Destination already exists: ${path.relative(repoRoot, destDir)}`);
  }

  console.log(`Creating snapshot: ${path.relative(repoRoot, destDir)}`);
  await fsp.mkdir(path.dirname(destDir), { recursive: true });
  await fsp.cp(srcContent, destDir, { recursive: true });

  await updateHugoToml(repoRoot, version, keepDefault);
  await updateModuleToml(repoRoot, version);

  console.log('Cutoff completed successfully.');
}

if (require.main === module) {
  main().catch((e) => {
    fail(e.message || String(e));
  });
}

module.exports = {
  hasMountForVersion,
  hasImportForVersion,
  buildVersionBlock,
  parseArguments,
};