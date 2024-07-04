---
title: "Prerequisites"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 23
toc: true
---

This and the following chapters walk you through some basic steps to get started with OCM concepts and the OCM CLI.
You will learn how to create a component version, display and examine the component, and how to transport and sign it.

To follow the steps described in this section, you will need to:

## Install the OCM Command Line Interface (CLI)

The CLI is used to interact with component versions and registries. Install it like described in [Installing the OCM CLI](https://github.com/open-component-model/ocm-website/blob/main/content/docs/getting-started/installation.md).

## Obtain Access to an OCM Repository

This can be any OCI registry for which you have write permission (e.g., GitHub Packages). An OCM repository based on an OCI registry is identified by a leading OCI repository prefix. For example: `ghcr.io/<YOUR-ORG>/ocm`.

## Obtain Credentials for the CLI to Access the OCM Repository

### Using the Docker Configuration File

The easiest way to do this is to reuse your Docker configuration `json` file.

  To do this, create a file named `.ocmconfig` in your home directory with the following content:

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

More information on the topic can be seen by running the OCM CLI help topic command `ocm credential-handling`.

## Next Steps

After completing your setup of OCM, the next steps to follow are:

1. [Create a Component Version](./create-component-version.md)
2. [Display and Examine Component Versions](./display-examine-component-versions.md)
3. [Transport OCM Component Versions](./transport-component-versions.md)
4. [Sign Component Versions](./sign-component-versions.md)