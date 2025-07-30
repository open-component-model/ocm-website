# How to Create and Update Website Versions

## 🎯 Objective and Summary

This document describes the process for creating new versions of our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `open-component-model` using [Hugo modules](https://gohugo.io/hugo-modules/use-modules/), which are technically Go modules.

The website is hosted on GitHub Pages and uses a multi-version setup to allow users to switch between different versions of the documentation. Due to the nature of static websites, all versions that should later be shown on the website need to be built in parallel and deployed to the same `public/` directory, with each version living in its own subfolder.

## ⚙️ Requirements

- Node.js >=22.12.0
- npm >=10.9.0
- Hugo (will be installed via npm)

To be able to test your changes with a locally running Hugo server, install EXACTLY the dependencies that are defined for the current version (npm is using the file `package-lock.json`):

```sh
npm ci
```

## The Basic Setup of the Multi-Version Website in a Nutshell

- **Version branches** e.g., `website/vx.y` for each released website version.

- A **central file `data/versions.json`** to power the version switcher. This file contains all versions to be used on the website. We'll have these versions:

  - `current` holds the content of our current website, dedicated to OCM v1.
  
  - `dev` holds the content dedicated to the ongoing development in the `main` branch of the `open-component-model` monorepo, dedicated to OCM v2.
  
  - `vx.y` hold the content of the released versions of the website, e.g., `v1.0`, `v2.0`, etc.

- **Hugo Modules** to include reference documentation for the CLI and APIs from other repositories. The modules are created from the Go submodules in the remote Git repositories using tags, e.g. `ocm.software/open-component-model/cli` for the OCM CLI. The modules (or subfolder inside them) are then mounted into the website. The configuration for these modules is stored in `config/_default/module.toml` and MUST only be maintained in the `main` branch.

- A **build output directory `public/`** that is created during each build of the website and contains all versions in parallel in different subfolders. The default version displayed when the website is opened, most-likely the latest released version, lives in the root `public` folder, other versions in subfolders like `public/v1.0`. This is required for the static website hosted as GitHub Pages deployment to work correctly, as the complete website is deployed from the `public/` directory. Only then the version switcher works correctly and offers back-and-forth navigation.

- Using **URL patterns** like https://ocm.software`/vx.y/` to access the versioned content, where `vx.y` is the version tag.

## 🛠️ Versioning Process Step-by-Step

1. 🧩 **Define Modules for Reference Docs (in `main`)**
   - Configure Hugo modules in `config/_default/module.toml`.

   - Example:

     ```toml
     [[imports]]
     path = "ocm.software/open-component-model/cli"
       [[imports.mounts]]
         source = "docs/reference"
         target = "content/docs/reference/ocm-cli"
     ```

2. 🎯 **Set Default Version (in `main`)**
   - The `defaultVersion` parameter in `config/_default/params.toml` determines which version is shown when the website is accessed and displayed as `(default)` in the version switcher behind the version. Normally this is the latest released version of the website, e.g., `v1.0`, or `current` as long as we still support the v1 content for the website.

   - Example:

     ```toml
     defaultVersion = "current"
     ```

3. 🗂️ **Update Version Information (in `main`)**
   - Update `data/versions.json` with the new version in the `versions` list.

   - Example:

     ```json
     {
       "versions": ["current", "dev", "v1.0", "v2.0"]
     }
     ```

4. 🌿 **Create a New Version Branch**
   - Create a branch from `main`, following the naming convention `website/vx.y`.
  
   - Example:

     ```sh
     git checkout -b releases/website/v1.0
     ```

5. 📝 **Update Version Information (in `website/vx.y`)**
   - Set the `docsVersion` parameter in `config/_default/params.toml` to the version just used for the new website branch.
  
   - Example:

     ```toml
     docsVersion = "v1.0"
     ```

6. 📦 **Set Hugo Module Version (in `website/vx.y`)**
   - Fetch the correct version of the referenced module(s). You MUST know what module version matches the version of the website you are creating a version branch for.

   - This is done by running `hugo mod get` for the wanted version of the referenced module(s). Ideally the website version matches the version of the referenced module, but this is not a strict requirement. **The correct version needs to be known only when branching the website** All later updates are done using `hugo mod get -u` which will update the module to the latest version of the specified tag.

     ```sh
     hugo mod get ocm.software/open-component-model/cli@v1.0
     hugo mod tidy
     ```

   - Commit changes to the branch.

7. 🚀 **Multi-Version Site Build and Deployment**
   - Build all versions in parallel and save the output to `public/`.
  
   - Use the build script:

     ```sh
     npm run build-multi-version
     ```

   - This will:
  
     - Loop through all versions in `data/versions.json`

     - Checkout corresponding branches using `git worktree`
  
     - Navigate into the version worktree directory
  
     - Update all used Hugo modules based on the available in `go.mod` using `hugo mod get -u`
  
     - Update Hugo modules and build each version into `public/vx.y`, using  `npm run build -- --destination ../../public/vx.y --baseURL "https://ocm.software/vx.y"`
  
     - The default version is built into `public/`
  
     - For version `dev` in the version switcher we need a special, hard-coded mapping to the `main` branch.
  
   - Test locally:

     ```sh
     npm run build-multi-version
     npx http-server ./public --port 1313
     ```

   - Deploy to GitHub Pages using the workflow (see `.github/workflows/gh-pages.yml`).

## ✅ Checklist

- [ ] Requirements installed
- [ ] Version information updated
- [ ] Hugo modules configured
- [ ] Branch created
- [ ] Changes tested locally
- [ ] PR created for review
