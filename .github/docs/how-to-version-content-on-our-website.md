# How to Create and Update Website Versions

## 🎯 Objective and Summary

This document describes the process for creating new versions of our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `open-component-model` using [Hugo modules](https://gohugo.io/hugo-modules/use-modules/), which are technically Go modules. The website is hosted on GitHub Pages and uses a multi-version setup to allow users to switch between different versions of the documentation. Due to the nature of static websites, all versions are built in parallel and deployed to the same `public/` directory, with each version living in its own subfolder. The latest version is served from the root of the `public/` directory.

## The basic setup of the multi-version website in a nutshell

- **Version branches** (e.g., `releases/vx.y`) for each released website version.

- A **central file `data/versions.json`** to power the version switcher. This file needs to be created from a central data source or file that contains all OCM product versions, the versions of their subcomponents, e.g. the CLI, and the versions to be used on the website.

- **Hugo Modules** to include reference documentation for the CLI and APIs from other repositories. The modules are created from specific folders in the remote Git repositories, using tags. The respective folders are then mounted into the website. The config for these modules is stored in `config/_default/module.toml`.

- A **build output directory `public/`** that contains all versions in parallel in different subfolders. The default version displayed when the websites is opened, most-likely the latest released version, lives in the root `public` folder, other versions in subfolders like `public/v1.4.0/`. This is required for the static website hosted on GitHub Pages deployment to work correctly, as the complete website is deployed from the `public/` directory. Only then the version switcher can work correctly, as it needs to link to the correct versioned content.

- Using URL patterns like `https://ocm.software/vx.y/` to access the versioned content, where `x.y` is the version tag.

## 🔧 Steps to Create a new Website Version

### 🧱 Branching and Configuration

- Updates `data/versions.json`:
  - Adds the new version to the `versions` list
  - The file with the complete list of versions has to be present when building a specific version of the website, as it is used by the version switcher to display the correct versions.
  - To avoid updating old version branches with that information, the file will be pulled dynamically during the build process for each version, using the latest version of the file from `main`.

- Creates a new version branch (`releases/vx.y.z`)
  - Modifies Hugo website configuration files:
  - `config/_default/params.toml`: sets the `docsVersion` parameter to the new version tag
  - `config/_default/module.toml`: configures the Hugo module to import content from. Specifes the source and target
  folder for the reference content to be included in the website.
    - This is done using Hugo Modules, which are Go modules, and allow us to import content from other repositories and mount it into our website structure.
    - Using the 
    - Example configuration for importing CLI reference content under `content/docs/reference/ocm-cli`:

      ```toml
      [[imports]]
      path = "github.com/open-component-model/open-component-model"
      [[imports.mounts]]
         source = "docs/reference/cli"
         target = "content/docs/reference/ocm-cli"
      ```

- Opens a PR to update `main`

### 🚀 Multi-Version Site Build and Deployment

- Builds all website versions using Hugo one after another
- Stores output in parallel folders under `public/`, e.g., `public/vx.y`. The default version displayed when the websites is opened, most-likely the latest released version, lives in the root `public` folder.
- To keep the version switcher functional and mount the correct version of the reference content for each version, the build process requires this information:
   - `data/versions.json` file to determine the available versions and loop through them.
   - `docsVersion` parameter in `config/_default/params.toml` to determine the folder und `public/` and the version to be built.
   - `defaultVersion` parameter in `config/_default/params.toml` to determine version to be build to the root `public/` folder.
   - mapping between website version and Hugo module version(s), to be able to update the Hugo module with the correct version of the reference content using `hugo mod get github.com/open-component-model/open-component-model@v.x.y.z` before building the website.
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
