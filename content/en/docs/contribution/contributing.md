---
title: "Contributing"
description: ""
lead: ""
date: 2022-08-12T10:38:22+01:00
lastmod: 2022-08-12T10:38:22+01:00
draft: false
images: []
weight: 121
toc: true
---

Welcome to the OCM community!

Thank you for taking the time to contribute to OCM.

## DCO

By contributing to this project you agree to the Developer Certificate of Origin ([DCO](DCO)). This document was created by the Linux Kernel community and is a simple statement that you, as a contributor, have the legal right to make the contribution.

We require all commits to be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits). By signing off with your signature, you certify that you wrote the patch or otherwise have the right to contribute the material by the rules of the [DCO](DCO):

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

For more involved feature or enhancement requests, please see the section on how to submit an [ADR](#adrs).

You may find it helpful to start a new thread in the [`ocm` Discussion Board](https://github.com/open-component-model/ocm/discussions) for questions, help requests, feature requests, or any other type of discussion about OCM. A maintaine will reach out to you as soon as possible.

### Find an Issue

Take a look at the [OCM issues](https://github.com/open-component-model/ocm/issues) to find out more about what is currently in the works and what is planned.
If you find something that you are interested in picking up, please leave a comment and wait for a maintainer to give you the green light to claim it and start working on it.

If you would like to contribute but are unsure about where to start, feel free to let the maintainers know through the [`ocm` Discussion Board](https://github.com/open-component-model/ocm/discussions) and someone will reach out to you.

## Local Development

Each project has its own setup for local development.

## Submitting Pull Requests

Ready to contribute? Read and follow the sections below to get your contribution to the finish line.

### Pull Request Checklist

- Fork the repository, push your changes to a branch on your fork, then open a PR from that branch to the source repository's `main` branch.
- Add as much information as possible in your PR description about what changed, why, as well as steps to test these changes.
- [Sign your commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).
- Ensure that the branch is up to date with `main`.
- Write a neat title that is ready to be added to future release notes.
- Update documentation (either in the [docs](https://github.com/open-component-model/ocm-spec) or README) that cover your changes.
- Add unit tests and integration tests to cover your changes.
- Ensure that the linter and all unit and integration tests are successful.
- [Bonus] Backfill tests/documentation to make the world a better place.

### Pull Request Process
1. **Create PR.** Please refer to the [Pull Request Checklist](#pull-request-checklist) before marking a PR as ready to be reviewed.
2. **Triage.** A maintainer will triage the Pull Request by adding the appropriate label for the issue.
3. **Assign reviews.** A maintainer will be assigned to review the changes in the Pull Request.
4. **Review/Discussion.** One or more maintainer will review the Pull Request. Checkout the [style guidelines](#styyle-guidelines) section for some things reviewers will look for.
5. **Address comments by answering questions or changing code.**
6. **Approve/Merge.** A review should be approved by at least two other maintainers. If the PR was opened by a community contributor, they should wait for a maintainer to merge the Pull Request.

### Style Guidelines

For Go standards, it is recommended to take a look at the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) and the _Formatting and style_ section of Peter Bourgon's Go: Best Practices for Production Environments.--
