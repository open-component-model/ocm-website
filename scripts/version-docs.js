#!/usr/bin/env node

// Copy content/docs -> content_versioned/version-<x.y.z> and set latest_version in params.toml

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function isSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await fsp.copyFile(s, d);
    }
  }
}

async function setLatestVersion(paramsPath, version) {
  try {
    let raw = await fsp.readFile(paramsPath, 'utf-8');
    if (!raw.match(/latest_version\s*=\s*"[^"]*"/)) {
      // If not present, insert near the top
      raw = raw.replace(/^# Hugo/m, `# Hugo\nlatest_version = "${version}"`);
    } else {
      raw = raw.replace(/latest_version\s*=\s*"[^"]*"/, `latest_version = "${version}"`);
    }
    await fsp.writeFile(paramsPath, raw, 'utf-8');
  } catch (e) {
    console.error(`Failed to set latest_version in ${paramsPath}: ${e.message}`);
    process.exit(1);
  }
}

async function main() {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: npm run docs:version -- <x.y.z>');
    process.exit(1);
  }
  if (!isSemver(version)) {
    console.error(`Invalid version: ${version} (expected SemVer x.y.z)`);
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const docsSrc = path.join(repoRoot, 'content', 'docs');
  const versionsRoot = path.join(repoRoot, 'content_versioned');
  const target = path.join(versionsRoot, `version-${version}`);
  const paramsPath = path.join(repoRoot, 'config', '_default', 'params.toml');

  // Basic checks
  try {
    const st = await fsp.stat(docsSrc);
    if (!st.isDirectory()) throw new Error('docs not found');
  } catch {
    console.error(`Missing source folder: ${docsSrc}`);
    process.exit(1);
  }

  let exists = false;
  try {
    const st = await fsp.stat(target);
    exists = st.isDirectory();
  } catch {
    exists = false;
  }

  if (!exists) {
    await copyDir(docsSrc, target);
    console.log(`Version created: ${path.relative(repoRoot, target)}`);
  } else {
    console.log(`Version folder already exists: ${path.relative(repoRoot, target)} — skipping copy.`);
  }

  // Always set latest_version in params.toml
  await setLatestVersion(paramsPath, version);
  console.log(`latest_version in ${path.relative(repoRoot, paramsPath)} set to ${version}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
