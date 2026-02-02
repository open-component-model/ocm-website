#!/usr/bin/env node
/**
 * Cut off a new versioned snapshot of content
 *
 * Usage:
 *   node .github/scripts/cutoff-version.js X.Y.Z
 *
 * Behavior:
 * - Accepts SemVer version X.Y.Z. Only SemVer without leading "v" or any suffix is supported
 * - Copies content/ to content_versioned/version-X.Y.Z
 * - Updates config/_default/hugo.toml:
 *   - Create [versions."X.Y.Z"] under [versions]
 * - Updates config/_default/module.toml:
 *   - Appends a grouped section:
 *
 *     # X.Y.Z
 *     [[mounts]]
 *       source = "content_versioned/version-X.Y.Z"
 *       target = "content"
 *       [mounts.sites.matrix]
 *         versions = ["X.Y.Z"]
 *
 *     [[imports]]
 *       path = "ocm.software/open-component-model/cli"
 *       version = "vX.Y.Z"
 *       [[imports.mounts]]
 *         source = "docs/reference"
 *         target = "content/docs/reference/ocm-cli"
 *         [imports.mounts.sites.matrix]
 *           versions = ["X.Y.Z"]
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

/* Helper functions */

// Log message to stdout
function log(msg) {
  process.stdout.write(`${msg}\n`);
}

// Log error message to stderr and exit with status 1
function fail(msg) {
  process.stderr.write(`[ERROR] ${msg}\n`);
  process.exit(1);
}

// Validate and extract SemVer version from first command line argument
// NOTE: We intentionally restrict to numeric X.Y.Z only (no prerelease or build metadata).
function parseVersionArgument(args) {
  if (args.length === 0) {
    fail('Missing version argument. Usage: node .github/scripts/cutoff-version.js X.Y.Z. Only SemVer format without leading "v" or any suffix is supported.');
  }

  const version = args[0].trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`Invalid version '${version}'. Expected numeric SemVer X.Y.Z (no prerelease/build metadata), e.g., 1.2.3`);
  }

  return version;
}

/* Update config/_default/hugo.toml */

// Append [versions."X.Y.Z"] after last stanza under [versions]
async function ensureHugoVersionStanza(repoRoot, version) {
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  // Return if version already exists (escape dots for regex)
  const versionPattern = version.replace(/\./g, '\\.');
  const existsRe = new RegExp(`^\\s*\\[versions\\."${versionPattern}"]\\s*$`, 'm');
  if (existsRe.test(content)) {
    log(`hugo.toml already contains stanza for ${version}.`);
    return;
  }

  // Build insertion line
  const insertion = `  [versions."${version}"]\n`;

  // Find last version under [versions] and append new one
  const subRe = /^\s*\[versions\.[^\]]+]\s*$/gm;
  let lastMatch = null;
  let match;
  while ((match = subRe.exec(content)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    let pos = lastMatch.index + lastMatch[0].length;
    // Skip past newline to start of next line
    if (content[pos] === '\n') {
      pos += 1;
    }

    // Skip indented properties (e.g. "weight = 2") until next stanza or blank line
    let scanPos = pos;
    while (scanPos < content.length) {
      const nl = content.indexOf('\n', scanPos);
      const lineEnd = nl === -1 ? content.length : nl;
      const line = content.slice(scanPos, lineEnd);

      if (line.startsWith('  [')) {
        // Insert before next stanza
        break;
      }
      if (!line.startsWith('  ') || line.trim().length === 0) {
        // Stop at unindented or blank line
        break;
      }

      // Skip indented property line
      scanPos = nl === -1 ? content.length : nl + 1;
    }

    const updated = content.slice(0, scanPos) + insertion + content.slice(scanPos);
    await fsp.writeFile(tomlPath, updated, 'utf-8');
    log(`Inserted [versions."${version}"] after last version stanza.`);
    return;
  }

  // Could not find any version under [versions]
  fail('Could not locate existing [versions] stanza to append to. Ensure [versions] has at least one version.');
}

/* Update config/_default/module.toml */

// Build version block (mounts + imports) as TOML formatted string
function buildGroupedVersionBlock(version) {
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

// Append new block for new version
async function updateModuleToml(repoRoot, version) {
  const modulePath = path.join(repoRoot, 'config', '_default', 'module.toml');
  let content;
  try {
    content = await fsp.readFile(modulePath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${modulePath}: ${e.message}`);
  }

  const sourceLine = `source = "content_versioned/version-${version}"`;
  if (content.includes(sourceLine)) {
    fail(`module.toml already contains mounts for ${version}. Aborting.`);
  }

  const grouped = buildGroupedVersionBlock(version);
  const updated = content.replace(/\s*$/, '') + '\n' + grouped;
  await fsp.writeFile(modulePath, updated, 'utf-8');
  log(`Appended grouped module.toml section for ${version}.`);
}

/* Main execution */

// Execute all cut-off steps
async function main() {
  const args = process.argv.slice(2);
  const version = parseVersionArgument(args);

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

  // Update Hugo versions configuration
  await ensureHugoVersionStanza(repoRoot, version);

  // Update module.toml mounts & imports
  await updateModuleToml(repoRoot, version);

  log('Cutoff completed successfully.');
}

main().catch((e) => {
  fail(e.stack || e.message || String(e));
});