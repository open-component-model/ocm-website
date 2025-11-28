---
title: Set Up an OCM Controller Environment
description: "Set up a local environment for running examples from the getting-started guides."
icon: "🛠️"
weight: 32
toc: true
---

This document describes how to set up a local environment for running examples from the [Deploy a Helm Chart]({{< ref "docs/getting-started/deploy-helm-chart.md" >}}) guide. You will create a local Kubernetes cluster with kind and then install kro, Flux, and the OCM controllers.

## Prerequisites

- Install [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl).
- [Install kind](https://kind.sigs.k8s.io/docs/user/quick-start).
- Install [Git](https://git-scm.com/).
- Install [Task](https://taskfile.dev/).

## Start a Local Kubernetes Cluster With kind

{{<callout context="note">}}
You don't need to run kind if you are using a remote Kubernetes cluster you have access to. If so, you can skip this.
{{</callout>}}

To create a local kind cluster run the following command:

```bash
kind create cluster
```

## Install kro

Please follow [the official installation guides for kro](https://kro.run/docs/getting-started/Installation). You might
need [helm](https://helm.sh/docs/intro/install/) to install kro.

If kro is installed correctly, you should see some similar output when running the following command:

```bash
kubectl get pods --all-namespaces
```

```console
NAMESPACE            NAME                                         READY   STATUS             RESTARTS        AGE
...
kro                  kro-86d5b5b5bd-6gmvr                         1/1     Running            0               3h28m
...
```

## Install a Deployer

Currently, we created our examples and getting-started guides using [FluxCD](https://fluxcd.io/) as deployer.
But, in theory, you could use any other deployer that is able to apply a deployable resource to a Kubernetes cluster,
for instance [ArgoCD](https://argo-cd.readthedocs.io/en/stable/).

To install FluxCD, please follow the official [installation guide](https://fluxcd.io/docs/installation/). After you
installed the CLI tool, you can run the following command to install the FluxCD controllers:

```bash
flux install
```

If the FluxCD controllers are installed correctly, you should see some similar output when running the following
command:

```bash
kubectl get pods --all-namespaces
```

```console
NAMESPACE            NAME                                         READY   STATUS             RESTARTS        AGE
...
flux-system          helm-controller-b6767d66-zbwws               1/1     Running            0               3h29m
flux-system          kustomize-controller-57c7ff5596-v6fvr        1/1     Running            0               3h29m
flux-system          notification-controller-58ffd586f7-pr65t     1/1     Running            0               3h29m
flux-system          source-controller-6ff87cb475-2h2lv           1/1     Running            0               3h29m
...
kro                  kro-86d5b5b5bd-6gmvr                         1/1     Running            0               3h28m
...
```

## Install the OCM Controllers

To install the OCM controllers, you can use one of the following commands:

```bash
# In the open-component-model repository, folder kubernetes/controller
task deploy
```

or

```bash
kubectl apply -k https://github.com/open-component-model/open-component-model/kubernetes/controller/config/default?ref=main
```

If the OCM controllers are installed correctly, you should see some similar output when running the
following command:

```bash
kubectl get pods --all-namespaces
```

```console
NAMESPACE            NAME                                         READY   STATUS             RESTARTS        AGE
...
flux-system              helm-controller-b6767d66-zbwws                        1/1     Running            0               3h39m
flux-system              kustomize-controller-57c7ff5596-v6fvr                 1/1     Running            0               3h39m
flux-system              notification-controller-58ffd586f7-pr65t              1/1     Running            0               3h39m
flux-system              source-controller-6ff87cb475-2h2lv                    1/1     Running            0               3h39m
...
kro                      kro-86d5b5b5bd-6gmvr                                  1/1     Running            0               3h38m
...
ocm-k8s-toolkit-system   ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8   1/1     Running            0               57s
...
```

## Get Access to a Registry

As all examples and guides will create an OCM component version that will be consumed by the OCM controllers, you will
need access to a registry. You can either choose a public registry like [ghcr.io][ghcr.io] or deploy a registry (like
[`registry`][registry], [`zot`][zot], ...) into your Kubernetes cluster.

{{<callout context="caution">}}
If you choose to deploy a registry into your Kubernetes cluster, you have to make sure it is accessible from outside
the cluster (for `ocm transfer` to work) and inside the cluster (for the OCM controllers to work).

We **strongly** recommend to use a registry that is publicly accessible, like [ghcr.io][ghcr.io].
(Deploying your own registry requires a lot of additional configuration. Especially, if you want to try out the
localization example, you will need to configure a registry that is accessible with the same address from your
CLI, kubelet, and inside the cluster.)
{{</callout>}}

---

If you completed all of the above steps, you are ready to go. You can now start with the [Deploy a Helm Chart]({{< relref "docs/getting-started/deploy-helm-chart.md" >}}) guide or play around with the examples in the
[`examples/`](https://github.com/open-component-model/open-component-model/tree/main/kubernetes/controller/examples) directory.

[ghcr.io]: https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages
[registry]: https://hub.docker.com/_/registry
[zot]: https://zotregistry.dev/
