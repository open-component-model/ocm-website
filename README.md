# OCM Website Documentation

This project houses the OCM **website**.

## Adding Content

Content lives under the `content/<lang>` directory.

To add a new page use the following command:

```bash
npm run create <location>
```

## Updating the OCM CLI documentation

A GitHub Actions workflow has been created to generate documentation for the OCM CLI. The workflow will checkout the latest version of the `gardener/ocm` repository, generate the documentation and create a PR against `main`.

This can be be triggered as necessary using a manual dispatch. The most straightforward way is using the `gh` CLI:

`gh workflow run`

Alternatively, you can trigger the workflow via the menu "Actions -> Update OCM CLI Docs".
