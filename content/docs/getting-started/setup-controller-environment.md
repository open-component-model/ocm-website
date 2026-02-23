---
title: "Set up a Controller Environment"
description: "Set up a local Kubernetes environment with the OCM Controllers, kro, and FluxCD for testing OCM deployments."
icon: "⚓"
weight: 23
toc: true
---

This guide helps you set up a local Kubernetes environment for testing OCM controller-based deployments.
You'll install the OCM Controllers, kro, and FluxCD to enable GitOps workflows with OCM component versions.

## What You'll Learn

By the end of this tutorial, you will:

- Have a local or remote Kubernetes cluster with the OCM Controllers, kro, and FluxCD installed

## Prerequisites

- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) installed
- [OCM CLI installed]({{< relref "ocm-cli-installation.md" >}})
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start) (for local clusters) or access to a remote Kubernetes cluster
- [Helm](https://helm.sh/docs/intro/install/) installed
- Access to an OCI registry (e.g., [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages))

## Create a Local Kubernetes Cluster

{{< callout context="note" title="Note" icon="outline/info-circle" >}}
Skip this step if you're using a remote Kubernetes cluster.
{{< /callout >}}

Create a local kind cluster:

```shell
kind create cluster
```

Verify the cluster is running:

```shell
kubectl cluster-info
```

## Install kro

[kro](https://kro.run) is a Kubernetes Resource Orchestrator that helps define and manage complex resource relationships.

Install kro following the [official installation guide](https://kro.run/docs/getting-started/Installation).

Verify kro is running:

```shell
kubectl get pods -n kro
```

Expected output:

```text
NAME                   READY   STATUS    RESTARTS   AGE
kro-86d5b5b5bd-6gmvr   1/1     Running   0          1m
```

## Install FluxCD

FluxCD provides GitOps capabilities for deploying Helm charts and other resources.

Install the Flux CLI following the [official installation guide](https://fluxcd.io/docs/installation/), then install the controllers:

```shell
flux install
```

Verify FluxCD is running:

```shell
kubectl get pods -n flux-system
```

Expected output:

```text
NAME                                       READY   STATUS    RESTARTS   AGE
helm-controller-b6767d66-zbwws             1/1     Running   0          1m
kustomize-controller-57c7ff5596-v6fvr      1/1     Running   0          1m
notification-controller-58ffd586f7-pr65t   1/1     Running   0          1m
source-controller-6ff87cb475-2h2lv         1/1     Running   0          1m
```

## Install the OCM Controllers

The OCM Controllers provide Kubernetes controllers for working with OCM component versions.

Install via Helm:

```shell
helm install ocm-k8s-toolkit oci://ghcr.io/open-component-model/charts/ocm-k8s-toolkit \
  --namespace ocm-k8s-toolkit-system \
  --create-namespace
```

Verify the toolkit is running:

```shell
kubectl get pods -n ocm-k8s-toolkit-system
```

Expected output:

```text
NAME                                                  READY   STATUS    RESTARTS   AGE
ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8   1/1     Running   0          1m
```

## Verify Complete Setup

Check all components are running:

```shell
kubectl get pods --all-namespaces | grep -E '(kro|flux-system|ocm-k8s-toolkit)'
```

Expected output:

```text
flux-system              helm-controller-b6767d66-zbwws                        1/1     Running   0   5m
flux-system              kustomize-controller-57c7ff5596-v6fvr                 1/1     Running   0   5m
flux-system              notification-controller-58ffd586f7-pr65t              1/1     Running   0   5m
flux-system              source-controller-6ff87cb475-2h2lv                    1/1     Running   0   5m
kro                      kro-86d5b5b5bd-6gmvr                                  1/1     Running   0   5m
ocm-k8s-toolkit-system   ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8   1/1     Running   0   5m
```

## Registry Access

The OCM Controllers need access to an OCI registry to fetch component versions.

{{< callout context="tip" title="Tip" icon="outline/info-circle" >}}
We recommend using a publicly accessible registry like [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages). Using a local registry requires additional configuration to ensure it's accessible both from your CLI and from within the cluster.
{{< /callout >}}

For private registries, you'll need to configure credentials. See [Configure Credentials for Private Registries]({{< relref "../how-to/configure-signing-credentials.md" >}}) for details.

## Next Steps

- [Deploy a Helm Chart]({{< relref "deploy-helm-chart.md" >}}) - Use the OCM Controllers to deploy applications from component versions

## Cleanup

To remove the local kind cluster:

```shell
kind delete cluster