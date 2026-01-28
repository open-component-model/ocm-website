#!/usr/bin/env node
/**
 * Multi-version build for OCM website (single-branch, folder-per-version).
 *
 * Authoritative versions source: data/versions.json
 * - defaultVersion: Semantic version (x.y.z) without 'v' prefix; built to ./public/ (root)
 * - versions: Array including semantic versions and optionally "dev"
 *   - If "dev" exists, it is built to ./public/dev using content/ and CLI module version="latest"
 *   - Each semantic version x.y.z is built to ./public/x.y.z from content_versioned/version-x.y.z
 *     - The OCM CLI reference module is mounted with version=@vX.Y.Z (except for 0.0.0, which uses embedded snapshot docs)
 *
 * Requirements:
 * - Hugo >= 0.150.0 (module import version pinning)
 * - Base module.toml must NOT contain a static CLI import (we inject via overlay)
 * - package.json "build" must invoke Hugo; "build-multi-version" should call this script
 *
 * Usage:
 *   node scripts/build-multiversion.js
 *   node scripts/build-multiversion.js http://localhost:1313
 *   node scripts/build-multiversion.js --base http://localhost:1313
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CFG = {
  // IO roots
  repoRoot: path.resolve(__dirname, '..'),
  contentDir: 'content',
  versionsDir: 'content_versioned',
  publicDir: 'public',
  versionsDataPath: 'data/versions.json',

  // Build config chain (keep minimal but complete)
  configChain: [
    'config/_default/hugo.toml',
    'config/_default/params.toml',
    'config/_default/markup.toml',
    'config/_default/languages.toml',
    'config/_default/module.toml'
  ],

  // Base URL (overridable via CLI)
  baseURL: 'https://ocm.software',

  // Special values
  devLabel: 'dev',
  cliModulePath: 'ocm.software/open-component-model/cli',
  cliMountTarget: 'content/docs/reference/ocm-cli',

  // Special-case version that retains embedded CLI docs
  embeddedCliSnapshotVersion: '0.0.0'
};

// Parse CLI args for baseURL override
(function parseArgs() {
  const args = process.argv.slice(2);
  let base = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--base' && i + 1 < args.length) { base = args[i + 1]; break; }
    if (/^https?:\/\//i.test(a)) { base = a; break; }
  }
  if (base) {
    try {
      const u = new URL(base);
      if (!/^https?:$/.test(u.protocol)) throw new Error('Bad protocol');
      CFG.baseURL = base.replace(/\/$/, '');
    } catch {
      console.error(`[ERROR] Invalid base URL: '${base}'. Expected e.g. 'http://localhost:1313'`);
      process.exit(1);
    }
  }
})();

function isSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)));
  });
}

async function readJSON(file) {
  const raw = await fsp.readFile(file, 'utf-8');
  return JSON.parse(raw);
}

async function ensureEmptyDir(absPath) {
  await fsp.rm(absPath, { recursive: true, force: true });
  await fsp.mkdir(absPath, { recursive: true });
}

async function fileExists(absPath) {
  try { await fsp.access(absPath, fs.constants.F_OK); return true; } catch { return false; }
}

async function writeOverlayToml({ docsVersion, cliVersionSpec }) {
  // Create a minimal overlay with:
  // - [params.doks] docsVersion = "dev" | "x.y.z"
  // - [[module.imports]] for CLI module with version and mount target (unless cliVersionSpec === null)
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'ocm-ovr-'));
  const overlayPath = path.join(tmpDir, 'overlay.toml');

  const lines = [];
  lines.push('# Auto-generated overlay for per-version build');
  lines.push('');
  // Params overlay
  lines.push('[params]');
  lines.push('  [params.doks]');
  lines.push(`    docsVersion = "${docsVersion}"`);
  lines.push('');

  if (cliVersionSpec !== null) {
    lines.push('[module]');
    lines.push('  [[module.imports]]');
    lines.push(`    path = "${CFG.cliModulePath}"`);
    lines.push(`    version = "${cliVersionSpec}"`);
    lines.push('    ignoreConfig = true');
    lines.push('    [[module.imports.mounts]]');
    lines.push(`      source = "docs/reference"`);
    lines.push(`      target = "${CFG.cliMountTarget}"`);
    lines.push('');
  }

  await fsp.writeFile(overlayPath, lines.join('\n'), 'utf-8');
  return { overlayPath, cleanup: async () => { try { await fsp.rm(tmpDir, { recursive: true, force: true }); } catch {} } };
}

async function runHugoBuild({ destinationAbs, baseURL, overlayPath }) {
  const configArgs = ['--config', [...CFG.configChain, overlayPath].join(',')];
  const extraArgs = ['--destination', destinationAbs, '--baseURL', baseURL];
  await run('npm', ['run', 'build', '--', ...configArgs, ...extraArgs], { cwd: CFG.repoRoot });
}

async function withContentSymlink(semver, fn) {
  // Replace ./content with symlink to ./content_versioned/version-x.y.z
  const contentAbs = path.join(CFG.repoRoot, CFG.contentDir);
  const backupDirAbs = path.join(CFG.repoRoot, '.tmp', `content-backup-${Date.now()}`);
  const versionSourceAbs = path.join(CFG.repoRoot, CFG.versionsDir, `version-${semver}`);

  // Validate version content exists
  const exists = await fileExists(versionSourceAbs);
  if (!exists) {
    throw new Error(`Version source missing: ${path.relative(CFG.repoRoot, versionSourceAbs)}`);
  }

  // Ensure .tmp exists
  await fsp.mkdir(path.dirname(backupDirAbs), { recursive: true });

  // Move current content dir to backup
  await fsp.rename(contentAbs, backupDirAbs);

  // Create symlink
  await fsp.symlink(path.relative(path.dirname(contentAbs), versionSourceAbs), contentAbs);

  let movedCliPathAbs = null;

  try {
    // For versions other than the embedded snapshot version, temporarily hide any existing snapshot CLI docs
    if (semver !== CFG.embeddedCliSnapshotVersion) {
      const cliPathAbs = path.join(CFG.repoRoot, CFG.contentDir, 'docs', 'reference', 'ocm-cli'); // under symlink
      if (await fileExists(cliPathAbs)) {
        movedCliPathAbs = path.join(CFG.repoRoot, '.tmp', `ocm-cli-backup-${semver}-${Date.now()}`);
        await fsp.mkdir(path.dirname(movedCliPathAbs), { recursive: true });
        await fsp.rename(cliPathAbs, movedCliPathAbs);
      }
    }

    // Execute provided function within symlinked context
    await fn();
  } finally {
    // Restore CLI snapshot if moved
    if (movedCliPathAbs) {
      const restoreTarget = path.join(CFG.repoRoot, CFG.contentDir, 'docs', 'reference', 'ocm-cli'); // still under symlink
      // Create parent directories if needed under symlinked 'content'
      try { await fsp.mkdir(path.dirname(restoreTarget), { recursive: true }); } catch {}
      try { await fsp.rename(movedCliPathAbs, restoreTarget); } catch {}
    }
    // Remove symlink and restore original content
    try { await fsp.unlink(contentAbs); } catch {}
    try { await fsp.rename(backupDirAbs, contentAbs); } catch {}
  }
}

async function main() {
  // Ensure public/ is clean
  await ensureEmptyDir(path.join(CFG.repoRoot, CFG.publicDir));

  // Read authoritative versions.json
  const versionsJsonAbs = path.join(CFG.repoRoot, CFG.versionsDataPath);
  if (!(await fileExists(versionsJsonAbs))) {
    console.error(`[ERROR] Missing ${CFG.versionsDataPath}`);
    process.exit(1);
  }
  const versionsData = await readJSON(versionsJsonAbs);
  const defaultVersion = versionsData.defaultVersion;
  const versions = Array.isArray(versionsData.versions) ? [...versionsData.versions] : [];

  if (!isSemver(defaultVersion)) {
    console.error(`[ERROR] defaultVersion must be a semantic version (x.y.z). Found: ${defaultVersion}`);
    process.exit(1);
  }
  if (!versions.includes(defaultVersion)) {
    console.error(`[ERROR] defaultVersion '${defaultVersion}' not present in versions[].`);
    process.exit(1);
  }

  // Split versions into semver list and dev flag
  const hasDev = versions.includes(CFG.devLabel);
  const semverVersions = versions.filter(isSemver);

  // Build order: defaultVersion → other semver → dev (if present)
  const otherSemver = semverVersions.filter(v => v !== defaultVersion);

  // 1) Build default (root)
  {
    const outAbs = path.join(CFG.repoRoot, CFG.publicDir);
    const base = CFG.baseURL;
    const v = defaultVersion;

    // Determine CLI module version (null for embedded snapshot)
    const cliVersionSpec = v === CFG.embeddedCliSnapshotVersion ? null : `v${v}`;

    const { overlayPath, cleanup } = await writeOverlayToml({ docsVersion: v, cliVersionSpec });
    try {
      await withContentSymlink(v, async () => {
        await runHugoBuild({ destinationAbs: outAbs, baseURL: base, overlayPath });
      });
    } finally {
      await cleanup();
    }
  }

  // 2) Build each non-default semver version
  for (const v of otherSemver) {
    const outAbs = path.join(CFG.repoRoot, CFG.publicDir, v);
    const base = `${CFG.baseURL.replace(/\/$/, '')}/${v}/`;

    const cliVersionSpec = v === CFG.embeddedCliSnapshotVersion ? null : `v${v}`;

    const { overlayPath, cleanup } = await writeOverlayToml({ docsVersion: v, cliVersionSpec });
    try {
      await withContentSymlink(v, async () => {
        await runHugoBuild({ destinationAbs: outAbs, baseURL: base, overlayPath });
      });
    } finally {
      await cleanup();
    }
  }

  // 3) Build dev (if present in versions array)
  if (hasDev) {
    const outAbs = path.join(CFG.repoRoot, CFG.publicDir, CFG.devLabel);
    const base = `${CFG.baseURL.replace(/\/$/, '')}/${CFG.devLabel}/`;

    // dev uses "latest" CLI module
    const { overlayPath, cleanup } = await writeOverlayToml({ docsVersion: CFG.devLabel, cliVersionSpec: 'latest' });
    try {
      // No symlink, use working content/
      await runHugoBuild({ destinationAbs: outAbs, baseURL: base, overlayPath });
    } finally {
      await cleanup();
    }
  }

  console.log('Multi-version build completed successfully.');
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : String(e));
  process.exit(1);
});