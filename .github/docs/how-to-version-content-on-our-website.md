# How to Create and Update Website Versions

## 🎯 Objective and Summary

This document describes the process for creating new versions of our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `open-component-model` using [Hugo modules](https://gohugo.io/hugo-modules/use-modules/), which are technically Go modules. The website is hosted on GitHub Pages and uses a multi-version setup to allow users to switch between different versions of the documentation. Due to the nature of static websites, all versions that should later be shown on the website need to be built in parallel and deployed to the same `public/` directory, with each version living in its own subfolder.

## The basic setup of the multi-version website in a nutshell

- **Version branches** (e.g., `releases/vx.y`) for each released website version.

- A **central file `data/versions.json`** to power the version switcher. This file contains all versions to be used on the website. We'll have these versions:
  - `current` holds the content of our current website, dedicated to OCM v1.
  - `dev` holds the content dedicated to the ongoing development in the `main` branch of the open-component-model monorepo, dedicated to OCM v2.
  - `vx.y` hold the content of the released versions of the website, e.g., `v1.4.0`, `v1.5.0`, etc.

- **Hugo Modules** to include reference documentation for the CLI and APIs from other repositories. The modules are created from the submodules in the remote Git repositories using tags, e.g. ocm.software/open-component-model/cli for the OCM CLI. The modules (or subfolder inside them) are then mounted into the website. The config for these modules is stored in `config/_default/module.toml` and only needs to be maintained in the `main` branch.

- A **build output directory `public/`** that is created during each build of the website and contains all versions in parallel in different subfolders. The default version displayed when the websites is opened, most-likely the latest released version, lives in the root `public` folder, other versions in subfolders like `public/v1.4.0/`. This is required for the static website hosted on GitHub Pages deployment to work correctly, as the complete website is deployed from the `public/` directory. Only then the version switcher works correctly and offers back-and-forth navigation.

- Using URL patterns like `https://ocm.software/vx.y/` to access the versioned content, where `x.y` is the version tag.

## 🛠️ Versioning Process Step-by-Step

The versioning process consists of several steps, which can be executed manually or automatically via GitHub Actions workflows. The following steps outline the process:

### 🔧 Define Modules for Reference Docs (in `main`)

The reference documentation for the CLI and APIs is imported using Hugo modules. The configuration for the modules is stored in `config/_default/module.toml` of the website and only needs to be maintained in the `main` branch. It specifies the module(s) to be imported, the source folder and the target folder where the content should be mounted in the website structure. It is expected that the configuration in `main` is always up-to-date and does need to be touched during branching action.

Example configuration for importing CLI reference content under `content/docs/reference/ocm-cli`:

   ```toml
   [[imports]]
   path = "ocm.software/open-component-model/cli"  # Go module path
   [[imports.mounts]]
      source = "docs/reference"                    # Source folder in the Go module
      target = "content/docs/reference/ocm-cli"    # Target folder in the website structure
   ```

### Define Default Version (in `main`)

The `defaultVersion` parameter in `config/_default/params.toml` determines which version is shown when entering the website. It is shown with `(default)` in the version switcher. It also determines which version to be built to the root `public/` folder during the build process. This parameter should be set to the latest released version of the website, e.g., `v1.5.0`, or `current` as long as we still support the v1 content for the website.

### 📄 Update Version Information (in `main`)

Update a new website version in the the file `data/versions.json`, which is used by the version switcher to display the correct versions. Before creating a new version branch, the `data/versions.json` file in the `main` branch should be updated with the new version information in the `versions` list. The list should contain all available versions, including the new one.

### 🧱 Create a New Version Branch

To be able to fix already released content on the website, we create version branches from the `main` branch. These branches are named `releases/website/vx.y`, where `vx.y` is the version tag of the website. Normally this step should be part of the release process of the OCM monorepo, but can also be done manually if needed.

### 🛠️ Update Version Information (in `releases/website/vx.y`)

Configure the dedicated version of the website in `config/_default/params.toml` and set the `docsVersion` parameter to the new version tag `vx.y`.

### Define Version of Hugo Modules (in `releases/website/vx.y`)

To define the correct version of the reference content for the website, the Hugo modules need to be fetched once to the correct version. This is done by running `hugo mod get` for the wanted version of the referenced module(s), e.g. `hugo mod get ocm.software/open-component-model/cli@v.x`. Ideally the website version matches the version of the referenced module, but this is not a strict requirement. **The correct version needs to be known only when branching the website. All later updates are done using `hugo mod get -u` which will update the module to the latest version of the specified tag**

Execute `hugo mod tidy` to ensure that the module dependencies are up-to-date and the `go.mod` file is clean. Then commit the changes to the `releases/website/vx.y` branch.

### 🚀 Multi-Version Site Build and Deployment

For publishing the website, we need to build all versions in parallel and deploy them to the `public/` directory. The build process is handled by an automated workflow and uses the following steps:

- Loop through all versions defined in `data/versions.json` and check out the corresponding version branch using `git worktree`.
- Loop through all worktrees and
  - navigate into the version worktree directory
  - update all used Hugo modules for reference docs using `hugo mod get -u`
  - build the website version using Hugo: `npm run build -- --destination ../../public/vx.y --baseURL "https://ocm.software/vx.y"`
- The build output is stored in parallel folders under `public/`, e.g., `public/vx.y`. The default version gets deployed to the root `public` folder.
- For version `dev` in the version switcher we need a special, hard-coded mapping to the `main` branch.
- Once all versions are built, the `public/` directory is deployed to the GitHub Pages branch of the repository, using Gh action `peaceiris/actions-gh-pages`and the branch `gh-pages`.

