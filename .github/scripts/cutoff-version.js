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
 * - Appends [versions."X.Y.Z"] to hugo.toml (after GENERATED marker)
 * - Appends mount/import blocks to module.toml (after GENERATED marker)
 * - Optional --keepDefault keeps defaultContentVersion unchanged. Required until OCM v2 release.
 */

const fsp = require('node:fs/promises');
const path = require('path');
const MARKER = 'GENERATED VERSION';

/* Helper functions */

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[ERROR] ${msg}\n`);
  process.exit(1);
  throw new Error(msg); // Ensures execution stops even when process.exit is mocked
}

function createUserError(msg) {
  const err = new Error(msg);
  err.isUserError = true;
  return err;
}

 // Parse and validate SemVer version from CLI args
function parseVersionArgument(args) {
  if (args.length === 0) {
    throw createUserError(
      'Missing version argument. Usage: node .github/scripts/cutoff-version.js X.Y.Z'
    );
  }
  const version = args[0].trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw createUserError(
      `Invalid version '${version}'. Expected numeric SemVer X.Y.Z (e.g., 1.2.3)`
    );
  }
  return version;
}

// Parse CLI arguments into { version, keepDefault }
function parseArguments(args) {
  const versionArgs = args.filter((arg) => !arg.startsWith('--'));
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const version = parseVersionArgument(versionArgs);
  const keepDefault = flags.has('--keepDefault');
  flags.delete('--keepDefault');
  if (flags.size) {
    throw createUserError(`Unknown flag(s): ${[...flags].join(', ')}`);
  }
  return { version, keepDefault };
}

/* Update config/_default/hugo.toml */

// Append [versions."X.Y.Z"] to hugo.toml after the GENERATED marker
async function updateHugoToml(repoRoot, version, keepDefault) {
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  // Check if version already exists
  if (content.includes(`[versions."${version}"]`)) {
    log(`hugo.toml already contains ${version}, skipping.`);
    return;
  }

  // Verify marker exists
  if (!content.includes(MARKER)) {
    fail(`Marker "${MARKER}" not found in hugo.toml`);
  }

  // Append version stanza at end
  const stanza = `  [versions."${version}"]\n`;
  content = content.trimEnd() + '\n' + stanza;

  // Update defaultContentVersion if needed
  if (!keepDefault) {
    content = content.replace(
      /defaultContentVersion\s*=\s*"[^"]*"/,
      `defaultContentVersion = "${version}"`
    );
  }

  await fsp.writeFile(tomlPath, content, 'utf-8');
  log(`Updated hugo.toml with version ${version}.`);
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

// Append mount/import block after the GENERATED marker.
async function updateModuleToml(repoRoot, version) {
  const modulePath = path.join(repoRoot, 'config', '_default', 'module.toml');
  let content;
  try {
    content = await fsp.readFile(modulePath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${modulePath}: ${e.message}`);
  }

  // Check if version already exists (complete block with imports.mounts.sites.matrix)
  const completeMarker = `versions = ["${version}"]`;
  if (content.includes(`version-${version}"`) && content.includes(completeMarker)) {
    log(`module.toml already contains ${version}, skipping.`);
    return;
  }

  // Detect incomplete block (mount exists but not the full import structure)
  if (content.includes(`version-${version}"`)) {
    fail(`module.toml has incomplete block for ${version}. Fix manually before retrying.`);
  }

  // Verify marker exists
  if (!content.includes(MARKER)) {
    fail(`Marker "${MARKER}" not found in module.toml`);
  }

  // Append mount/import block at end
  content = content.trimEnd() + '\n' + buildVersionBlock(version);
  await fsp.writeFile(modulePath, content, 'utf-8');
  log(`Updated module.toml with version ${version}.`);
}

/* Main execution */

// Execute all cut-off steps
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
  const exists = await fsp.access(destDir).then(() => true).catch(() => false);
  if (exists) {
    fail(`Destination already exists: ${path.relative(repoRoot, destDir)}`);
  }

  log(`Creating snapshot: ${path.relative(repoRoot, destDir)}`);
  await fsp.mkdir(path.dirname(destDir), { recursive: true });
  await fsp.cp(srcContent, destDir, { recursive: true, errorOnExist: false, force: true });

  await updateHugoToml(repoRoot, version, keepDefault);
  await updateModuleToml(repoRoot, version);

  log('Cutoff completed successfully.');
}

if (require.main === module) {
  main().catch((e) => {
    if (e && e.isUserError) {
      fail(e.message);
      return;
    }
    fail(e.stack || e.message || String(e));
  });
}

module.exports = {
  MARKER,
  parseVersionArgument,
  parseArguments,
  updateHugoToml,
  buildVersionBlock,
  updateModuleToml,
  main,
};
