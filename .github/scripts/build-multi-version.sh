#!/usr/bin/env bash
set -euo pipefail

# Multi-Version Build Script for OCM Website
# Usage: ./github/scripts/build-multi-version.sh
# Requirements: git, hugo, npm, jq

# Helper for error output
err() { echo "[ERROR] $*" >&2; }
info() { echo "[INFO] $*"; }

# Check requirements
for cmd in git hugo npm jq; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd is required but not installed."
    exit 1
  fi
done

# Get versions from data/versions.json
VERSIONS=$(jq -r '.versions[]' data/versions.json)
if [ -z "$VERSIONS" ]; then
  err "No versions found in data/versions.json."
  exit 1
fi

# Get default version from config/_default/params.toml
DEFAULT_VERSION=$(grep '^defaultVersion' config/_default/params.toml | cut -d'=' -f2 | tr -d ' "')
if [ -z "$DEFAULT_VERSION" ]; then
  err "defaultVersion not found in config/_default/params.toml."
  exit 1
fi

PUBLIC_DIR="public"
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

WORKTREE_BASE=".worktrees"
rm -rf "$WORKTREE_BASE"
mkdir -p "$WORKTREE_BASE"

# Build each version
for VERSION in $VERSIONS; do
  if [ "$VERSION" = "dev" ]; then
    BRANCH="main"
    OUTDIR="$PUBLIC_DIR/dev"
  elif [ "$VERSION" = "$DEFAULT_VERSION" ]; then
    BRANCH="website/$VERSION"
    OUTDIR="$PUBLIC_DIR"
  else
    BRANCH="website/$VERSION"
    OUTDIR="$PUBLIC_DIR/$VERSION"
  fi

  info "Building version $VERSION from branch $BRANCH into $OUTDIR"

  # Add worktree
  git worktree add "$WORKTREE_BASE/$VERSION" "$BRANCH" || { err "Failed to add worktree for $BRANCH"; exit 1; }
  pushd "$WORKTREE_BASE/$VERSION" >/dev/null

  # Update Hugo modules
  hugo mod get -u || { err "hugo mod get -u failed for $BRANCH"; popd >/dev/null; exit 1; }
  hugo mod tidy || { err "hugo mod tidy failed for $BRANCH"; popd >/dev/null; exit 1; }

  # Build site
  npm ci || { err "npm ci failed for $BRANCH"; popd >/dev/null; exit 1; }
  npm run build -- --destination "../../$OUTDIR" --baseURL "https://ocm.software/$VERSION" || { err "npm run build failed for $BRANCH"; popd >/dev/null; exit 1; }

  popd >/dev/null
  git worktree remove "$WORKTREE_BASE/$VERSION" --force

done

info "Multi-version build completed. Output in $PUBLIC_DIR."
