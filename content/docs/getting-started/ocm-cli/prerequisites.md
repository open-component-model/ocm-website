---
title: "Prerequisites"
url: /docs/getting-started/prerequisites/
description: "What you need to get started with OCM"
icon: "⚠️"
weight: 21
toc: true
---

This and the following chapters walk you through some basic steps to get started with OCM concepts and the OCM CLI.

You will learn how to create a component version, display and examine the component, and download resources.

We will update the getting started guides with more actions, like signing, transfer and verification of components during the ongoing development of our new major release.

To follow the steps described in this section, you will need to:

## Install the OCM Command Line Interface (CLI)

The CLI is used to interact with component versions and registries. Install it like described in [Installing the OCM CLI](/docs/getting-started/installation/).

## Obtain Access to an OCM Repository

This can be any OCI registry for which you have write permission (e.g., GitHub Packages). An OCM repository based on an OCI registry is identified by a leading OCI repository prefix. For example: `ghcr.io/<YOUR-ORG>/ocm`.

## Configure Credentials for the CLI to Access the OCM Repository

Credentials to be used by the OCM CLI can be configured by supplying it with a [configuration file](/docs/tutorials/creds-in-ocmconfig). By default, the CLI looks for the file in `$HOME/.ocmconfig`.

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

More information on how to deal with credentials can be found [in this guide](/docs/tutorials/creds-in-ocmconfig/) with many examples for different repository types.
