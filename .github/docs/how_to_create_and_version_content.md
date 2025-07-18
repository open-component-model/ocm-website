# OCM Website Content Creation, Versioning & Deployment - Process Guide

## 🎯 Objective and Summary

This document describes the complete process for managing, versioning,
and publishing our static OCM documentation website, including content from other repositories, e.g. `ocm` or `open-component-model` using Hugo modules.

The website utilizes:

- **Frontmatter** for each page to define metadata like title, description, and logo. The templates are stored in `.github/templates/`.
- **Version branches** (e.g., `v1.4.0`) for each released version.
- A central file `data/versions.json` to power the version switcher.
- **Hugo Modules** to include the reference documentation for the CLI and APIs from other repositories. The modules are created from specific folders in other Git repositories, using tags. The respective folders are then mounted into the website.
- A build output directory `public/` that contains all versions in parallel
in different subfolders (e.g., `public/v1.4.0/`).

### 🔧 Key Components

1. **Content Creation**
   - Uses Markdown files with frontmatter for metadata
   - Organized in sections under `content/`
   - Each section requires an `_index.md` file for metadata

2. 🧱 **Branch and Content Preparation**
   - Creates a new version branch (`vX.Y.Z`)
   - Modifies `params.toml`, `module.toml`, and `data/versions.json`
   - Opens a PR to update `main`

3. 🔄 **Version Synchronization**
   - After the PR is merged into `main`
   - Updates `versions.json` in all existing version branches

4. 🚀 **Multi-Version Site Build and Deployment**
   - Builds all versions using Hugo
   - Stores output in `public/vX.Y.Z/`
   - Copies the `latest` version content to `public/`
   - Deployment handled via GitHub Pages using an existing workflow

---

## 📚 Content Creation

### 📝 Frontmatter

Each page in the website MUST have a frontmatter section at the top of the file, which defines the metadata for that page. The frontmatter should include:

```yaml
title: "Page Title"
description: "A brief description of the page content"
logo: "📄"  # Optional, can be an emoji or icon representing the page
weight: 92  # Optional, used to order the pages in the sidebar. Leave it out for default ordering.
```

The templates for the frontmatter are stored in `.github/templates/`. You can use these templates to ensure consistency across all pages.

### Sections and normal Content

Each section of the website SHOULD be organized in a way that makes it easy to navigate. The content should be written in Markdown and placed in the appropriate directory under `content/`. Each section can have its own subdirectory, and you can use the frontmatter to define the title and description for each page.

`Sections` can be created by adding new directories under `content/`, and each page within those sections should have its own Markdown file with the appropriate frontmatter. The section itself REQUIRES an `_index.md` file with frontmatter to define the section title and description. There MUST NOT be any additional content in the `_index.md` file, as it is only used for metadata.

'Normal content' pages can be created by adding Markdown files within specific section directories. Each page should have its own frontmatter to define its title, description, and other metadata.

## 📝 Step-by-Step Instructions for Versioning (Manual Execution)

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
