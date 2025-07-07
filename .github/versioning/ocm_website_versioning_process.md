# OCM Website Content Versioning & Deployment - Process Guide

## 🎯 Objective and Summary

This document describes the complete process for managing, versioning,
and publishing our static OCM documentation website, including content from other repositories, e.g. `ocm` or `open-component-model` using Hugo modules.

The website utilizes:

- **Version branches** (e.g., `v1.4.0`) for each released version.
- A central file `data/versions.json` to power the version switcher.
- **Hugo Modules** to include the reference documentation for the CLI and APIs from other repositories. The modules are created from specific folders in other Git repositories, using tags. The respective folders are then mounted into the website.
- A build output directory `public/` that contains all versions in parallel
in different subfolders (e.g., `public/v1.4.0/`).

### 🔧 Key Components

1. 🧱 **Branch and Content Preparation**
   - Creates a new version branch (`vX.Y.Z`)
   - Modifies `params.toml`, `module.toml`, and `data/versions.json`
   - Opens a PR to update `main`

2. 🔄 **Version Synchronization**
   - After the PR is merged into `main`
   - Updates `versions.json` in all existing version branches

3. 🚀 **Multi-Version Site Build and Deployment**
   - Builds all versions using Hugo
   - Stores output in `public/vX.Y.Z/`
   - Copies the `latest` version content to `public/`
   - Deployment handled via GitHub Pages using an existing workflow

---

## 📝 Step-by-Step Instructions (Manual Execution)

### 🧱 Part 1 – Preparing a New Version

1. Create a new branch `vX.Y.Z` from `main`
2. In `config/_default/params.toml`, set `docsVersion = "vX.Y.Z"`
3. In `config/_default/module.toml`, configure the right folder and tag, e.g. replace `@main` with `@vX.Y.Z` (or a different content version if needed)
4. Update `data/versions.json`:
   - Add the new version to the `versions` list
   - Set/Keep `defaultVersion` to **latest**
5. Commit and push the new branch
6. Create a PR branch from `main` containing only the update to `versions.json`
7. Open a Pull Request targeting `main`

### 🔄 Part 2 – Synchronizing All Version Branches

1. Once the PR has been merged into `main`:
2. Retrieve the updated `data/versions.json` from `main`
3. Check out each existing `v*` version branch
4. Replace `data/versions.json` in each branch with the version from `main`
5. Commit and push changes if modified

### 🚀 Part 3 – Building and Publishing the Website

1. Use `git worktree` to check out all version branches locally
2. For each version:
   - Run `npm run build` (uses Hugo to build the site)
   - Copy the output into `public/vX.Y.Z/`
   - main branch will be built into root of `public/`
3. Deploy the final `public/` directory using the existing GitHub Pages deployment workflow (`publish-site.yaml`)
4. Note: The previous Python-based schema generation step has been removed

---

## 📦 Workflow Files (GitHub Actions)

### 1️⃣ `propose-main-updates.yml`

- Creates a new version branch `vX.Y.Z`
- Modifies version info in the necessary configuration files
- Pushes the branch
- Opens a PR for the `data/versions.json` update in `main`

### 2️⃣ `sync-branches-after-main-merge.yml`

- Triggered by updates to `main/data/versions.json`
- Checks out all `v*` branches
- Updates `data/versions.json` in each
- Pushes if changes are detected

### 3️⃣ `build-and-publish.yml`

- Triggered manually or automatically after merge
- Checks out all versions
- Builds each version using `npm run build`
- Copies the `defaultVersion` content to `public/`
- Uploads the final build for GitHub Pages deployment
- Completely removes the legacy schema generation logic

---

## 🔁 Full Workflow Orchestration

- 🔘 Trigger: `workflow_dispatch` with inputs for website version and content version
- 🧱 Step 1: Execute `propose-main-updates.yml` to create the new version and open a PR
- 📬 Manually merge the PR into `main`
- 🚀 Step 2: Trigger `sync-and-publish.yml` to update all version branches, build all versions, and deploy the complete site to GitHub Pages
