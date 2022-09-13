# ocm.software

This repository houses the assets used to build Open Component Model website [](https://ocm.sofware).

The sources for some of the documentation are housed in other repositories with the Open Component Model GitHub Organisation. Documentation issues and pull requests should be made against those repositories.

Project             | GitHub Source
---------------------------
OCM CLI             | <https://github.com/open-component-model/ocm>
OCM Specification   | <https://github.com/open-component-model/ocm-spec>

## How to modify this website

Content lives under the `content/en` directory.

- `./content/en/docs/cli-reference` contains the generated CLI documentation
- `./content/en/spec` contains the generated OCM Specification documentation
- `./content/en/blog` contains all blog posts


New pages can be created using the following command:

```bash
npm run create <location>
```

A GitHub Actions workflow will generate documentation for the OCM CLI. The workflow will checkout the latest version of the `gardener/ocm` repository, generate the documentation and create a PR against `main`. This can be be triggered as necessary using a manual dispatch:

`gh workflow run`

Alternatively, you can trigger the workflow via the menu "Actions -> Update OCM CLI Docs".

## Running the site locally

The following tools should be installed prior to running the site locally:
- [Node.js](https://docs.npmjs.com/getting-started)
- [Hugo](https://gohugo.io/)

With the tooling in place you can install the node dependencies:

`npm install`

Then run the site:

`npm run start`

Navigate to http://localhost:1313 to see the site running in your browser. Any updates you make to the site will be reflected in the browser immediately.

## Publishing the site

The Open Component Model website is published using GitHub Pages. A GitHub Actions workflow will run whenever there is a commit to the `main` branch. The workflow publishes the compiled assets to the `gh-pages` branch from which GitHub Pages will serve.
