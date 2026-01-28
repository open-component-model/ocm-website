#!/usr/bin/env node
/**
 * Cut off a new versioned snapshot of content.
 *
 * Usage:
 *   node scripts/cutoff-version.js 1.2.3
 *
 * Behavior:
 * - Validates SemVer (x.y.z) without 'v' prefix.
 * - Copies content/ to content_versioned/version-x.y.z.
 * - Updates data/versions.json:
 *   - Adds x.y.z to versions[] if missing.
 *   - Sets defaultVersion to x.y.z.
 *   - Preserves existing "dev" entry if present; doesn't add it if it wasn't there.
 * - For versions other than 0.0.0, removes any copied CLI reference under
 *   content_versioned/version-x.y.z/docs/reference/ocm-cli to avoid duplicates,
 *   since CLI docs will be provided by the Hugo Module import during build.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function isSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`[ERROR] ${msg}\n`);
  process.exit(1);
}

async function pathExists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyDir(src, dest) {
  // Node 22 supports fs.promises.cp with { recursive: true }
  await fsp.cp(src, dest, { recursive: true, errorOnExist: false, force: true });
}

async function updateVersionsJson(repoRoot, newVer) {
  const versionsJsonPath = path.join(repoRoot, 'data', 'versions.json');
  let data = { defaultVersion: newVer, versions: [] };

  if (await pathExists(versionsJsonPath)) {
    try {
      const raw = await fsp.readFile(versionsJsonPath, 'utf-8');
      data = JSON.parse(raw);
      if (!Array.isArray(data.versions)) data.versions = [];
    } catch (e) {
      fail(`Failed to parse ${versionsJsonPath}: ${e.message}`);
    }
  } else {
    await ensureDir(path.dirname(versionsJsonPath));
  }

  // Add new version if missing
  if (!data.versions.includes(newVer)) {
    data.versions.push(newVer);
  }

  // Set defaultVersion to new version
  data.defaultVersion = newVer;

  // Keep as-is any existing 'dev' entry. Do not auto-insert if it wasn't there.
  // Persist pretty-printed JSON
  const out = JSON.stringify(data, null, 2) + '\n';
  await fsp.writeFile(versionsJsonPath, out, 'utf-8');
  log(`Updated ${path.relative(repoRoot, versionsJsonPath)} with defaultVersion=${newVer}`);
}

async function removeCopiedCliDocs(repoRoot, version) {
  if (version === '0.0.0') {
    // Special case: 0.0.0 keeps its historical CLI docs in the snapshot
    return;
  }
  const cliPath = path.join(
    repoRoot,
    'content_versioned',
    `version-${version}`,
    'docs',
    'reference',
    'ocm-cli'
  );
  if (await pathExists(cliPath)) {
    await fsp.rm(cliPath, { recursive: true, force: true });
    log(`Removed copied CLI docs from ${path.relative(repoRoot, cliPath)} to avoid duplicates.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    fail('Missing version argument. Usage: node scripts/cutoff-version.js x.y.z');
  }
  const ver = args[0].trim();
  if (!isSemver(ver)) {
    fail(`Invalid version '${ver}'. Expected SemVer without 'v' prefix, e.g., 1.2.3`);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const srcContent = path.join(repoRoot, 'content');
  const destDir = path.join(repoRoot, 'content_versioned', `version-${ver}`);

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

  log(`Creating snapshot: ${path.relative(repoRoot, destDir)}`);
  await ensureDir(path.dirname(destDir));
  await copyDir(srcContent, destDir);

  // Remove any copied CLI reference for versions other than 0.0.0
  await removeCopiedCliDocs(repoRoot, ver);

  // Update data/versions.json
  await updateVersionsJson(repoRoot, ver);

  log('Cutoff completed successfully.');
}

main().catch((e) => {
  fail(e.stack || e.message || String(e));
});