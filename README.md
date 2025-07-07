# ocm.software

[![REUSE status](https://api.reuse.software/badge/github.com/open-component-model/ocm-website)](https://api.reuse.software/info/github.com/open-component-model/ocm-website)
[![publish site status](https://github.com/open-component-model/ocm-website/actions/workflows/publish-site.yaml/badge.svg)](https://github.com/open-component-model/ocm-website/actions/workflows/publish-site.yaml)

This repository houses the assets used to build [Open Component Model website](https://ocm.software).

The sources for some of the documentation are housed in other repositories with the Open Component Model GitHub Organisation. Documentation issues and pull requests should be made against those repositories:

| Project           | GitHub Source                                      |
| ----------------- | -------------------------------------------------- |
| OCM CLI           | <https://github.com/open-component-model/ocm>      |
| OCM Specification | <https://github.com/open-component-model/ocm-spec> |

## How to modify this website

Content lives under the `content/en` directory.

- `./content/en/spec` contains the generated OCM Specification documentation
- `./content/en/docs/cli-reference` contains the generated CLI documentation
- `./content/en/docs/demos` contains the available OCM related demos
- `./content/en/docs/guides` contains articles describing OCM use-cases
- `./content/en/docs/component-descriptors` contains links to OCM JSON schemas in the `ocm` github repository
- `./content/en/project` contains information about the OCM project & the parties responsible
- `./content/en/controller-reference` contains information about all OCM K8s controllers

New pages can be created using the following command:

```bash
npm run create <location>
```

This will create a page in draft mode. To make the page visible (and let it appear in the side bar) change `draft` to `false` in the header section of the page:

```text
---
title: ...
draft: false
```

For content generated from external sources (currently only valid for the OCM CLI), a GitHub Action will checkout the latest version of the remote repository, generate the documentation and create a PR against `main`. This can be be triggered as necessary using a manual dispatch:

```bash
gh workflow run
```

Alternatively, you can trigger the workflow via the menu "Actions -> Update OCM CLI Docs".

## Running the site locally

The following tools should be installed prior to running the site locally:

- [Node.js](https://docs.npmjs.com/getting-started)
- [Hugo](https://gohugo.io/)

With the tooling in place you can install the node dependencies:

```bash
npm install
```

Then run the site:

```bash
npm run dev
```

Navigate to `http://localhost:1313` to see the site running in your browser. Any updates you make to the site will be reflected in the browser immediately.

## Publishing the site

The Open Component Model website is published using GitHub Pages. A GitHub Actions workflow will run whenever there is a commit to the `main` branch. The workflow publishes the compiled assets to the `gh-pages` branch from which GitHub Pages will serve.

## Contributing

Code contributions, feature requests, bug reports, and help requests are very welcome.

OCM follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

### Guideline for AI-generated code contributions to SAP Open Source Software Projects

As artificial intelligence evolves, AI-generated code is becoming valuable for many software projects, including open-source initiatives. While we recognize the potential benefits of incorporating AI-generated content into our open-source projects there a certain requirements that need to be reflected and adhered to when making contributions.

When using AI-generated code contributions in OSS Projects, their usage needs to align with Open-Source Software values and legal requirements. We have established these essential guidelines to help contributors navigate the complexities of using AI tools while maintaining compliance with open-source licenses and the broader Open-Source Definition.

AI-generated code or content can be contributed to SAP Open Source Software projects if the following conditions are met:

1. **Compliance with AI Tool Terms and Conditions:** Contributors must ensure that the AI tool's terms and conditions do not impose any restrictions on the tool's output that conflict with the project's open-source license or intellectual property policies. This includes ensuring that the AI-generated content adheres to the Open Source Definition.

2. **Filtering Similar Suggestions:** Contributors must use features provided by AI tools to suppress responses that are similar to third-party materials or flag similarities. We only accept contributions from AI tools with such filtering options. If the AI tool flags any similarities, contributors must review and ensure compliance with the licensing terms of such materials before including them in the project.

3. **Management of Third-Party Materials:** If the AI tool's output includes pre-existing copyrighted materials, including open-source code authored or owned by third parties, contributors must verify that they have the necessary permissions from the original owners. This typically involves ensuring that there is an open-source license or public domain declaration that is compatible with the project's licensing policies. Contributors must also provide appropriate notice and attribution for these third-party materials, along with relevant information about the applicable license terms.

4. **Employer Policies Compliance:** If AI-generated content is contributed in the context of employment, contributors must also adhere to their employer’s policies. This ensures that all contributions are made with proper authorization and respect for relevant corporate guidelines.

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and Open Component Model contributors.
Please see our [LICENSE](LICENSE) for copyright and license information.
Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/open-component-model/ocm-website).
