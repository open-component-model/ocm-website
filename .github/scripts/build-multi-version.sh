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
# DEBUG:
#   For troubleshooting, enable bash's built-in debug mode by adding 'set -x'
#   at the start of your command:
#     bash -x .github/scripts/build-multi-version.sh
#
# EXAMPLES:
#   bash .github/scripts/build-multi-version.sh
#   bash .github/scripts/build-multi-version.sh http://localhost:1313
#   bash -x .github/scripts/build-multi-version.sh  # with debug output
# -----------------------------------------------------------------------------

# Read baseURL from first argument, default to https://ocm.software
BASE_URL="${1:-https://ocm.software}"

# Helpers for output
err() { echo "[ERROR] $*" >&2; }
info() { echo "[INFO] $*"; }

# Cleanup function to ensure temp files are removed on exit
cleanup() {
  local exit_code=$?
  rm -rf "${TMP_MAIN_VERSIONS:-}" "${WORKTREE_BASE:-}" 2>/dev/null || true
  rm -f .tmp-versions-backup.json 2>/dev/null || true
  git worktree prune 2>/dev/null || true
  # Restore backup if it exists (in case of unexpected termination)
  if [ -f .tmp-versions-backup.json ]; then
    mv .tmp-versions-backup.json data/versions.json 2>/dev/null || true
  fi
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

# Get docsVersion and current branch only once for later use
DOCS_VERSION=$(grep -E '^[[:space:]]*docsVersion[[:space:]]*=' config/_default/params.toml | cut -d'=' -f2 | tr -d ' "')
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# --- Determine the correct source for data/versions.json ---
# Strategy: Use main branch versions as authoritative source, except when:
# 1. We're on main branch (use local)
# 2. Main branch is not available (use local)
# 3. Local has more versions than main (preparing new release)

# Function to get versions from a file
get_versions_from_file() {
  local file="$1"
  if [ -f "$file" ] && validate_versions_json "$file" "$(basename "$file")"; then
    jq -r '.versions[]' "$file" 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Function to decide which versions.json to use
decide_versions_source() {
  local local_file="$1"
  local main_file="$2"
  
  local local_versions=$(get_versions_from_file "$local_file")
  local main_versions=$(get_versions_from_file "$main_file")
  
  local local_count=$(count_versions "$local_versions")
  local main_count=$(count_versions "$main_versions")
  
  # Decision logic
  if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "local" "Using local data/versions.json (on main branch)"
  elif [ -z "$main_versions" ]; then
    echo "local" "Using local data/versions.json (main branch not available)"
  elif [ "$local_count" -gt "$main_count" ]; then
    echo "local" "Using local data/versions.json (contains more versions: $local_count vs $main_count)"
  else
    echo "main" "Using data/versions.json from main (authoritative source)"
  fi
}

# Validate local versions.json first
VERSIONS_JSON_PATH="data/versions.json"
if ! validate_versions_json "$VERSIONS_JSON_PATH" "Local"; then
  exit 1
fi

# Try to fetch main branch versions.json for comparison
TMP_MAIN_VERSIONS=".tmp-main-versions"
rm -rf "$TMP_MAIN_VERSIONS"
mkdir -p "$TMP_MAIN_VERSIONS"
MAIN_VERSIONS_FILE="$TMP_MAIN_VERSIONS/versions.json"

# Ensure we have the latest main branch for comparison
# This is especially important in CI environments like Netlify
git fetch origin main:refs/remotes/origin/main 2>/dev/null || echo "Could not fetch main branch"

if git show origin/main:data/versions.json > "$MAIN_VERSIONS_FILE" 2>/dev/null; then
  info "Successfully fetched data/versions.json from origin/main."
else
  info "Could not fetch data/versions.json from origin/main (this is OK for new repos)."
fi

# Decide which source to use
read -r SOURCE REASON <<< "$(decide_versions_source "$VERSIONS_JSON_PATH" "$MAIN_VERSIONS_FILE")"

if [ "$SOURCE" = "main" ]; then
  VERSIONS_JSON_PATH="$MAIN_VERSIONS_FILE"
  USE_LOCAL_VERSIONS=false
else
  USE_LOCAL_VERSIONS=true
fi

info "$REASON"
if [ "$SOURCE" = "main" ]; then
  info "Final decision: Using data/versions.json from main branch for version resolution."
else
  info "Final decision: Using local data/versions.json from current branch for version resolution."
fi

# Read all available versions from determined data/versions.json
VERSIONS=$(jq -r '.versions[]' "$VERSIONS_JSON_PATH")
if [ -z "$VERSIONS" ]; then
  err "No versions found in $VERSIONS_JSON_PATH."
  exit 1
fi

# Read default version from config/_default/params.toml
DEFAULT_VERSION=$(grep -E '^[[:space:]]*defaultVersion' config/_default/params.toml | cut -d'=' -f2 | tr -d ' "')
if [ -z "$DEFAULT_VERSION" ]; then
  err "defaultVersion not found in config/_default/params.toml."
  exit 1
fi

# Check if  default version exists in versions.json
if ! echo "$VERSIONS" | grep -q "^$DEFAULT_VERSION$"; then
  err "defaultVersion '$DEFAULT_VERSION' not found in versions.json"
  err "Available versions: $(echo "$VERSIONS" | tr '\n' ' ')"
  exit 1
fi

git worktree prune  # Clean up stale worktrees

# Prepare output and worktree directories
PUBLIC_DIR="public"
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"

WORKTREE_BASE=".worktrees"
rm -rf "$WORKTREE_BASE"
mkdir -p "$WORKTREE_BASE"

# read all Hugo module imports for updating modules in "dev" version
get_hugo_imports() {
  npm run hugo -- --logLevel error config --format json \
    | jq -r '.[].module.imports[]?.path' 2>/dev/null \
    | sort -u
}

# Update Hugo modules for a given version
# For "dev" version, set each module explicitly to @main to get latest changes
# For other versions, use pinned go.mod without changes
update_modules_for_version() {
  local ver="$1"
  if [ "$ver" = "dev" ]; then
    info "DEV: set each Hugo module to @main"
    local modules
    modules=$(get_hugo_imports || true)
    if [ -n "$modules" ]; then
      for m in $modules; do
        npm run hugo -- mod get "${m}@main" || { err "hugo mod get ${m}@main failed"; return 1; }
      done
    else
      info "No module imports found in effective config."
    fi
    npm run hugo -- mod tidy || { err "hugo mod tidy failed"; return 1; }
  else
    info "Non-DEV: using pinned go.mod (no module actions)"
    :
  fi
}

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

  # If current branch matches docsVersion, build directly from the current branch (no worktree needed)
  if [ "$VERSION" = "$DOCS_VERSION" ]; then
    info "Building $VERSION version directly from current branch ($CURRENT_BRANCH) into $OUTDIR"

    # Temporarily replace data/versions.json if we're using main branch versions
    TEMP_BACKUP=""
    if [ "$USE_LOCAL_VERSIONS" = "false" ]; then
      TEMP_BACKUP=".tmp-versions-backup.json"
      cp data/versions.json "$TEMP_BACKUP"
      cp "$VERSIONS_JSON_PATH" data/versions.json
      info "Temporarily using versions.json from main branch for build."
    fi

    # Make npm clean install (using the package-lock.json file)
    npm ci || { err "npm ci failed for $CURRENT_BRANCH"; exit 1; }

    # Update Hugo modules for "dev" version. In case of errors restore backup of versions.json and exit
    update_modules_for_version "$VERSION" || { [ -n "$TEMP_BACKUP" ] && mv "$TEMP_BACKUP" data/versions.json; exit 1; }
    
    # Execute Hugo build with final base URL
    npm run build -- --destination "$OUTDIR" --baseURL "$FINAL_BASE_URL" || { 
      # Restore backup on failure
      if [ -n "$TEMP_BACKUP" ]; then
        mv "$TEMP_BACKUP" data/versions.json
      fi
      err "npm run build failed for $CURRENT_BRANCH"
      exit 1
    }
    
    # Restore original versions.json after successful build
    if [ -n "$TEMP_BACKUP" ]; then
      mv "$TEMP_BACKUP" data/versions.json
      info "Restored original versions.json after build."
    fi
    
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

  # Copy latest data/versions.json into the worktree for the version switcher (except for current branch)
  if [ "$VERSION" != "$DOCS_VERSION" ]; then
    cp "../../$VERSIONS_JSON_PATH" data/versions.json
    info "Copied latest data/versions.json into worktree for $VERSION."
  fi

  # Optimization: reuse central node_modules if package-lock.json is identical
  if cmp -s package-lock.json ../../package-lock.json; then
    if [ -d ../../node_modules ]; then
      info "package-lock.json is identical, creating symlink to central node_modules."
      ln -s ../../node_modules ./node_modules
    else
      info "Central node_modules not present yet; installing dependencies in worktree."
      npm ci || { err "npm ci failed for $BRANCH"; popd >/dev/null; exit 1; }
    fi
  else
    info "package-lock.json differs from central version. Installing separate dependencies for this version."
    npm ci || { err "npm ci failed for $BRANCH"; popd >/dev/null; exit 1; }
  fi
  # Update Hugo Modules for "dev" version
  update_modules_for_version "$VERSION" || { popd >/dev/null; exit 1; }

  # Build  site for this version using final base URL
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
