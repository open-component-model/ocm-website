#!/usr/bin/env bash
set -euo pipefail

# This script sets up a new version branch for the OCM website.
# It updates the params.toml, module.toml, and versions.json files accordingly.
# Usage: ./setup_version_branch.sh <website_version> [content_version]

# === Arguments ===
WEBSITE_VERSION="$1"
CONTENT_VERSION="${2:-$WEBSITE_VERSION}" # Content version of new OCM CLI release

# === Paths ===
PARAMS_FILE="config/_default/params.toml"
MODULE_FILE="config/_default/module.toml"
VERSIONS_FILE="data/versions.json"
BRANCH_NAME="$WEBSITE_VERSION"

# === Create version branch ===
echo "→ Creating new branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# === Update params.toml ===
echo "→ Updating $PARAMS_FILE"
sed -i "s/^docsVersion = .*/docsVersion = \"$WEBSITE_VERSION\"/" "$PARAMS_FILE"

# === Update module.toml ===
echo "→ Updating $MODULE_FILE"
sed -i "s|\(@\)[^\"]*|@${CONTENT_VERSION}|" "$MODULE_FILE"

# === Update versions.json (append if not present) ===
echo "→ Updating $VERSIONS_FILE"
jq --arg v "$WEBSITE_VERSION" --arg def "latest" '
  .defaultVersion = $def
  | .versions |= (if index($v) then . else . + [$v] | sort_by(.) end)
' "$VERSIONS_FILE" > "$VERSIONS_FILE.tmp" && mv "$VERSIONS_FILE.tmp" "$VERSIONS_FILE"

git add "$PARAMS_FILE" "$MODULE_FILE" "$VERSIONS_FILE"
git commit -m "Prepare branch $BRANCH_NAME with content version $CONTENT_VERSION"
git push origin "$BRANCH_NAME"

echo "✅ Branch $BRANCH_NAME created and pushed."
