---
title: "Installing the OCM CLI"
description: ""
lead: ""
date: 2022-08-12T10:37:58+01:00
lastmod: 2022-08-12T10:37:58+01:00
draft: false
images: []
weight: 21
toc: true
---

## Using Binaries

To install the OCM CLI, you can download binaries for the major platforms from the GitHub [releases page](https://github.com/open-component-model/ocm/releases).

## Homebrew

You can also install via [homebrew](https://brew.sh/) for macOS and Linux:

`brew install open-component-model/tap/ocm`

## Bash

To install with `bash` for macOS or Linux execute the following command:

`curl -s https://ocm.software/install.sh | sudo bash`

## Building from Source

### Prerequisites

- [git](https://www.git-scm.com/)
- [golang](https://go.dev/)
- make

### Installation Process

Clone the `open-component-model/ocm` repo:

```bash
git clone https://github.com/open-component-model/ocm
```

Enter the repository directory (`cd ocm/`) and install the cli using `make`:

```bash
make install
```

> Please note that the OCM CLI is installed in your `go/bin` directory, so you might need to add this directory to your `PATH`.

Verify the installation:

```bash
ocm version
```
