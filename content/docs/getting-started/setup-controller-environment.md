---
title: "Set up Controller Environments"
description: "Set up a local Kubernetes environment with the OCM Controllers, kro, and FluxCD for testing OCM deployments."
icon: "⚓"
weight: 25
toc: true
---

This guide helps you set up a local Kubernetes environment for testing OCM controller-based deployments.
You'll install the OCM Controllers, kro, and FluxCD to enable GitOps workflows with OCM component versions.

## You'll end up with

- A local or remote Kubernetes cluster with OCM Controllers, kro, and FluxCD installed

## Prerequisites

- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) installed
- [OCM CLI installed]({{< relref "ocm-cli-installation.md" >}})
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start) (for local clusters) or access to a remote Kubernetes cluster
- [Helm](https://helm.sh/docs/intro/install/) installed
- Access to an OCI registry (e.g., [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages))

## Setup Workflow
{{< steps >}}
{{< step >}}
### Create a Local Kubernetes Cluster

> 📣 **Note:** 📣  
> Skip this step if you're using a remote Kubernetes cluster.

Create a local kind cluster:

```shell
kind create cluster
```

Verify the cluster is running:

```shell
kubectl cluster-info
```

{{< /step >}}
{{< step >}}
## Install kro

Install [kro](https://kro.run) following the [official installation guide](https://kro.run/docs/getting-started/Installation). Verify kro is running:

```shell
kubectl get pods -n kro
```

Expected output:

```text
NAME                          READY   STATUS             RESTARTS        AGE
kro-86d5b5b5bd-6gmvr          1/1     Running            0               3h28m
```
{{< /step >}}
{{< step >}}
### Install a Deployer: FluxCD

We use [FluxCD](https://fluxcd.io/) as deployer. In theory, you could use any other deployer
that is able to apply a deployable resource to a Kubernetes cluster,
for instance [Argo CD](https://argo-cd.readthedocs.io/en/stable/).

Install the Flux CLI following the [official installation guide](https://fluxcd.io/docs/installation/),
then install the controllers using the CLI:

```shell
flux install
```

Verify FluxCD is running:

```shell
kubectl get pods -n flux-system
```

Expected output:

```text
NAME                                         READY   STATUS      RESTARTS        AGE
helm-controller-b6767d66-zbwws               1/1     Running     0               3h29m
kustomize-controller-57c7ff5596-v6fvr        1/1     Running     0               3h29m
notification-controller-58ffd586f7-pr65t     1/1     Running     0               3h29m
source-controller-6ff87cb475-2h2lv           1/1     Running     0               3h29m
```

{{< /step >}}
{{< step >}}
### Install the OCM Controllers

Install the OCM controllers via Helm:

```shell
helm install ocm-k8s-toolkit oci://ghcr.io/open-component-model/charts/ocm-k8s-toolkit \
  --namespace ocm-k8s-toolkit-system \
  --create-namespace
```

Verify the OCM controller is running:

```shell
kubectl get pods -n ocm-k8s-toolkit-system
```

Expected output:

```text
NAME                                                   READY   STATUS    RESTARTS   AGE
ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8    1/1     Running   0          1m
```

{{< /step >}}
{{< step >}}
### Verify Complete Setup

Check all components are running:

```shell
kubectl get pods --all-namespaces | grep -E '(kro|flux-system|ocm-k8s-toolkit-system)'
```

Expected output:

```text
NAMESPACE                NAME                                                 READY    STATUS             RESTARTS        AGE
flux-system              helm-controller-b6767d66-zbwws                        1/1     Running            0               3h39m
flux-system              kustomize-controller-57c7ff5596-v6fvr                 1/1     Running            0               3h39m
flux-system              notification-controller-58ffd586f7-pr65t              1/1     Running            0               3h39m
flux-system              source-controller-6ff87cb475-2h2lv                    1/1     Running            0               3h39m
kro                      kro-86d5b5b5bd-6gmvr                                  1/1     Running            0               3h38m
ocm-k8s-toolkit-system   ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8   1/1     Running            0               57s
```

{{< /step >}}
{{< /steps >}}

## Registry Access

The OCM Controllers need access to an OCI registry to fetch component versions.

{{< callout context="tip" title="Tip" icon="outline/rocket" >}}
We recommend using a publicly accessible registry like [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages). Using a local registry requires additional configuration to ensure it's accessible both from your CLI and from within the cluster.
{{< /callout >}}

For private registries, you'll need to configure credentials. See [Configure Credentials for Private Registries]({{< relref "creds-in-ocmconfig.md" >}}) for details.

## Cleanup

To remove the local kind cluster after testing, run:

```shell
kind delete cluster
```

## Next Steps

- [Tutorial: Deploy a Helm Chart]({{< relref "deploy-helm-chart.md" >}}) - Use the OCM Controllers to deploy applications from component versions

## Related Documentation

- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}) - Learn about the architecture and capabilities of the OCM Controllers
