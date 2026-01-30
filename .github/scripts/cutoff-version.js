#!/usr/bin/env node
/**
 * Cut off a new versioned snapshot of content (Hugo >= 0.153.0).
 *
 * Usage:
 *   node .github/scripts/cutoff-version.js [--makeDefault] vX.Y.Z
 *   node .github/scripts/cutoff-version.js [--makeDefault] X.Y.Z
 *
 * Behavior:
 * - Accepts version with or without a leading "v"; internally normalizes to:
 *     semver = "x.y.z"
 *     vVer   = "v" + semver (e.g., "v1.2.3")
 * - Copies content/ to content_versioned/version-vx.y.z (always v-prefixed in folder name).
 * - Updates config/_default/hugo.toml:
 *   - Ensures a per-version stanza exists: [versions."vx.y.z"] (without weight).
 *   - If --makeDefault is provided, sets defaultContentVersion = "vx.y.z". Otherwise leaves it unchanged.
 * - Updates config/_default/module.toml by appending at EOF a grouped section for the new version,
 *   starting with a comment "# x.y.z", then the Mounts block, then the Imports block:
 *
 *     # x.y.z
 *     [[mounts]]
 *       source = "content_versioned/version-vx.y.z"
 *       target = "content"
 *       [mounts.sites.matrix]
 *         versions = ["vx.y.z"]
 *
 *     [[imports]]
 *       path = "ocm.software/open-component-model/cli"
 *       version = "vx.y.z"
 *       [[imports.mounts]]
 *         source = "docs/reference"
 *         target = "content/docs/reference/ocm-cli"
 *         [imports.mounts.sites.matrix]
 *           versions = ["vx.y.z"]
 *
 *   - Idempotenz/Konsistenz:
 *       • Wenn weder Mount noch Import für die Version existieren, wird der obige Block angehängt.
 *       • Wenn genau einer der Blöcke existiert (teilweise vorhanden), wird KEIN Erfolg gemeldet:
 *         Es erfolgt eine Konsistenzprüfung am Ende und das Skript bricht mit Fehler ab.
 *       • Wenn beide existieren, wird nichts angehängt.
 *
 *
 * Notes:
 * - Keine eingebetteten CLI-Referenzen im Snapshot, CLI-Dokumente werden via Hugo Module importiert.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

/* ---------- Utilities ---------- */

function isSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

function normalizeVersionArg(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const noV = s.replace(/^v/i, '');
  if (!isSemver(noV)) return null;
  return { semver: noV, vVer: `v${noV}` };
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
  await fsp.cp(src, dest, { recursive: true, errorOnExist: false, force: true });
}

/* ---------- hugo.toml helpers (line-oriented) ---------- */

/**
 * Ensure [versions."vx.y.z"] stanza exists WITHOUT weight.
 */
async function ensureHugoVersionStanza(repoRoot, vVer) {
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  // If stanza exists (with or without leading spaces), nothing to do.
  const existsRe = new RegExp(String.raw`^\\s*\\[versions\\."${vVer.replace(/\./g, '\\.')}"]\\s*$`, 'm');
  if (existsRe.test(content)) {
    log(`hugo.toml already contains stanza for ${vVer}.`);
    return;
  }

  // Build insertion line with the same indentation style used for other version stanzas.
  const insertLine = `  [versions."${vVer}"]\n`;

  // Strategy:
  // 1) Insert after the last [versions."..."] stanza if any exist.
  // 2) Else insert right after the [versions] header if it exists.
  // 3) Else append a new [versions] header and our stanza at EOF.
  const subRe = /^\s*\[versions\."[^"]+"\]\s*$/gm;
  let lastMatch = null;
  let match;
  while ((match = subRe.exec(content)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    let pos = lastMatch.index + lastMatch[0].length;
    // Move insertion point to after the end-of-line newline to avoid creating a blank line
    if (content[pos] === '\n') {
      pos += 1;
    }
    const insertion = `  [versions."${vVer}"]\n`;
    content = content.slice(0, pos) + insertion + content.slice(pos);
    await fsp.writeFile(tomlPath, content, 'utf-8');
    log(`Inserted [versions."${vVer}"] directly after the last versions stanza.`);
    return;
  }

  const headerMatch = content.match(/^\[versions\]\s*$/m);
  if (headerMatch) {
    let pos = headerMatch.index + headerMatch[0].length;
    // Move after newline so the stanza starts on its own line under the header
    if (content[pos] === '\n') {
      pos += 1;
    }
    const insertion = `  [versions."${vVer}"]\n`;
    content = content.slice(0, pos) + insertion + content.slice(pos);
    await fsp.writeFile(tomlPath, content, 'utf-8');
    log(`Inserted [versions."${vVer}"] under the [versions] header.`);
    return;
  }

  // No [versions] header present — append a minimal block at EOF.
  const appendBlock = [
    '',
    '[versions]',
    `  [versions."${vVer}"]`,
    ''
  ].join('\n');
  content = content.replace(/\s*$/, '') + '\n' + appendBlock;
  await fsp.writeFile(tomlPath, content, 'utf-8');
  log(`Appended [versions] and [versions."${vVer}"] at EOF.`);
}

/**
 * If requested, set defaultContentVersion = "vx.y.z".
 */
async function setDefaultContentVersion(repoRoot, vVer) {
  const tomlPath = path.join(repoRoot, 'config', '_default', 'hugo.toml');
  let content;
  try {
    content = await fsp.readFile(tomlPath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${tomlPath}: ${e.message}`);
  }

  if (!/^\s*defaultContentVersion\s*=/m.test(content)) {
    // Insert after [versions] header if found, otherwise append near end.
    if (/\n\[versions\]/.test(content)) {
      content = content.replace(
        /^\[versions\]\s*$/m,
        `[versions]\n  defaultContentVersion = "${vVer}"`
      );
    } else {
      content = content.replace(/\s*$/, '') + `\n\ndefaultContentVersion = "${vVer}"\n`;
    }
  } else {
    content = content.replace(
      /^\s*defaultContentVersion\s*=\s*".*?"/m,
      `defaultContentVersion = "${vVer}"`
    );
  }

  await fsp.writeFile(tomlPath, content, 'utf-8');
  log(`Set defaultContentVersion="${vVer}" in ${path.relative(repoRoot, tomlPath)}.`);
}

/**
 * Mirror defaultContentVersion into params.toml ([doks].defaultContentVersion) for template usage.
 */

/* ---------- module.toml helpers ---------- */

function buildGroupedVersionBlock(semver, vVer) {
  return [
    '',
    `# ${semver}`,
    '[[mounts]]',
    `  source = "content_versioned/version-${vVer}"`,
    '  target = "content"',
    '  [mounts.sites.matrix]',
    `    versions = ["${vVer}"]`,
    '',
    '[[imports]]',
    '  path = "ocm.software/open-component-model/cli"',
    `  version = "${vVer}"`,
    '  [[imports.mounts]]',
    '    source = "docs/reference"',
    '    target = "content/docs/reference/ocm-cli"',
    '    [imports.mounts.sites.matrix]',
    `      versions = ["${vVer}"]`,
    ''
  ].join('\n');
}

/**
 * Append grouped mounts+imports section for the new version at EOF, starting with "# x.y.z".
 * Idempotenz/Konsistenz:
 *  - If neither mounts nor imports exist: append full grouped block.
 *  - If exactly one exists: do not append; fail later in consistency check.
 *  - If both exist: do not append.
 * After operation, perform a consistency check; if either block missing → fail.
 */
async function updateModuleToml(repoRoot, semver, vVer) {
  const modulePath = path.join(repoRoot, 'config', '_default', 'module.toml');
  let content;
  try {
    content = await fsp.readFile(modulePath, 'utf-8');
  } catch (e) {
    fail(`Failed to read ${modulePath}: ${e.message}`);
  }

  const hasMount = content.includes(`source = "content_versioned/version-${vVer}"`)
                && content.includes(`[mounts.sites.matrix]`)
                && content.includes(`versions = ["${vVer}"]`);
  const hasImport = content.includes(`[[imports]]`)
                 && content.includes(`version = "${vVer}"`)
                 && content.includes(`target = "content/docs/reference/ocm-cli"`);

  if (!hasMount && !hasImport) {
    const grouped = buildGroupedVersionBlock(semver, vVer);
    content = content.replace(/\s*$/, '') + '\n' + grouped;
    await fsp.writeFile(modulePath, content, 'utf-8');
    log(`Appended grouped module.toml section for ${vVer} (with "# ${semver}" header).`);
  } else {
    log(`module.toml already has ${hasMount ? 'mounts' : ''}${hasMount && hasImport ? ' and ' : ''}${hasImport ? 'imports' : ''} for ${vVer}.`);
  }

  // Re-read and perform strict consistency check
  const final = await fsp.readFile(modulePath, 'utf-8');
  const finalHasMount = final.includes(`source = "content_versioned/version-${vVer}"`)
                     && final.includes(`[mounts.sites.matrix]`)
                     && final.includes(`versions = ["${vVer}"]`);
  const finalHasImport = final.includes(`[[imports]]`)
                      && final.includes(`version = "${vVer}"`)
                      && final.includes(`target = "content/docs/reference/ocm-cli"`);

  if (!finalHasMount || !finalHasImport) {
    fail(`Inconsistent module.toml for ${vVer}: mounts=${finalHasMount}, imports=${finalHasImport}. Please resolve manually.`);
  }
}

/* ---------- Main ---------- */

async function main() {
  // Parse args: allow --makeDefault; accept version as vX.Y.Z or X.Y.Z (single token).
  const args = process.argv.slice(2);
  let makeDefault = false;
  let versionToken = null;

  for (const a of args) {
    if (a === '--makeDefault') {
      makeDefault = true;
    } else if (/^v?\d+\.\d+\.\d+$/.test(a)) {
      if (versionToken) {
        fail(`Multiple version tokens detected ("${versionToken}" and "${a}"). Provide a single version.`);
      }
      versionToken = a;
    } else {
      // ignore unknown flags
    }
  }

  if (!versionToken) {
    fail('Missing version argument. Usage: node .github/scripts/cutoff-version.js [--makeDefault] vX.Y.Z | X.Y.Z');
  }

  const norm = normalizeVersionArg(versionToken);
  if (!norm) {
    fail(`Invalid version token '${versionToken}'. Expected SemVer with optional leading 'v', e.g., v1.2.3 or 1.2.3`);
  }
  const { semver, vVer } = norm;

  const repoRoot = path.resolve(__dirname, '../..');
  const srcContent = path.join(repoRoot, 'content');
  const destDir = path.join(repoRoot, 'content_versioned', `version-${vVer}`);

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
  await ensureHugoVersionStanza(repoRoot, vVer);
  if (makeDefault) {
    await setDefaultContentVersion(repoRoot, vVer);
  } else {
    log('defaultContentVersion unchanged (use --makeDefault to set this version as default).');
  }

  // Update module.toml mounts & imports for this version (grouped at EOF with "# x.y.z")
  await updateModuleToml(repoRoot, semver, vVer);

  log('Cutoff completed successfully.');
}

main().catch((e) => {
  fail(e.stack || e.message || String(e));
});