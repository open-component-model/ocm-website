# OCM Website Content Creation, Versioning & Deployment - Process Guide

## 🎯 Objective and Summary

This document describes the process for creating and managing our static OCM documentation website, including reference content from the docs folder of other repositories, e.g. `ocm` or `open-component-model` using Hugo modules.

The website utilizes:

- **Frontmatter** for each document to define metadata like title, description, and logo. The templates are stored in `.github/templates/`.

- **Version Branches** (e.g., `v1.4.0`) for each released version of the website. New content is created in the `main` branch, and then branched to the respective website version branch when we release a new OCM version. Corrections and updates to existing content are made in the release branch and are then cherry-picked to the `main` branch.

- **Hugo Modules** to include the reference documentation for CLI, APIs and other content from other repositories (respectively other folders when all components live in a monorepo). The required versions of the modules are defined in `main` using the release tags of the respective repositories.

## 📚 Content Creation

### 📝 Frontmatter

Each page in the website MUST have a frontmatter section at the top of the file, which defines the metadata for that page. This is required for Hugo to work correctly. The frontmatter should include:

```yaml
title: "Page Title"
description: "A brief description of the page content"
logo: "📄"  # Optional, can be an emoji or icon representing the page on its section page.
weight: 92  # Optional, used to order the pages in the sidebar. Leave it out for default ordering.
```

The templates for the frontmatter are stored in `.github/docs/templates/`. You can use these templates to ensure consistency across all pages.

### Sections Pages and Normal Content Pages

A section page is a special type of content page that serves as a landing page for a specific section of the website. Each section of the website SHOULD be organized in a way that makes it easy to navigate. The content MUST be written in Markdown and placed in the appropriate directory under `content/`. Each section has its own subdirectory, and you can use the frontmatter to define title, description and logo for each page.

`Sections` are created by adding new directories under `content/`, and each page within those sections has its own Markdown file with the appropriate frontmatter. The section itself REQUIRES an `_index.md` file with frontmatter to define the section title and description. There MUST NOT be any additional content in the `_index.md` file, as it is only used for metadata and navigation purposes.

'Normal content' pages are created by adding Markdown files within specific section directories. Each page should have its own frontmatter to define its title, description, and other metadata.

### Commit and Push

After creating or updating content, you MUST commit your changes with a clear message indicating what was changed. All changes are done in the `main` branch using PRs. A new release of the website will include all changes made in the `main` branch since the last release and merge it into the respective version branch. In case of required corrections to already released content, the changes are made in the `main` branch and then merged to the respective version branch(es).
