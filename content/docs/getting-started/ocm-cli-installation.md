---
title: "Install the OCM CLI"
description: "Learn how to install the OCM CLI on various platforms."
icon: "💻"
weight: 21
toc: true
---

The OCM CLI is the primary tool for creating, managing, and transferring component versions.
This guide covers installation options for different platforms.

## You'll end up with

- The OCM CLI installed and ready to use on your system
- The ability to run `ocm` commands from your terminal

## Estimated time

~5 minutes

## Prerequisites

- Build from Source method requires:
  - [Git](https://git-scm.com/)
  - [Go](https://go.dev/) (1.25+)

## Install the OCM CLI

{{< callout context="caution" title="Installation Methods" icon="outline/alert-triangle" >}}
The new OCM CLI currently only supports **Build from Source** installation. Pre-built binaries, Homebrew packages,
and installation scripts will be available with the first official release in Q2 2026.
{{< /callout >}}

{{< tabs "installation-methods" >}}

{{< tab "Build from Source" >}}

### Clone and build

Build the OCM CLI from the `open-component-model/open-component-model` monorepo.

```shell
git clone https://github.com/open-component-model/open-component-model.git
cd open-component-model
make install
```

The CLI is installed to your `$GOPATH/bin` directory. Ensure this is in your `PATH`:

```shell
export PATH="$PATH:$(go env GOPATH)/bin"
```
{{< /tab >}}
{{< /tabs >}}

## Verify Installation

After installing, verify the CLI is working:

```shell
ocm version
```

Expected output (example from dev version):

```text
{"major":"0","minor":"0","patch":"0","prerelease":"20260215172822-039e8853d19e",
"gitVersion":"0.0.0-20260215172822-039e8853d19e","gitCommit":"039e8853d19e","buildDate":"20260215172822",
"goVersion":"go1.25.6","compiler":"gc","platform":"darwin/arm64"}
```

## Windows Support

{{< callout context="caution" title="Caution" icon="outline/alert-triangle" >}}
Windows support for the OCM CLI is currently **best-effort** and not guaranteed.
{{< /callout >}}

While the CLI is designed to handle Windows-specific conventions such as drive-letter paths
(e.g., `C:\path\to\archive`) and backslash path separators, there is no dedicated Windows CI
infrastructure in place to continuously validate these code paths.

### What this means

- Windows builds are cross-compiled and checked for compilation correctness.
- Windows-specific logic (such as path detection and normalization) might tested via simulated
  OS behavior on non-Windows runners.
- There is no runtime testing on actual Windows environments in CI.
- Bugs specific to Windows runtime behavior may go undetected until reported.

### Reporting issues

If you encounter a Windows-specific issue, please report it at
[github.com/open-component-model/open-component-model/issues](https://github.com/open-component-model/open-component-model/issues).

## CLI Reference

For detailed command documentation, see the [OCM CLI Reference]({{< relref "/docs/reference/ocm-cli/_index.md" >}}).

## Next Steps

- Learn how to [create and store component versions]({{< relref "create-component-version.md" >}}).
