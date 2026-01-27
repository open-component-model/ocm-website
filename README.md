# ocm.software

[![REUSE status](https://api.reuse.software/badge/github.com/open-component-model/ocm-website)](https://api.reuse.software/info/github.com/open-component-model/ocm-website)
[![publish site status](https://github.com/open-component-model/ocm-website/actions/workflows/publish-site.yaml/badge.svg)](https://github.com/open-component-model/ocm-website/actions/workflows/publish-site.yaml)

This repository houses the assets used to build the [Open Component Model website](https://ocm.software).

The sources for some of the documentation are maintained in other repositories within the Open Component Model GitHub Organization. Documentation issues and pull requests should be made against those repositories:

| Project           | GitHub Source                                      |
| ----------------- | -------------------------------------------------- |
| OCM CLI           | <https://github.com/open-component-model/ocm>      |
| OCM Specification | <https://github.com/open-component-model/ocm-spec> |

## Content Structure

Content lives under the `content` directory.

| Directory | Content                                      |
| ----------------- | -------------------------------------------------- |
| `content/docs/concepts` | Concept explanations |
| `content/docs/getting-started` | Getting Started guides |
| `content/docs/overview` | Overview and introductory information about the OCM project |
| `content/docs/reference` | Generated CLI documentation |
| `content/docs/tutorials` | Tutorials about specific use cases |
| `content/community` | Information about community engagement |
| `content/_index.md` | Landing page content |

## Running the OCM Website Locally

Install the following tools:

- [Node.js](https://docs.npmjs.com/getting-started)
- [Hugo](https://gohugo.io/)

Install dependencies:

```sh
 npm ci
 ```

Start the website:

```sh
npm run dev
```
The website will be available at <http://localhost:1313>.

## Contributing

Contributions of documentation and code, feature requests, bug reports, and help requests are very welcome.

Before contributing, please check out the following pages:

- [How to Create and Test Content for the OCM Website](https://github.com/open-component-model/ocm-website/blob/main/.github/docs/how-to-create-new-docs.md)
- [How to Create and Update Website Versions](https://github.com/open-component-model/ocm-website/blob/main/.github/docs/how-to-version-content-on-our-website.md)
- [Templates](https://github.com/open-component-model/ocm-website/tree/main/.github/docs/templates)

OCM follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

## Licensing

Copyright 2025 SAP SE or an SAP affiliate company and Open Component Model contributors.
Please see our [LICENSE](LICENSE) for copyright and license information.
Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/open-component-model/ocm-website).
