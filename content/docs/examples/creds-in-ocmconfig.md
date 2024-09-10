---
title: "Credentials in ocmconfig file"
description: ""
summary: ""
date: 2024-09-04T13:54:01+02:00
lastmod: 2024-09-04T13:54:01+02:00
draft: false
weight: 999
toc: true
---

## Overview

The [OCM command line client](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm.md) can be configured by supplying it with a [configuration file](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_configfile.md). By default, the CLI looks for configuration in `$HOME/.ocmconfig`, if it exists.

The configuration file can be used in particular to specify the credentials, which are required for the CLI to be able to access the artifact repositories, referenced in CLI commands.

## Examples

This page contains basic examples of credentials configuration for a few most common artifact repository types. The examples below are complete `.ocmconfig` files, not snippets.

For comprehensive documentation on the credentials topic, including usage of certificates or HashiCorp Vault, execute the command `ocm credential-handling`.

### Repositories and Consumers

In the examples below some configuration is located under `configurations[0]`.`repositories`, and some other under `configurations[0]`.`consumers`. This chanpter explains the difference between `repositories` and `consumers`, which is potentially not as obvious as one could think.

In this context, `repository` is a place, where credentials can be stored, i.e. it is a credentials repository. For example, Docker's `config.json` can store multiple credentials, and in that sense the file serves as a repository that can store and provide credentials. That is why its location is configured under `repositories`. Other examples of credentials repositories can be the NPM's `.npmrc` file or a HashiCorp Vault instance.

A `consumer` is something the credentials are required for. For example, if you need to configure credentials that are required to log in to an OCI registry, one could say that the registry will be consuming these credentials, i.e. the registry is a credentials consumer. That is why it is configured under `consumers`.

### Re-use credentials configured for Docker

This `.ocmconfig` file will tell OCM CLI to use configuration from Docker's `config.json`.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
          propagateConsumerIdentity: true
```

### Accessing OCI registries

#### HTTPS and path

To access artifacts in `https://ghcr.io/open-component-model`:
* Omit the protocol
* The path behind the top-level domain hast to be specified in a separate `pathprefix` field
* The `password` is the user's basic authentication password. Some OCI registries allow to generate user access tokens, which can also be used for basic authentication.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: OCIRegistry
          hostname: ghcr.io
          pathprefix: open-component-model
        credentials:
          - type: Credentials
            properties:
              username: some-user
              password: some-token
```

#### HTTP, port number, empty path

To access artifacts in `http://127.0.0.1:5001`:
* Omit the protocol
* Omit the port number
* As the URL has no path behind the port number, `pathprefix` element can be removed or left empty

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: OCIRegistry
          hostname: 127.0.0.1
        credentials:
          - type: Credentials
            properties:
              username: admin
              password: admin
```

### Accessing Helm chart repositories

Similar to OCI registries, but use `HelmChartRepository` as identity type.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: HelmChartRepository
          hostname: ghcr.io
          pathprefix: open-component-model
        credentials:
          - type: Credentials
            properties:
              username: some-user
              password: some-token
```

### Accessing GitHub repositories

To access code in `https://my.github.enterprise/my-org/my-repo`:
* Use `Github` as identity type
* `hostname` is the domain name of the GitHub instance
* `pathname` is a combination of organization and repository names
* `token` is a personal access token generated in GitHub Developer Settings

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: Github
          hostname: my.github.enterprise
          pathprefix: my-org/my-repo
        credentials:
          - type: Credentials
            properties:
              token: ghp_my_personal_access_token
```

### Accessing several systems

It is, of course, possible to configure credentials for several systems in the same `.ocmconfig` file. To do that, you can combine as many repositories and consumers as you need.

The example below instructs OCM CLI to look for credentials in Docker's `config.json`, and in addition specifies dedicated credentials for an OCI registry and a GitHub repository.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
          propagateConsumerIdentity: true
    consumers:
      - identity:
          type: OCIRegistry
          hostname: ghcr.io
          pathprefix: open-component-model
        credentials:
          - type: Credentials
            properties:
              username: some-user
              password: some-token
      - identity:
          type: Github
          hostname: my.github.enterprise
          pathprefix: my-org/my-repo
        credentials:
          - type: Credentials
            properties:
              token: ghp_my_personal_access_token
```
