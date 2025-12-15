---
title: "Install the OCM CLI"
url: "/docs/getting-started/installation/"
description: "Learn how to install the OCM CLI on various platforms."
icon: "💻"
weight: 22
toc: true
---

This guide walks you through installing the OCM CLI and configuring the necessary credentials.

## Install the OCM CLI

You can install the latest release of the OCM CLI from any of the following sources.

### Bash

To install with `bash` for macOS or Linux, execute the following command:

```sh
curl -s https://ocm.software/install.sh | sudo bash
```

### Using Homebrew

```sh
# Homebrew (macOS and Linux)
brew install open-component-model/tap/ocm
```

For more information, refer to the [OCM CLI package on Homebrew](https://formulae.brew.sh/formula/ocm#default) and the [Homebrew documentation](https://brew.sh).

### Using Nix (with Flakes)

```sh
# Nix (macOS, Linux, and Windows)
# Ad hoc cmd execution
nix run github:open-component-model/ocm -- --help
nix run github:open-component-model/ocm#helminstaller -- --help

# Install development version
nix profile install github:open-component-model/ocm
# Or release <version>
nix profile install github:open-component-model/ocm/<version>

# Check installation
nix profile list | grep ocm

# Optionally, open a new shell and verify that cmd completion works
ocm --help
```

For more information, refer to the Nix documentation: [Nix flakes](https://nixos.wiki/wiki/Flakes).

### From AUR (Arch Linux User Repository)

```shell
# If not using a helper util
git clone https://aur.archlinux.org/ocm-cli.git
cd ocm-cli
makepkg -i
```
For more information, refer to the [OCM CLI package on AUR](https://aur.archlinux.org/packages/ocm-cli) and the [AUR Documentation](https://wiki.archlinux.org/title/Arch_User_Repository).

### Using Docker / Podman

```sh
podman run -t ghcr.io/open-component-model/ocm:latest --help
```

For more information, refer to the [Podman documentation](https://podman.io/).

#### Build and Run It Yourself

```sh
podman build -t ocm .
podman run --rm -t ocm --loglevel debug --help
```

or interactively:

```sh
podman run --rm -it ocm /bin/sh
```

You can pass in the following arguments to override the predefined defaults:

- `GO_VERSION`: The **golang** version to be used for compiling.
- `ALPINE_VERSION`: The **alpine** version to be used as the base image.
- `GO_PROXY`: Your **go** proxy to be used for fetching dependencies.

Please check [hub.docker.com](https://hub.docker.com/_/golang/tags?page=1&name=alpine) for possible version combinations.

```sh
podman build -t ocm --build-arg GO_VERSION=1.22 --build-arg ALPINE_VERSION=3.19 --build-arg GO_PROXY=https://proxy.golang.org .
```

### On MS Windows

#### Using Chocolatey

```powershell
choco install ocm-cli
```

For more information, refer to the [OCM CLI package on Chocolatey](https://community.chocolatey.org/packages/ocm-cli) and the [Chocolatey documentation](https://chocolatey.org/).

#### Using winget

_Deprecated_: Please note, winget packages are no longer provided. Any existing packages are still working, but no new
packages are built and published to winget repository.

### Build It From Source

#### Prerequisites

You need the following tools installed:

- [Git](https://www.git-scm.com/)
- [Golang](https://go.dev/)
- make

#### Installation Process

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

## Configure the OCM Command Line Client

Credentials to be used by the OCM CLI can be configured by supplying it with a [configuration file]({{< relref "docs/tutorials/creds-in-ocmconfig" >}}). By default, the CLI looks for the file in `$HOME/.ocmconfig`.

### Prerequisites

- Obtain access to an OCM repository. This can be any OCI registry for which you have write permission (e.g., GitHub Packages). An OCM repository based on an OCI registry is identified by a leading OCI repository prefix. For example: `ghcr.io/<YOUR-ORG>/ocm`.

### Using the Docker Configuration File

The easiest way to do this is to reuse your Docker configuration `json` file.

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

Alternatively, you can use basic authentication. Create a file named `.ocmconfig` in your home directory with the following content:

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

More information on the credentials topic can be found by running the OCM CLI help topic command `ocm credential-handling`
and in the guide [Credentials in an .ocmconfig File]({{< relref "docs/tutorials/creds-in-ocmconfig" >}}), which contains many examples for different repository types.
