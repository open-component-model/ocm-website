# OCM Website Content Creation, Versioning & Deployment - Process Guide

## 🎯 Objective and Summary

This document describes the process for creating and managing our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `ocm` or `open-component-model` using Hugo modules.

The website utilizes:

- **Frontmatter** for each document to define metadata like title, description, and logo. The templates are stored in `.github/templates/`.
- **Version Branches** (e.g., `releases/website/v1.0`) for each released version of the website. New content is created in the `main` branch, and then branched to the respective website version branch when we release a new OCM version. Corrections and updates to existing content are made in the release branch and are then cherry-picked to the `main` branch.
- **Hugo Modules** to include the reference documentation for CLI, APIs and other content from other repositories (respectively other folders when all components live in a monorepo). The required versions of the modules MUST **always** be defined in `main` using the release tags of the respective repositories.

## ⚙️ Requirements

- Node.js >=22.12.0
- npm >=10.9.0
- Hugo (will be installed via npm)

To be able to test your changes with a locally running Hugo server, install all dependencies (npm is using the file `package-lock.json`):

```sh
npm ci
```

## 📚 Content Creation

### 📝 Frontmatter

Each page in the website MUST have a frontmatter section at the top of the file, which defines the metadata for that page. This is required for Hugo to work correctly. The frontmatter should include:

```yaml
title: "Page Title"
description: "A brief description of the page content"
logo: "📄"  # Optional, but highly recommended. Can be an emoji or icon representing the page on its section page.
weight: 92  # Optional, used to order the pages in the sidebar. Leave it out for default ordering.
```

The templates for the frontmatter are stored in `.github/docs/templates/`. You can use these templates to ensure consistency across all pages.

### Section Pages and Normal Content Pages

A section page is a special type of content page that serves as a landing page for a specific section of the website. Each section of the website SHOULD be organized in a way that makes it easy to navigate. The content MUST be written in Markdown and placed in the appropriate directory under `content/`. Each section has its own subdirectory, and you can use the frontmatter to define title, description and logo for each page.

`Sections` are created by adding new directories under `content/docs`, and each page within those sections has its own Markdown file with the appropriate frontmatter. The section itself REQUIRES an `_index.md` file with frontmatter to define the section title and description. There MUST NOT be any additional content in the `_index.md` file, as it is only used for metadata and navigation purposes.

'Normal' content pages are created by adding Markdown files within specific section directories. Each page should have its own frontmatter to define its title, description, and other metadata.

### 🧪 Test your changes locally

After creating or updating content, you MUST commit your changes with a clear message indicating what was changed. All changes are done in the `main` branch using PRs. A new release of the website will include all changes made in the `main` branch since the last release and merge it into the respective version branch. In case of required corrections to already released content, the changes are made in the `releases/website/vx.y` branch and then cherry-picked into the `main` branch if required.

To test your changes locally (only the version you currently work on), run:

```sh
npm run build
npm run dev
```

This will build the site and start a local Hugo server at <http://localhost:1313>. Hugo will not use the `public/` directory, but will build the site in memory and serve it from there. Changes to the content will be reflected immediately in the browser.

To test the complete website including all versions:

```sh
npm run build-multi-version
npx http-server ./public --port 1313
```

This will build all website versions in parallel and store the output in the `public/` directory, so you can test the version switcher and navigation locally.

### 💾 Commit & Pull Request Workflow

After testing your changes locally:

- Commit your changes with a clear and descriptive message, e.g.:

  ```sh
  git add .
  git commit -m "docs: add new section on authentication"
  git push
  ```

- Open a Pull Request (PR) against the `main` branch (or in case of a version branch against the respective `releases/website/vx.y` branch).
- In the PR description, summarize your changes and reference any related issues.
- Assign reviewers as needed.

### 🚀 What Happens When You Open a PR?

When you open a PR, a Netlify deploy preview is automatically generated. This preview uses the multi-version build script to build the complete website, including all versions. You will see a link to the deploy preview in the PR checks section.

This allows you and reviewers to test your changes on the fully rendered multi-version website before merging. Please verify:

- Your changes appear as expected in the preview
- The version switcher works correctly
- Navigation and content are correct across all versions

If you find any issues, update your PR and the preview will be rebuilt automatically.

### 🚨 Troubleshooting

- If the build fails, check the error messages in your terminal.
- Run `npm run lint:markdown` to check for formatting issues.
- Make sure your frontmatter is valid YAML.

### ✅ Checklist

- [ ] Requirements installed
- [ ] Frontmatter added to all new/changed pages
- [ ] Content placed in the correct directory
- [ ] Changes tested locally
- [ ] Commit message is clear
- [ ] PR created for review
- [ ] Changes documented in the PR description
