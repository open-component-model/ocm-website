#!/usr/bin/env node
/**
 * Cut off a new versioned snapshot of content.
 *
 * Usage:
 *   node .github/scripts/cutoff-version.js 1.2.3
 *
 * Behavior:
 * - Validates SemVer (x.y.z) without 'v' prefix.
 * - Copies content/ to content_versioned/version-vx.y.z.
 * - Updates config/_default/hugo.toml:
 *   - Ensures a [versions] section exists.
 *   - Adds x.y.z to versions = ["..."] if missing.
 *   - Does NOT change defaultContentVersion (default stays as configured, e.g. "old").
 * - No embedded CLI reference docs to remove (reference docs are mounted via Hugo module imports).
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

function parseTomlArray(str) {
  // Expects something like: versions = ["dev","0.0.0","0.0.1"]
  // Return array of strings without quotes/spaces.
  const inside = str.replace(/^[^\[]*\[/, '').replace(/\][^\]]*$/, '');
  const parts = inside.split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(p => p.replace(/^"(.*)"$/, '$1'));
}

function formatTomlArray(arr) {
  // Compact array formatting: ["a","b","c"]
  return `[${arr.map(v => `"${v}"`).join(',')}]`;
}

async function updateHugoToml(repoRoot, newVer) {
  // Ensure a per-version stanza [versions."v{x.y.z}"] exists with a proper weight.
  // Do NOT change defaultContentVersion here (default remains as configured, e.g. "old").
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  const vVer = `v${newVer}`;
  // If stanza already exists, nothing to do.
  if (content.includes(`[versions."${vVer}"]`)) {
    log(`Hugo toml already contains stanza for ${vVer}.`);
    return;
  }

  // Compute next weight: find all existing [versions."..."] weight entries.
  // Preserve "old" weight=1 and "dev" weight=99. For others, choose max+1 (min 2).
  const stanzaRe = /\[versions\."([^"]+)"\][\s\S]*?^\s*weight\s*=\s*(\d+)/gm;
  let match;
  let maxWeight = 1;
  while ((match = stanzaRe.exec(content)) !== null) {
    const name = match[1];
    const weight = parseInt(match[2], 10);
    if (!Number.isFinite(weight)) continue;
    if (name === 'dev' || name === 'old') continue;
    if (weight > maxWeight) maxWeight = weight;
  }
  const nextWeight = Math.max(maxWeight + 1, 2);

  // Append new stanza at EOF.
  const append = [
    '',
    `[versions."${vVer}"]`,
    `  weight = ${nextWeight}`,
    ''
  ].join('\n');

  content = content.replace(/\s*$/, '') + '\n' + append;
  await fsp.writeFile(tomlPath, content, 'utf-8');
  log(`Appended [versions."${vVer}"] with weight=${nextWeight} to ${path.relative(repoRoot, tomlPath)}.`);
}


async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    fail('Missing version argument. Usage: node .github/scripts/cutoff-version.js x.y.z');
  }
  const ver = args[0].trim();
  if (!isSemver(ver)) {
    fail(`Invalid version '${ver}'. Expected SemVer without 'v' prefix, e.g., 1.2.3`);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const srcContent = path.join(repoRoot, 'content');
  const destDir = path.join(repoRoot, 'content_versioned', `version-v${ver}`);

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


  // Update Hugo versions configuration
  await updateHugoToml(repoRoot, ver);

  log('Cutoff completed successfully.');
}

main().catch((e) => {
  fail(e.stack || e.message || String(e));
});