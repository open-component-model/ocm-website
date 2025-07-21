# How to Create and Update Website Versions

## 🎯 Objective and Summary

This document describes the process for creating new versions of our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `ocm` or `open-component-model` using Hugo modules.

The website utilizes:

- **Version branches** (e.g., `v1.4.0`) for each released website version.

- A **central file `data/versions.json`** to power the version switcher.

- **Hugo Modules** to include the reference documentation for the CLI and APIs from other repositories. The modules are created from specific folders in the remote Git repositories, using tags. The respective folders are then mounted into the website. The config for these modules is stored in `config/_default/module.toml` and `config/_default/params.toml`.

- A **build output directory `public/`** that contains all versions in parallel in different subfolders. `main` lives in the root `public` folder, other versions in subfolders like `public/v1.4.0/`. This is required for the GitHub Pages deployment to work correctly, as the complete website is deployed from the `public/` directory.

### 🔧 Key Components

1. 🧱 **Branch and Content Preparation**
   - Creates a new version branch (`vX.Y.Z`)
   - Modifies `params.toml`, `module.toml`, and `data/versions.json`
   - Opens a PR to update `main`

2. 🔄 **Version Info Synchronization**
   - Done after PR is merged into `main`
   - Updates `data/versions.json` in all existing version branches to allow the version switcher to work correctly across all versions.

3. 🚀 **Multi-Version Site Build and Deployment**
   - Builds all versions using Hugo one after another
   - Stores output in parallel folders under `public/`, e.g., `public/vX.Y.Z/`. `main` content lives in `public/`.
   - Deployment handled via GitHub Pages using an existing workflow

## 📝 Step-by-Step Instructions for Website Version Branches (Manual Execution)

### 🧱 Preparing a New Version

1. Create a new branch `vX.Y.Z` from `main`

2. In `config/_default/params.toml`, set exactly that version tag to the parameter `docsVersion = "vX.Y.Z"`

3. In `config/_default/module.toml`, configure the right source repo and folder for all content modules, e.g.

   ```toml
   [[imports]]
   path = "github.com/open-component-model/open-component-model"
   [[imports.mounts]]
      source = "docs/reference/cli"
      target = "content/docs/reference/ocm-cli"
   ```

4. Update `data/versions.json`:
   - Add the new version to the `versions` list parameter
   - Set/Keep `defaultVersion` to **latest**

5. Commit and push the new branch

6. Create a PR branch from `main` containing only the update to `data/versions.json`

7. Open a Pull Request targeting `main`

### 🔄 Synchronizing All Version Branches

1. Once the PR has been merged into `main`:
2. Retrieve the updated `data/versions.json` from `main`
3. Check out each existing `v*` version branch
4. Replace `data/versions.json` in each branch with the version from `main`
5. Commit and push changes if modified

### 🚀 Part 3 – Building and Publishing the Website

1. Use `git worktree` to check out all version branches locally in parallel. `main` will be checked out in the root directory, and each version branch will be checked out into a subdirectory under `website-build/`:  
   - `git worktree add ./website-build/vX.Y.Z vX.Y.Z` for each version branch
2. For each version execute the build process in its respective directory. The build command will build the site and output it to the `public/` directory:
   - For `main`: Run `npm run build -- --destination ../../public --baseURL "https://ocm.software"`
   - For other versions: Run `npm run build -- --destination ../../public/vX.Y.Z --baseURL "https://ocm.software/vX.Y.Z"`
3. Deploy the final `public/` directory using deployment workflow (to be adopted from the existing GitHub Actions workflow).

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
