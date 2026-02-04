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
 * - Optional --keepDefault keeps defaultContentVersion unchanged. Required until first OCM v2 release.
 */

const fsp = require('node:fs/promises');
const path = require('node:path');

// Paths
const REPO_ROOT = path.resolve(__dirname, '../..');
const HUGO_TOML = path.join(REPO_ROOT, 'config', '_default', 'hugo.toml');
const MODULE_TOML = path.join(REPO_ROOT, 'config', '_default', 'module.toml');
const SRC_CONTENT = path.join(REPO_ROOT, 'content');

// Headers for regenerated files
const HUGO_HEADER = `# Hugo Configuration
# This file is partially auto-generated. Comments may be lost on regeneration.
# Per-version settings are auto-generated at the end.

`;

const MODULE_HEADER = `# Hugo Module Configuration
# This file is partially auto-generated. Comments may be lost on regeneration.
#
# Static mounts (data, layouts, i18n, archetypes, assets, static) are fixed.
# Per-version mounts and imports are auto-generated at the end.

`;

// TOML module cache
let TOML;

// Load smol-toml
const loadToml = async () => TOML || (TOML = await import('smol-toml'));

// Log error and exit
function fail(msg) {
    console.error(`[ERROR] ${msg}`);
    throw new Error(msg);
}

// Check if path exists
async function pathExists(p) {
    try { await fsp.access(p); return true; } catch { return false; }
}

// Parse CLI arguments
function parseArguments(args) {
    let version = null, keepDefault = false;
    const unknownFlags = [];
    const versionPattern = /^\d+\.\d+\.\d+$/;

    for (const arg of args) {
        if (arg === '--keepDefault') keepDefault = true;
        else if (arg.startsWith('--')) unknownFlags.push(arg);
        else if (!version) {
            const candidate = arg.trim();
            if (!versionPattern.test(candidate)) {
                throw new Error(`Invalid version '${candidate}'. Expected X.Y.Z, without "v" or suffixes, e.g. 1.2.3`);
            }
            version = candidate;
        }
    }

    if (!version) throw new Error('Missing version. Usage: cutoff-version.js X.Y.Z [--keepDefault]');
    if (unknownFlags.length) throw new Error(`Unknown flag(s): ${unknownFlags.join(', ')}`);

    return { version, keepDefault };
}

// Check if mount/import for version exists
function hasMountForVersion(parsed, version) {
    return parsed?.mounts?.some(m => m?.sites?.matrix?.versions?.includes(version)) ?? false;
}

function hasImportForVersion(parsed, version) {
    return parsed?.imports?.some(i => i?.mounts?.some(m => m?.sites?.matrix?.versions?.includes(version))) ?? false;
}

// Copy content/ to content_versioned/version-X.Y.Z
async function copyContent(version) {
    const destDir = path.join(REPO_ROOT, 'content_versioned', `version-${version}`);
    if (await pathExists(destDir)) fail(`Destination exists: content_versioned/version-${version}`);
    console.log(`Creating snapshot: content_versioned/version-${version}`);
    await fsp.mkdir(path.dirname(destDir), { recursive: true });
    await fsp.cp(SRC_CONTENT, destDir, { recursive: true });
}

// Update hugo.toml
async function updateHugoToml(version, keepDefault) {
    const { parse, stringify } = await loadToml();
    const content = await fsp.readFile(HUGO_TOML, 'utf-8').catch(e => fail(`Read hugo.toml: ${e.message}`));
    const parsed = parse(content);

    if (parsed.versions?.[version]) {
        console.log(`hugo.toml: version ${version} exists, skipping.`);
        return;
    }

    parsed.versions = parsed.versions || {};
    parsed.versions[version] = {};

    if (!keepDefault) {
        const oldDefault = parsed.defaultContentVersion;
        parsed.defaultContentVersion = version;
        console.log(`hugo.toml: defaultContentVersion changed from '${oldDefault}' to '${version}'.`);
    } else {
        console.log(`hugo.toml: defaultContentVersion unchanged: ${parsed.defaultContentVersion}`);
    }

    await fsp.writeFile(HUGO_TOML, HUGO_HEADER + stringify(parsed), 'utf-8');
    console.log(`hugo.toml: added version ${version}.`);
}

// Update module.toml
async function updateModuleToml(version) {
    const { parse, stringify } = await loadToml();
    const content = await fsp.readFile(MODULE_TOML, 'utf-8').catch(e => fail(`Read module.toml: ${e.message}`));
    const parsed = parse(content);

    const hasMount = hasMountForVersion(parsed, version);
    const hasImport = hasImportForVersion(parsed, version);

    if (hasMount && hasImport) {
        console.log(`module.toml: version ${version} exists, skipping.`);
        return;
    }
    if (hasMount || hasImport) fail(`module.toml: incomplete block for ${version}. Fix manually.`);

    parsed.mounts = parsed.mounts || [];
    parsed.mounts.push({
        source: `content_versioned/version-${version}`,
        target: 'content',
        sites: { matrix: { versions: [version] } }
    });

    parsed.imports = parsed.imports || [];
    parsed.imports.push({
        path: 'ocm.software/open-component-model/cli',
        version: `v${version}`,
        mounts: [{ source: 'docs/reference', target: 'content/docs/reference/ocm-cli', sites: { matrix: { versions: [version] } } }]
    });

    await fsp.writeFile(MODULE_TOML, MODULE_HEADER + stringify(parsed), 'utf-8');
    console.log(`module.toml: added version ${version}.`);
}

// Main
async function main() {
    const { version, keepDefault } = parseArguments(process.argv.slice(2));

    const st = await fsp.stat(SRC_CONTENT).catch(() => null);
    if (!st?.isDirectory()) fail(`Source content not found: ${SRC_CONTENT}`);

    await copyContent(version);
    await updateHugoToml(version, keepDefault);
    await updateModuleToml(version);

    console.log('Cutoff completed.');
}

if (require.main === module) {
    main().catch(e => {
        console.error(`[ERROR] ${e.message || String(e)}`);
        process.exit(1);
    });
}

module.exports = { parseArguments, hasMountForVersion, hasImportForVersion };
