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
- [Helm](https://helm.sh/docs/intro/install/) installed
- [Flux CLI](https://fluxcd.io/flux/installation/#install-the-flux-cli) installed
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start) installed (or access to a remote Kubernetes cluster)
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
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

<details>
<summary>You should see this output</summary>

```text
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.35.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind
Have a nice day! 👋
```
</details>
<br></details>
<br>

Verify the cluster is running:

```shell
kubectl cluster-info
```
<details>
<summary>You should see this output</summary>

```text
Kubernetes control plane is running at https://127.0.0.1:53348
CoreDNS is running at https://127.0.0.1:53348/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'
```
</details>

{{< /step >}}
{{< step >}}

## Install kro

Install [kro](https://kro.run) following the [official installation guide](https://kro.run/docs/getting-started/Installation). The easiest way is via Helm:

```shell
helm install kro oci://registry.k8s.io/kro/charts/kro \
  --namespace kro-system \
  --create-namespace
```
<details>
<summary>You should see this output</summary>

```
Pulled: registry.k8s.io/kro/charts/kro:0.8.5
Digest: sha256:c9a9dc0133f43a25711f4bdbce1eeb4b6448015958f901c6fad61a049e54415e
NAME: kro
LAST DEPLOYED: Wed Feb 25 12:02:15 2026
NAMESPACE: kro-system
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None
```
</details>
<br>

Verify kro is running:

```shell
kubectl get pods -n kro-system
```

<details>
<summary>You should see this output</summary>

```text
NAME                   READY   STATUS    RESTARTS   AGE
kro-5644d5759f-82nsx   1/1     Running   0          2m22s
```
</details>

{{< /step >}}
{{< step >}}

### Install a Deployer: Flux

We use [Flux](https://fluxcd.io/) as deployer. In theory, you could use any other deployer
that is able to apply a deployable resource to a Kubernetes cluster,
for instance [Argo CD](https://argo-cd.readthedocs.io/en/stable/).

Install the controllers using the Flux CLI:

```shell
flux install
```

<details>
<summary>You should see this output</summary>

```text
✚ generating manifests
✔ manifests build completed
► installing components in flux-system namespace
CustomResourceDefinition/alerts.notification.toolkit.fluxcd.io created
CustomResourceDefinition/buckets.source.toolkit.fluxcd.io created
CustomResourceDefinition/externalartifacts.source.toolkit.fluxcd.io created
CustomResourceDefinition/gitrepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/helmcharts.source.toolkit.fluxcd.io created
CustomResourceDefinition/helmreleases.helm.toolkit.fluxcd.io created
CustomResourceDefinition/helmrepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/kustomizations.kustomize.toolkit.fluxcd.io created
CustomResourceDefinition/ocirepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/providers.notification.toolkit.fluxcd.io created
CustomResourceDefinition/receivers.notification.toolkit.fluxcd.io created
Namespace/flux-system created
ClusterRole/crd-controller-flux-system created
ClusterRole/flux-edit-flux-system created
ClusterRole/flux-view-flux-system created
ClusterRoleBinding/cluster-reconciler-flux-system created
ClusterRoleBinding/crd-controller-flux-system created
ResourceQuota/flux-system/critical-pods-flux-system created
ServiceAccount/flux-system/helm-controller created
ServiceAccount/flux-system/kustomize-controller created
ServiceAccount/flux-system/notification-controller created
ServiceAccount/flux-system/source-controller created
Service/flux-system/notification-controller created
Service/flux-system/source-controller created
Service/flux-system/webhook-receiver created
Deployment/flux-system/helm-controller created
Deployment/flux-system/kustomize-controller created
Deployment/flux-system/notification-controller created
Deployment/flux-system/source-controller created
NetworkPolicy/flux-system/allow-egress created
NetworkPolicy/flux-system/allow-scraping created
NetworkPolicy/flux-system/allow-webhooks created
◎ verifying installation
✔ helm-controller: deployment ready
✔ kustomize-controller: deployment ready
✔ notification-controller: deployment ready
✔ source-controller: deployment ready
✔ install finished
```
</details>`
<br>

Verify Flux is running:

```shell
kubectl get pods -n flux-system
```

<details>
<summary>You should see this output</summary>

```text
NAME                                         READY   STATUS      RESTARTS        AGE
helm-controller-b6767d66-zbwws               1/1     Running     0               3h29m
kustomize-controller-57c7ff5596-v6fvr        1/1     Running     0               3h29m
notification-controller-58ffd586f7-pr65t     1/1     Running     0               3h29m
source-controller-6ff87cb475-2h2lv           1/1     Running     0               3h29m
```
</details>

{{< /step >}}
{{< step >}}

### Install the OCM Controllers

Use Helm to install the OCM controllers:

```shell
helm install ocm-k8s-toolkit oci://ghcr.io/open-component-model/charts/ocm-k8s-toolkit \
  --namespace ocm-k8s-toolkit-system \
  --create-namespace
```

<details>
<summary>You should see this output</summary>

```text
Pulled: ghcr.io/open-component-model/charts/ocm-k8s-toolkit:0.1.0
Digest: sha256:6e793847cef1d765f1dfd9fa9ab400a4043b21f86c8b39bb13f3206c3000a956
NAME: ocm-k8s-toolkit
LAST DEPLOYED: Wed Feb 25 12:21:44 2026
NAMESPACE: ocm-k8s-toolkit-system
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
TEST SUITE: None
```
</details>
<br>

Verify the OCM controller is running:

```shell
kubectl get pods -n ocm-k8s-toolkit-system
```

<details>
<summary>You should see this output</summary>

```text
NAME                                                  READY   STATUS    RESTARTS   AGE
ocm-k8s-toolkit-controller-manager-79b7975755-vxtqt   1/1     Running   0          59s
```
</details>

{{< /step >}}
{{< step >}}

### Verify Complete Setup

Check all components are running:

```shell
kubectl get pods --all-namespaces | grep -E '(kro-system|flux-system|ocm-k8s-toolkit-system)'
```

<details>
<summary>You should see this output</summary>

```text
NAMESPACE                NAME                                                 READY    STATUS             RESTARTS        AGE
flux-system              helm-controller-b6767d66-zbwws                        1/1     Running            0               3h39m
flux-system              kustomize-controller-57c7ff5596-v6fvr                 1/1     Running            0               3h39m
flux-system              notification-controller-58ffd586f7-pr65t              1/1     Running            0               3h39m
flux-system              source-controller-6ff87cb475-2h2lv                    1/1     Running            0               3h39m
kro-system               kro-86d5b5b5bd-6gmvr                                  1/1     Running            0               3h38m
ocm-k8s-toolkit-system   ocm-k8s-toolkit-controller-manager-788f58d4bd-ntbx8   1/1     Running            0               57s
```
</details>

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

<details>
<summary>You should see this output</summary>

```text
Deleting cluster "kind" ...
Deleted nodes: ["kind-control-plane"]
```
</details>

## Next Steps

- [Tutorial: Deploy a Helm Chart]({{< relref "deploy-helm-chart.md" >}}) - Use the OCM Controllers to deploy applications from component versions

## Related Documentation

- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}) - Learn about the architecture and capabilities of the OCM Controllers
