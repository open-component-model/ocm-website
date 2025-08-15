---
title: "Installing the OCM CLI"
url: "/docs/getting-started/installation/"
description: "Learn how to install the OCM CLI on various platforms."
icon: "💻"
weight: 22
toc: true
---


The new major version of the OCM CLI is currently under active development. While we're working on providing pre-built releases through various package managers and distribution channels, the only  way to install the OCM CLI right now is to **build it from source**.

This guide will walk you through the process of building and installing the OCM CLI from the source code.

## Prerequisites

Before you begin, make sure you have the following tools installed on your system:

- [Git](https://git-scm.com/) for cloning the repository
- [Go](https://golang.org/) (version 1.24 or later)
- [Task](https://taskfile.dev/) build tool

## Build from Source

### Step 1: Clone the Repository

First, clone the OCM repository from GitHub:

```bash
git clone https://github.com/open-component-model/open-component-model
```

### Step 2: Navigate to the CLI Directory

Change into the CLI directory:

```bash
cd open-component-model/cli
```

### Step 3: Build the CLI

Use the `Task` build tool to compile the OCM CLI:

```bash
task build
```

After the build completes successfully, you should see output similar to:

```bash
task: [build] ln -sf /path/to/your/open-component-model/cli/tmp/bin/ocm-<os>-<arch> /path/to/your/open-component-model/cli/tmp/bin/ocm
```

The exact path will vary depending on your system and where you cloned the repository.

## Using the OCM CLI

Once the build is complete, you have three options for using the OCM CLI:

### Option 1: Create a Permanent Alias

Add an alias to your shell configuration file for permanent access:

**For Zsh users (~/.zshrc):**

```bash
echo 'alias ocm="/path/to/your/open-component-model/cli/tmp/bin/ocm"' >> ~/.zshrc
source ~/.zshrc
```

**For Bash users (~/.bashrc):**

```bash
echo 'alias ocm="/path/to/your/open-component-model/cli/tmp/bin/ocm"' >> ~/.bashrc
source ~/.bashrc
```

Replace `/path/to/your/` with the actual path where you cloned the repository.

### Option 2: Create a Session Alias

For temporary use in your current terminal session:

```bash
alias ocm="/path/to/your/open-component-model/cli/tmp/bin/ocm"
```

### Option 3: Use the Full Path

You can also run the OCM CLI directly using the full path:

```bash
/path/to/your/open-component-model/cli/tmp/bin/ocm
```

## Verify Installation

To verify that the OCM CLI is working correctly, run:

```bash
ocm version
```

This should display the version information and confirm that the installation was successful.

## What's Next?

Now that you have the OCM CLI installed, you can start exploring its capabilities. Check out our [Getting Started Guides](/docs/getting-started/ocm-cli/) to learn how to use the OCM CLI to work with your component.

## Future Installation Methods

We're actively working on providing more convenient installation methods, including:

- Homebrew packages
- Docker images
- Pre-built binaries for GitHub Releases
- and more

Stay tuned for updates as we continue to improve the installation experience!
