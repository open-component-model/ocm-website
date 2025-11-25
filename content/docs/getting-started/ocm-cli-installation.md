---
title: "Install the OCM CLI"
url: "/docs/getting-started/installation/"
description: "Learn how to install the OCM CLI on various platforms."
icon: "💻"
weight: 22
toc: true
---


The new major version of the OCM CLI is currently under active development. While we're working on providing pre-built releases through various package managers and distribution channels, the only way to install the OCM CLI right now is to **build it from source**.

This guide will walk you through building the OCM CLI from the source code and configuring the necessary credentials.

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

## Configure the OCM Command Line Client

Credentials to be used by the OCM CLI can be configured by supplying it with a [configuration file]({{< relref "creds-in-ocmconfig.md" >}}). By default, the CLI looks for the file in `$HOME/.ocmconfig`.

### Using the Docker Configuration File

The easiest way to configure credentials for the OCM CLI is to reuse an existing Docker configuration `json` file.

Create a file named `.ocmconfig` in your home directory with the following content:

```yaml
type: generic.config.ocm.software/v1
configurations:
- type: credentials.config.ocm.software
  repositories:
    - repository:
        type: DockerConfig/v1
        # The path to the Docker configuration file
        dockerConfigFile: "~/.docker/config.json"
        propagateConsumerIdentity: true
- type: attributes.config.ocm.software
  attributes:
    cache: ~/.ocm/cache
```

### Using Basic Authentication

Alternatively, you can use basic authentication. Create a file named `.ocmconfig` with the following content in your home directory:

```yaml
type: generic.config.ocm.software/v1
configurations:
- type: credentials.config.ocm.software
    consumers:
      - identity:
          type: ociRegistry
          hostname: <YOUR-REGISTRY>/<YOUR-REPO> # e.g. ghcr.io/acme/acme
        credentials:
          - type: Credentials
            properties:
              username: <YOUR-USERNAME>
              password: <YOUR-PASSWORD>
```

More information on how to deal with credentials can be found [in this guide]({{< relref "creds-in-ocmconfig.md" >}}) with many examples for different repository types.

## What's Next?

Now that you have the OCM CLI installed and configured, you can start exploring its capabilities. Check out our [Getting Started Guides]({{< relref "docs/getting-started/_index.md" >}}) to learn how to use the OCM CLI to work with your component.

## Future Installation Methods

We're actively working on providing more convenient installation methods, including:

- Homebrew packages
- Docker images
- Pre-built binaries for GitHub Releases
- and more

Stay tuned for updates as we continue to improve the installation experience!
