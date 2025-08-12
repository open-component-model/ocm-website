#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Multi-Version Build Script for OCM Website
# -----------------------------------------------------------------------------
# Builds all website versions in parallel using git worktrees.
# For performance, it reuses the central node_modules folder via symlink if the
# package-lock.json is identical. If dependencies differ, node_modules is installed
# separately in the worktree using npm ci.
#
# USAGE:
#   bash .github/scripts/build-multi-version.sh [baseURL]
#
#   baseURL: Optional. The base URL for the built site versions. Default is
#            "https://ocm.software". For local testing, you can use e.g.
#            "http://localhost:1313".
#
# ENVIRONMENT VARIABLES:
#   DEBUG: If set to 1, enables debug output for troubleshooting. Example:
#          DEBUG=1 bash .github/scripts/build-multi-version.sh
#
# EXAMPLES:
#   bash .github/scripts/build-multi-version.sh
#   bash .github/scripts/build-multi-version.sh http://localhost:1313
# -----------------------------------------------------------------------------

# Read baseURL from first argument, default to https://ocm.software
BASE_URL="${1:-https://ocm.software}"

# Helper for error output
err() { echo "[ERROR] $*" >&2; }
# Helper for info output
info() { echo "[INFO] $*"; }
# Helper for debug output (only when DEBUG=1)
debug() { [ "${DEBUG:-0}" = "1" ] && echo "[DEBUG] $*" >&2 || true; }

# Cleanup function to ensure temp files are removed on exit
cleanup() {
  local exit_code=$?
  debug "Cleaning up temporary files..."
  rm -rf "${TMP_MAIN_VERSIONS:-}" "${WORKTREE_BASE:-}" 2>/dev/null || true
  exit $exit_code
}
trap cleanup EXIT INT TERM

# Check required commands
for cmd in git npm jq cmp; do
  if ! command -v "$cmd" &>/dev/null; then
    err "$cmd is required but not installed."
    exit 1
  fi
done

# Validate that data/versions.json exists and has correct structure
validate_versions_json() {
  local file="$1"
  local context="$2"
  
  if [ ! -f "$file" ]; then
    err "$context: File $file does not exist."
    return 1
  fi
  
  if ! jq -e '.versions' "$file" >/dev/null 2>&1; then
    err "$context: File $file does not contain a valid 'versions' array."
    return 1
  fi
  
  local versions=$(jq -r '.versions[]?' "$file" 2>/dev/null)
  if [ -z "$versions" ]; then
    err "$context: File $file contains an empty versions array."
    return 1
  fi
  
  debug "$context: Validated $file - contains $(echo "$versions" | wc -l | tr -d ' ') versions"
  return 0
}

# Helper function to count versions (handles empty strings correctly)
count_versions() {
  local versions="$1"
  if [ -z "$versions" ]; then
    echo "0"
  else
    echo "$versions" | wc -l | tr -d ' '
  fi
}

# --- Determine the correct source for data/versions.json ---
# By default, use the local file in the current branch
VERSIONS_JSON_PATH="data/versions.json"

# Validate local versions.json first
if ! validate_versions_json "$VERSIONS_JSON_PATH" "Local"; then
  exit 1
fi

# Get docsVersion and current branch only once for later use
DOCS_VERSION=$(grep -E '^[[:space:]]*docsVersion[[:space:]]*=' config/_default/params.toml | cut -d'=' -f2 | tr -d ' "')
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# --- Check for version mismatch between branch and docsVersion ---
# Determine expected docsVersion based on current branch
if [ "$CURRENT_BRANCH" = "main" ]; then
  EXPECTED_DOCSVERSION="dev"
elif [[ "$CURRENT_BRANCH" =~ ^website/v[0-9]+\.[0-9]+$ ]]; then
  EXPECTED_DOCSVERSION="${CURRENT_BRANCH#website/}"
else
  # For other branches (e.g., feature branches), skip validation
  EXPECTED_DOCSVERSION=""
fi

# Validate docsVersion matches expected value (if we have an expectation)
if [ -n "$EXPECTED_DOCSVERSION" ] && [ "$DOCS_VERSION" != "$EXPECTED_DOCSVERSION" ]; then
  err "docsVersion ('$DOCS_VERSION') does not match expected value ('$EXPECTED_DOCSVERSION') for branch '$CURRENT_BRANCH'"
  err "Please update docsVersion in config/_default/params.toml to '$EXPECTED_DOCSVERSION'"
  exit 1
fi

# Decide which data/versions.json to use:
# Strategy: Use local file if it contains more versions than main, or if docsVersion is new
# This handles the case where we're preparing a new versioning setup with additional versions

# Always try to fetch the main versions.json for comparison
TMP_MAIN_VERSIONS=".tmp-main-versions"
rm -rf "$TMP_MAIN_VERSIONS"
mkdir -p "$TMP_MAIN_VERSIONS"

# Fetch versions.json from main (handle cases where main might not exist remotely)
MAIN_VERSIONS=""
MAIN_VERSIONS_FILE="$TMP_MAIN_VERSIONS/versions.json"

if git show origin/main:data/versions.json > "$MAIN_VERSIONS_FILE" 2>/dev/null; then
  if validate_versions_json "$MAIN_VERSIONS_FILE" "Origin/main"; then
    MAIN_VERSIONS=$(jq -r '.versions[]' "$MAIN_VERSIONS_FILE" 2>/dev/null || echo "")
    info "Successfully fetched and validated data/versions.json from origin/main."
  else
    info "Found data/versions.json in origin/main but it's invalid - using local file."
  fi
else
  info "Could not fetch data/versions.json from origin/main (this is OK for new repos)."
fi

# Get local versions for comparison  
LOCAL_VERSIONS=$(jq -r '.versions[]' "$VERSIONS_JSON_PATH" 2>/dev/null || echo "")

# Determine whether to use local or main versions.json
USE_LOCAL_VERSIONS=false

if [ "$CURRENT_BRANCH" = "main" ]; then
  # Always use local file when on main branch
  USE_LOCAL_VERSIONS=true
  info "Using local data/versions.json (on main branch)"
elif [ -z "$MAIN_VERSIONS" ]; then
  # Use local file if we can't fetch from main
  USE_LOCAL_VERSIONS=true
  info "Using local data/versions.json (cannot fetch valid file from origin/main)"
else
  # Compare version lists: use local if it has more versions or contains docsVersion not in main
  LOCAL_VERSION_COUNT=$(count_versions "$LOCAL_VERSIONS")
  MAIN_VERSION_COUNT=$(count_versions "$MAIN_VERSIONS")
  
  debug "Local versions ($LOCAL_VERSION_COUNT): $(echo "$LOCAL_VERSIONS" | tr '\n' ' ')"
  debug "Main versions ($MAIN_VERSION_COUNT): $(echo "$MAIN_VERSIONS" | tr '\n' ' ')"
  
  # Check if docsVersion exists in main versions
  DOCS_VERSION_IN_MAIN=$(echo "$MAIN_VERSIONS" | grep -x "$DOCS_VERSION" || echo "")
  
  if [ "$LOCAL_VERSION_COUNT" -gt "$MAIN_VERSION_COUNT" ]; then
    USE_LOCAL_VERSIONS=true
    info "Using local data/versions.json (contains more versions: $LOCAL_VERSION_COUNT vs $MAIN_VERSION_COUNT from main)"
  elif [ -z "$DOCS_VERSION_IN_MAIN" ] && echo "$LOCAL_VERSIONS" | grep -q "^$DOCS_VERSION$"; then
    USE_LOCAL_VERSIONS=true
    info "Using local data/versions.json (docsVersion '$DOCS_VERSION' is new and not in main)"
  else
    USE_LOCAL_VERSIONS=false
    info "Using data/versions.json from main (local version does not extend main's version list)"
  fi
fi

# Set the final versions.json path based on decision
if [ "$USE_LOCAL_VERSIONS" = "true" ]; then
  # Keep using the local file (VERSIONS_JSON_PATH is already set to local file)
  info "Final decision: Using local data/versions.json from current branch ($CURRENT_BRANCH)"
else
  # Use the main file we fetched
  VERSIONS_JSON_PATH="$MAIN_VERSIONS_FILE"
  info "Final decision: Using data/versions.json from main for version resolution."
fi

# Read all available versions from the determined data/versions.json file
VERSIONS=$(jq -r '.versions[]' "$VERSIONS_JSON_PATH")
if [ -z "$VERSIONS" ]; then
  err "No versions found in $VERSIONS_JSON_PATH."
  exit 1
fi

# Read the default version from config/_default/params.toml
DEFAULT_VERSION=$(grep -E '^[[:space:]]*defaultVersion' config/_default/params.toml | cut -d'=' -f2 | tr -d ' "')
if [ -z "$DEFAULT_VERSION" ]; then
  err "defaultVersion not found in config/_default/params.toml."
  exit 1
fi

# Check if the default version exists in the versions.json
if ! echo "$VERSIONS" | grep -q "^$DEFAULT_VERSION$"; then
  err "defaultVersion '$DEFAULT_VERSION' not found in versions.json"
  err "Available versions: $(echo "$VERSIONS" | tr '\n' ' ')"
  exit 1
fi

git worktree prune  # Clean up any stale worktrees

# Prepare output and worktree directories
# Remove and recreate the public directory for fresh build output
PUBLIC_DIR="public"
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

# Remove and recreate the worktree base directory for temporary git worktrees
WORKTREE_BASE=".worktrees"
rm -rf "$WORKTREE_BASE"
mkdir -p "$WORKTREE_BASE"


# Build each version listed in versions.json
# BUILT_VERSIONS will hold the mapping: version -> output directory
declare -A BUILT_VERSIONS
for VERSION in $VERSIONS; do
  # Determine output directory, branch and final base URL for each version
  if [ "$VERSION" = "dev" ]; then
    OUTDIR="$PUBLIC_DIR/dev"
    BRANCH="main"
    FINAL_BASE_URL="$BASE_URL/dev"
  elif [ "$VERSION" = "$DEFAULT_VERSION" ]; then
    OUTDIR="$PUBLIC_DIR"
    BRANCH="website/$VERSION"
    FINAL_BASE_URL="$BASE_URL" # no /version suffix for default version!
  else
    OUTDIR="$PUBLIC_DIR/$VERSION"
    BRANCH="website/$VERSION"
    FINAL_BASE_URL="$BASE_URL/$VERSION"
  fi

  # If the current branch matches docsVersion, build directly from the current branch (no worktree needed)
  if [ "$VERSION" = "$DOCS_VERSION" ]; then
    info "Building $VERSION version directly from current branch ($CURRENT_BRANCH) into $OUTDIR"
    # Make npm clean install (using the dependency lock file)
    npm ci || { err "npm ci failed for $CURRENT_BRANCH"; exit 1; }
    # Always update Hugo modules and install dependencies before building
    npm run hugo -- mod get -u || { err "hugo mod get -u failed for $CURRENT_BRANCH"; exit 1; }
    npm run hugo -- mod tidy || { err "hugo mod tidy failed for $CURRENT_BRANCH"; exit 1; }
    # Execute Hugo build with the final base URL
    npm run build -- --destination "$OUTDIR" --baseURL "$FINAL_BASE_URL" || { err "npm run build failed for $CURRENT_BRANCH"; exit 1; }
    BUILT_VERSIONS["$VERSION"]="$OUTDIR"
    continue
  fi

  # Otherwise, build from the corresponding branch using a git worktree
  # Ensure the branch exists locally; if not, try to fetch it from origin
  if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    info "Branch $BRANCH not found locally, attempting to fetch from origin."
    if ! git fetch origin "$BRANCH:$BRANCH" 2>/dev/null; then
      err "Branch '$BRANCH' for version '$VERSION' does not exist (neither local nor remote)"
      err "Please create the branch or remove '$VERSION' from versions.json"
      exit 1
    fi
  fi

  info "Building version $VERSION from branch $BRANCH into $OUTDIR"
  git worktree add "$WORKTREE_BASE/$VERSION" "$BRANCH" || { err "Failed to add worktree for $BRANCH"; exit 1; }
  pushd "$WORKTREE_BASE/$VERSION" >/dev/null

  # Copy the latest data/versions.json into the worktree for the version switcher (except for current branch)
  if [ "$VERSION" != "$DOCS_VERSION" ]; then
    cp "../../$VERSIONS_JSON_PATH" data/versions.json
    info "Copied latest data/versions.json into worktree for $VERSION."
  fi

  # Optimization: reuse central node_modules if package-lock.json is identical
  # This saves time and disk space for identical dependencies across versions
  if cmp -s package-lock.json ../../package-lock.json; then
    info "package-lock.json is identical, creating symlink to central node_modules."
    ln -s ../../node_modules ./node_modules
  else
    # Make npm clean install (using the dependency lock file)
    info "package-lock.json differs from central version. Installing separate dependencies for this version."
    npm ci || { err "npm ci failed for $BRANCH"; popd >/dev/null; exit 1; }
  fi

  # Always update Hugo modules before building
  npm run hugo -- mod get -u || { err "hugo mod get -u failed for $BRANCH"; popd >/dev/null; exit 1; }
  npm run hugo -- mod tidy || { err "hugo mod tidy failed for $BRANCH"; popd >/dev/null; exit 1; }

  # Build the site for this version using the final base URL
  npm run build -- --destination "../../$OUTDIR" --baseURL "$FINAL_BASE_URL" || { err "npm run build failed for $BRANCH"; popd >/dev/null; exit 1; }
  BUILT_VERSIONS["$VERSION"]="$OUTDIR"

  # Clean up and remove the worktree after building
  popd >/dev/null
  git worktree remove "$WORKTREE_BASE/$VERSION" --force
done

# Print a summary of all built versions and their output directories
info "Multi-version build completed. Output in folder $PUBLIC_DIR/."
echo "--- Build Summary ---"
for VERSION in "${!BUILT_VERSIONS[@]}"; do
  printf "Version: %-10s → %s\n" "$VERSION" "${BUILT_VERSIONS[$VERSION]}"
done

# Note: Cleanup is handled by the trap function automatically