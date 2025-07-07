#!/usr/bin/env bash
set -euo pipefail

# This script synchronizes the versions.json file across
# all version branches in the OCM website repository.
# It updates each branch with the latest versions.json from the main branch.
# Usage: ./sync_versions_in_branches.sh

# === Configuration ===
MAIN_VERSIONS_FILE="data/versions.json"
TEMP_REPO=".temp-branches"

# === Get list of version branches ===
VERSION_BRANCHES=$(git branch -r | grep -Eo 'origin/v[0-9]+\.[0-9]+\.[0-9]+' | sed 's|origin/||')

# === Prepare workspace ===
rm -rf "$TEMP_REPO"
mkdir -p "$TEMP_REPO"

for BRANCH in $VERSION_BRANCHES; do
  echo "→ Syncing versions.json in $BRANCH"
  git worktree add "$TEMP_REPO/$BRANCH" "$BRANCH"

  cp "$MAIN_VERSIONS_FILE" "$TEMP_REPO/$BRANCH/data/versions.json"

  pushd "$TEMP_REPO/$BRANCH" > /dev/null
  if ! git diff --quiet; then
    git add data/versions.json
    git commit -m "Update versions.json from main"
    git push origin "$BRANCH"
    echo "✔ Updated $BRANCH"
  else
    echo "ℹ️ No changes in $BRANCH"
  fi
  popd > /dev/null

done

# Cleanup
git worktree prune
rm -rf "$TEMP_REPO"
echo "✅ All branches synchronized."
