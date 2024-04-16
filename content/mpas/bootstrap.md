---
title: "Bootstrap"
description: ""
lead: ""
date: 2023-09-12T10:37:58+01:00
lastmod: 2023-09-12T10:37:58+01:00
draft: false
images: []
weight: 134
toc: true
---

The `mpas bootstrap` command deploys the following components to your cluster:

- [Flux](https://fluxcd.io/docs/components/): A Kubernetes operator that will
  install and manage the other components.
- [ocm-controller](https://github.com/open-component-model/ocm-controller): A Kubernetes controller
  that enables the automated deployment of software using the Open Component Model and `Flux`.
- [git-controller](https://github.com/open-component-model/git-controller): A
  Kubernetes controller that will create pull requests in the target Github repository
  when changes are made to the cluster.
- [replication-controller](https://github.com/open-component-model/git-controller): A Kubernetes controller that replicates
   everything defined and bundled in an OCM component version (and that the consumer subscribed to)
   into the local OCI registry of the cluster.
- [mpas-product-controller](https://github.com/open-component-model/mpas-product-controller): A Kubernetes controller responsible
   for creating the custom resource `Product`.
- [mpas-project-controller](https://github.com/open-component-model/mpas-project-controller): A Kubernetes controller responsible
  for bootstrapping a whole project and creating relevant access credentials, service accounts, roles and the main repository.
  It reconciles the `Project` resource.

Besides the above components, the `mpas bootstrap` command will also push the corresponding
component manifests to the target Git repository and configure `Flux` to continuously update
the installed components from the target Git repository.

After the `mpas bootstrap` command is executed, the cluster is ready to deploy software
in a GitOps fashion using the Open Component Model and `MPAS`.

{{<callout context="note" title="Cluster Admin Rights">}}To bootstrap `MPAS`, the person running the command must have **cluster admin rights** for the target Kubernetes cluster.
It is also required that the person running the command to be the **owner** of the GitHub repository,
or to have admin rights of a GitHub organization.{{</callout>}}

## Bootstrap for GitHub

### GitHub Personal Access Token (PAT)

For accessing the GitHub API, the boostrap command requires a GitHub personal access token (PAT)
with administration permissions.

The GitHub PAT can be exported as environment variable:

```bash
export GITHUB_TOKEN=<your-github-pat>
```

If the `GITHUB_TOKEN` environment variable is not set, the `mpas bootstrap` command will prompt
for the GitHub PAT.

{{<callout context="danger" title="Token in Secret">}}
Note that the GitHub PAT is stored in the cluster as a **Kubernetes Secret** named `flux-system`
inside the `flux-system` namespace.{{</callout>}}

### Personal account

Run the bootstrap for a repository on your personal GitHub account:

```bash
mpas bootstrap github \
  --owner=<your-github-username> \
  --repository=<your-github-repository> \
  --path=clusters/my-cluster \
  --dev \
  --personal
```

If the specified repository does not exist, the `mpas bootstrap` command will create it
as a private repository. If you wish to create a public repository, you can use the `--private=false`
flag.

### Organization

If you want to bootstrap `MPAS` for a repository owned by an GitHub organization,
it is recommended to create a dedicated GitHub user for `MPAS` and use that user to bootstrap
the repository.

Run the bootstrap for a repository owned by a GitHub organization:

```bash
mpas bootstrap github \
  --owner=<your-github-organization> \
  --repository=<your-github-repository> \
  --path=clusters/my-cluster \
  --dev
```

## Bootstrap for Gitea

### Gitea API token

For accessing the Gitea API, the boostrap command requires a Gitea API token
with administration permissions.

The Gitea API Token can be exported as an environment variable:

```bash
export GITEA_TOKEN=<your-gitea-api-token>
```

If the `GITEA_TOKEN` environment variable is not set, the `mpas bootstrap` command will prompt
for the Gitea API token.

{{<callout context="danger" title="Token in Secret">}}
Note that the Gitea API Token is stored in the cluster as a **Kubernetes Secret** named `flux-system`
inside the `flux-system` namespace.{{</callout>}}

### Personal account

Run bootstrap for a repository on your personal Gitea account:

```bash
mpas bootstrap gitea \
  --owner=<your-gite  -username> \
  --repository=<your-gitea-repository> \
  --path=clusters/my-cluster \
  --dev \
  --personal
```

If the specified repository does not exist, the `mpas bootstrap` command will create it
as a private repository. If you wish to create a public repository, you can use the `--private=false`
flag.

### Organization

If you want to bootstrap `MPAS` for a repository owned by an Gitea organization,
it is recommended to create a dedicated Gitea user for `MPAS` and use that user to bootstrap
the repository.

Run the bootstrap for a repository owned by a Gitea organization:

```bash
mpas bootstrap gitea \
  --owner=<your-gitea-organization> \
  --repository=<your-gitea-repository> \
  --path=clusters/my-cluster \
  --dev
```


## Bootstrap for an air-gapped environment

If you want to bootstrap `MPAS` for a repository in an air-gapped environment, only Gitea
is supported at the moment.

### Export the bootstrap components bundle

To bootstrap `MPAS` in an air-gapped environment, you need to export the bootstrap components
bundle from the `MPAS` default registry.

```bash
mpas bootstrap \
  --export \
  --export-path=/tmp
```

The above command will export the bootstrap components archive to `/tmp/mpas-bundle.tar.gz`.

It is then possible to import the bootstrap components bundle into an air-gapped environment
registry and use it to bootstrap `MPAS` for a repository in that environment.

```bash
mpas bootstrap gitea \
  --owner=<your-gitea-organization> \
  --repository=<your-gitea-repository> \
  --from-file=/tmp/mpas-bundle.tar.gz \
  --registry=<your-air-gapped-registry> \
  --path=clusters/my-cluster \
  --dev
```

The above command will copy the bootstrap components from the bundle archive to the specified
air-gapped registry and bootstrap `MPAS` for the specified repository.
