---
title: "Install the OCM CLI"
description: "Learn how to install the OCM CLI on various platforms."
icon: "💻"
weight: 21
toc: true
---

The OCM CLI is the primary tool for creating, managing, and transferring component versions.
This guide covers installation options for different platforms.

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

Build the OCM CLI from the `open-component-model/open-component-model` monorepo.

### Clone and build

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

## CLI Reference

For detailed command documentation, see the [OCM CLI Reference]({{< relref "/docs/reference/ocm-cli/_index.md" >}}).

## Next Steps

- Learn how to [create and store component versions]({{< relref "create-component-version.md" >}}).
