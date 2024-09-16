---
title: "Contributing Guideline"
description: "Contributing Guideline"
lead: ""
draft: false
images: []
weight: 101
toc: true
---

Welcome to the OCM community!

Thank you for taking the time to contribute to OCM.

- [DCO](#dco)
- [Support Channels](#support-channels)
- [Ways to Contribute](#ways-to-contribute)
  - [Find an Issue](#find-an-issue)
- [Local Development](#local-development)
- [Submitting Pull Requests](#submitting-pull-requests)
  - [Licensing and Copyright information on file level](#licensing-and-copyright-information-on-file-level)
  - [Pull Request Checklist](#pull-request-checklist)
  - [Pull Request Process](#pull-request-process)
  - [Style Guidelines](#style-guidelines)
- [Release Process](#release-process)
- [Guideline for AI-generated code contributions to SAP Open Source Software Projects](#guideline-for-ai-generated-code-contributions-to-sap-open-source-software-projects)

## DCO

By contributing to this project you agree to the Developer Certificate of Origin ([DCO](https://raw.githubusercontent.com/open-component-model/.github/main/DCO)). This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution.

We require all commits to be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits). By signing off with your signature, you certify that you wrote the patch or otherwise have the right to contribute the material by the rules of the [DCO](https://raw.githubusercontent.com/open-component-model/.github/main/DCO):

`Signed-off-by: Jane Doe <jane.doe@example.com>`

If your `user.name` and `user.email` are configured in your Git config, you can sign your commit automatically with `git commit -s`.

## Support Channels

Before opening a new issue or submitting a Pull Request, make sure to search through the [docs](https://github.com/open-component-model/ocm-spec), open and closed issues, open and merged Pull Requests, and the [Discussions](https://github.com/open-component-model/ocm/discussions) board to check whether your question has been raised or answered already.

Please open an issue in any of the repositories in the `open-component-model` organisation if you wish to [request a new feature](https://github.com/open-component-model/ocm/issues/new?assignees=&labels=kind%2Fenhancement&template=enhancement_request.md) or [report a bug](https://github.com/open-component-model/ocm/issues/new?assignees=&labels=kind%2Fbug&template=bug_report.md).

If you wish to propose or discuss a more involved feature or change to any of the OCM projects, you could start a new thread in the [`ocm` Discussion Board](https://github.com/open-component-model/ocm/discussions). For example, this could be helpful if you wish to vet an idea before writing a feature request. It is a space to discuss in public with maintainers, contributors, users, and other interested parties. After reaching some form of consensus, the proposed changes can go through the [pull request process](#submitting-pull-requests) where implementation details are reviewed, approved, or rejected by maintainers.

## Ways to Contribute

We welcome all types of contributions, including:

- New features
- Bug reports/fixes
- Reviewing/updating documentation
- Refactoring
- Backfilling tests
- Joining discussions
- Web design
- Release management
- Reviews
- [Board discussions](https://github.com/open-component-model/ocm/discussions)

You may find it helpful to start a new thread in the [`ocm` Discussion Board](https://github.com/open-component-model/ocm/discussions) for questions, help requests, feature requests, or any other type of discussion about OCM. A maintainer will reach out to you as soon as possible.

### Find an Issue

Take a look at the [OCM issues](https://github.com/open-component-model/ocm/issues) to find out more about what is currently in the works and what is planned.
If you find something that you are interested in picking up, please leave a comment and wait for a maintainer to give you the green light to claim it and start working on it.

If you would like to contribute but are unsure about where to start, feel free to let the maintainers know through the [`ocm` Discussion Board](https://github.com/open-component-model/ocm/discussions) and someone will reach out to you.

## Local Development

Each project has its own setup for local development.

## Submitting Pull Requests

Ready to contribute? Read and follow the sections below to get your contribution to the finish line.

### Licensing and Copyright information on file level

In general all files of the project are created under Apache 2.0 license. The project uses the [REUSE process and tooling](https://reuse.software) that supports maintaining licensing information centrally in a `.reuse/dep5 config` file on repository level. This means that in general there SHOULD NOT be any license and copyright specifiy SPDX headers on file level. Only in cases where content is copied from sources that use a different license and already use headers like

```
// SPDX-FileCopyrightText: Copyright 2010 The Go Authors. All rights reserved.
//
// SPDX-License-Identifier: BSD-3-Clause
```

the headers of the source file should be kept and eventually aggregated with the Apache 2.0 license. Please check the [REUSE FAQ](https://reuse.software/faq/#multi-licensing) for details.

Such files should be explicitly added as deviating from the `.reuse/dep5` config file using the `Files-Excluded` field. Excluding the file `/pkg/foo.go` and `pkg/bar.go` from the general rule to add the Apache 2.0 license to all files, would look like this:

```bash
Files: **
Copyright: 2022 SAP SE or an SAP affiliate company and Open Component Model contributors
License: Apache-2.0
Files-Excluded: /pkg/foo.go pkg/bar.go 
```

### Pull Request Checklist

- Fork the repository, push your changes to a branch on your fork, then open a PR from that branch to the source repository's `main` branch.
- Add as much information as possible in your PR description about what changed, why, as well as steps to test these changes.
- [Sign your commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).
- Ensure that the branch is up to date with `main`.
- Write a neat title that is ready to be added to future release notes.
- Update documentation (either in the [docs](https://github.com/open-component-model/ocm-spec) or README) that cover your changes.
- Add unit tests and integration tests to cover your changes.
- Ensure that the linter and all unit and integration tests are successful.
- **Bonus:** Backfill tests/documentation to make the world a better place.

### Pull Request Process

1. **Create PR.** Please refer to the [Pull Request Checklist](#pull-request-checklist) before marking a PR as ready to be reviewed.
2. **Triage.** A maintainer will triage the Pull Request by adding the appropriate label for the issue.
3. **Assign reviews.** A maintainer will be assigned to review the changes in the Pull Request.
4. **Review/Discussion.** One or more maintainer will review the Pull Request. Checkout the [style guidelines](#style-guidelines) section for some things reviewers will look for.
5. **Address comments by answering questions or changing code.**
6. **Approve/Merge.** A review should be approved by at least two other maintainers. If the PR was opened by a community contributor, they should wait for a maintainer to merge the Pull Request.

### Style Guidelines

For Go standards, it is recommended to take a look at the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) and the _Formatting and style_ section of Peter Bourgon's Go: Best Practices for Production Environments.

## Release Process

Follow these steps to do a release:

1. Create a PR with the following:
   1. **Update the version.** For example, in the `ocm` repository, this is located in `pkg/version/release.go`.
   2. **Add the release notes.** Use the draft release notes generated by the release-drafter GitHub Action that can be found in `github.com/open-component-model/<repository>/releases`. Add these to the repository's `docs/releasenotes/v0.x.0.md` for a given **minor** version. For example, for `v0.2.0` (or a release candidate for this version), create `docs/releasenotes/v0.2.0.md`.
2. Request reviews for the PR & merge it once it is approved.
3. Navigate to the `Release` GitHub Action. Tick the box if this is a Release Candidate, otherwise leave it blank, and click to start the action. This will run the tests and linter, check that the release notes are present for this version, create a branch and a tag, and finally trigger the release using goreleaser.

## Guideline for AI-generated code contributions to SAP Open Source Software Projects

As artificial intelligence evolves, AI-generated code is becoming valuable for many software projects, including open-source initiatives. While we recognize the potential benefits of incorporating AI-generated content into our open-source projects there a certain requirements that need to be reflected and adhered to when making contributions.

When using AI-generated code contributions in OSS Projects, their usage needs to align with Open-Source Software values and legal requirements. We have established these essential guidelines to help contributors navigate the complexities of using AI tools while maintaining compliance with open-source licenses and the broader Open-Source Definition.

AI-generated code or content can be contributed to SAP Open Source Software projects if the following conditions are met:

1. **Compliance with AI Tool Terms and Conditions:** Contributors must ensure that the AI tool's terms and conditions do not impose any restrictions on the tool's output that conflict with the project's open-source license or intellectual property policies. This includes ensuring that the AI-generated content adheres to the Open Source Definition.

2. **Filtering Similar Suggestions:** Contributors must use features provided by AI tools to suppress responses that are similar to third-party materials or flag similarities. We only accept contributions from AI tools with such filtering options. If the AI tool flags any similarities, contributors must review and ensure compliance with the licensing terms of such materials before including them in the project.

3. **Management of Third-Party Materials:** If the AI tool's output includes pre-existing copyrighted materials, including open-source code authored or owned by third parties, contributors must verify that they have the necessary permissions from the original owners. This typically involves ensuring that there is an open-source license or public domain declaration that is compatible with the project's licensing policies. Contributors must also provide appropriate notice and attribution for these third-party materials, along with relevant information about the applicable license terms.

4. **Employer Policies Compliance:** If AI-generated content is contributed in the context of employment, contributors must also adhere to their employer’s policies. This ensures that all contributions are made with proper authorization and respect for relevant corporate guidelines.
