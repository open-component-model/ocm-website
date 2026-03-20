---
title: "Deploy with Controllers"
description: "Deploy a Helm chart from an OCM component version using the OCM Controllers, kro, and Flux."
icon: "🚀"
weight: 55
toc: true
---

This tutorial walks you through deploying a Helm chart from an OCM component version to a Kubernetes cluster
using the OCM Controllers with kro and Flux. It covers two approaches:

1. **Manual RGD**: you define the `ResourceGraphDefinition` yourself and apply it to the cluster.
2. **Bootstrap**: the `ResourceGraphDefinition` is packaged inside the OCM component and applied automatically by the [Deployer]({{< relref "kubernetes-deployer.md" >}}).

## What You'll Learn

- Create and publish an OCM component version that references a Helm chart
- Define a ResourceGraphDefinition to orchestrate OCM and Flux resources
- Deploy the Helm chart using both the manual and bootstrap approaches
- Localize an image reference during deployment

## Estimated Time

~30 minutes

## Prerequisites

- [Controller environment]({{< relref "setup-controller-environment.md" >}}) set up (OCM Controllers, kro, and Flux)
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- Access to an OCI registry (e.g., [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages))
- A GitHub account with a personal access token

## Environment Setup

Before starting, set environment variables for your GitHub username and OCM repository name:

```bash
export GITHUB_USERNAME=<your-github-username>
export OCM_REPO=ghcr.io/$GITHUB_USERNAME/ocm-tutorial
```

These variables will be used in registry paths throughout the tutorial.

## Part 1: Manual RGD

In this approach, you create the `ResourceGraphDefinition` outside the OCM component and apply it directly to the cluster.

### Create and Publish a Component Version

{{< steps >}}
{{< step >}}

#### Create a working directory

```shell
mkdir /tmp/helm-deploy && cd /tmp/helm-deploy
```
{{< /step >}}

{{< step >}}

#### Define the component

Create a `component-constructor.yaml` file that includes a Helm chart resource. This tells OCM what software artifact (in this case a Helm chart) to track as part of this component version:

```yaml
components:
  - name: ocm.software/ocm-k8s-toolkit/simple
    provider:
      name: ocm.software
    version: "1.0.0"
    resources:
      - name: helm-resource
        type: helmChart
        version: 1.0.0
        access:
          type: ociArtifact
          imageReference: "ghcr.io/stefanprodan/charts/podinfo:6.9.1@sha256:565d310746f1fa4be7f93ba7965bb393153a2d57a15cfe5befc909b790a73f8a"
```

This component references the `podinfo` Helm chart, a simple web application that displays pod information.
{{< /step >}}

{{< step >}}

#### Build and push the component version

The `--repository` flag pushes the component version directly to the OCI registry, so no separate transfer step is needed:

```shell
ocm add cv --repository $OCM_REPO
```

By default, this looks for `component-constructor.yaml` in the current directory.

<details>
<summary>Expected output</summary>

```text
COMPONENT                           │ VERSION │ PROVIDER
─────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/simple │ 1.0.0   │ ocm.software
```
</details>
{{< /step >}}

{{< step >}}

#### Verify the upload

```shell
ocm get cv $OCM_REPO//ocm.software/ocm-k8s-toolkit/simple:1.0.0
```
<details>
<summary>Expected output</summary>

```text
COMPONENT                           │ VERSION │ PROVIDER
─────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/simple │ 1.0.0   │ ocm.software
```
</details>

{{< /step >}}
{{< /steps >}}

{{< callout context="note" >}}
By default, packages created in GitHub Container Registry are _private_. Either make them public or [configure credentials]({{< relref "configure-credentials-for-controllers.md" >}}) for the OCM controller resources.
{{< /callout >}}

### Deploy the Helm Chart

The deployment uses a chain of OCM controller resources. The `ResourceGraphDefinition` (RGD) tells kro how to wire them together: `Repository` validates the registry is reachable, `Component` resolves the component version, `Resource` fetches the Helm chart location, and Flux's `OCIRepository` + `HelmRelease` handle the actual deployment.

{{< steps >}}
{{< step >}}

#### Create the ResourceGraphDefinition

Create `rgd.yaml`:

```yaml
apiVersion: kro.run/v1alpha1
kind: ResourceGraphDefinition
metadata:
  name: simple
spec:
  schema:
    apiVersion: v1alpha1
    kind: Simple
    spec:
      message: string | default="foo"
  resources:
    - id: repository
      template:
        apiVersion: delivery.ocm.software/v1alpha1
        kind: Repository
        metadata:
          name: simple-repository
        spec:
          repositorySpec:
              baseUrl: OCM_REPO_PLACEHOLDER
              type: OCIRegistry
          interval: 1m
    - id: component
      template:
        apiVersion: delivery.ocm.software/v1alpha1
        kind: Component
        metadata:
          name: simple-component
        spec:
          repositoryRef:
            name: ${repository.metadata.name}
          component: ocm.software/ocm-k8s-toolkit/simple
          semver: 1.0.0
          interval: 1m
    - id: resourceChart
      template:
        apiVersion: delivery.ocm.software/v1alpha1
        kind: Resource
        metadata:
          name: simple-resource
        spec:
          componentRef:
            name: ${component.metadata.name}
          resource:
            byReference:
              resource:
                name: helm-resource
          additionalStatusFields:
            registry: resource.access.toOCI().registry
            repository: resource.access.toOCI().repository
            tag: resource.access.toOCI().tag
          interval: 1m
    - id: ocirepository
      template:
        apiVersion: source.toolkit.fluxcd.io/v1
        kind: OCIRepository
        metadata:
          name: simple-ocirepository
        spec:
          interval: 1m0s
          layerSelector:
            mediaType: "application/vnd.cncf.helm.chart.content.v1.tar+gzip"
            operation: copy
          url: oci://${resourceChart.status.additional.registry}/${resourceChart.status.additional.repository}
          ref:
            tag: ${resourceChart.status.additional.tag}
    - id: helmrelease
      template:
        apiVersion: helm.toolkit.fluxcd.io/v2
        kind: HelmRelease
        metadata:
          name: simple-helmrelease
        spec:
          releaseName: simple
          interval: 1m
          timeout: 5m
          chartRef:
            kind: OCIRepository
            name: ${ocirepository.metadata.name}
            namespace: default
          values:
            ui:
              message: ${schema.spec.message}
```

Replace the `baseUrl` placeholder with your repository:

```shell
sed -i'' -e "s|OCM_REPO_PLACEHOLDER|$OCM_REPO|" rgd.yaml
```
{{< /step >}}

{{< step >}}

#### Apply the ResourceGraphDefinition

When kro processes the RGD, it generates a new Custom Resource Definition (CRD), in this case, a `Simple` kind that you can instantiate later:

```shell
kubectl apply -f rgd.yaml
```

Verify it's active:

```shell
kubectl get rgd
```

```text
NAME     APIVERSION   KIND     STATE    AGE
simple   v1alpha1     Simple   Active   19s
```
{{< /step >}}

{{< step >}}

#### Create an instance

Create `instance.yaml`. This creates a `Simple` resource, kro sees it and instantiates all the resources defined in the RGD, wiring them together automatically:

```yaml
apiVersion: kro.run/v1alpha1
kind: Simple
metadata:
  name: simple
spec:
  message: "Deployed with OCM!"
```

Apply it:

```shell
kubectl apply -f instance.yaml
```

Wait for the deployment. kro reconciles the full chain. OCM repository, component, resource, Flux source, and Helm release:

```shell
kubectl get simple -w
```

```text
NAME     STATE    SYNCED   AGE
simple   ACTIVE   True     2m
```
{{< /step >}}

{{< step >}}

#### Verify

```shell
kubectl get deployments
```

```text
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
simple-podinfo   1/1     1            1           3m
```

Check the configured message:

```shell
kubectl get pods -l app.kubernetes.io/name=simple-podinfo \
  -o jsonpath='{.items[0].spec.containers[0].env[?(@.name=="PODINFO_UI_MESSAGE")].value}'
```

```text
Deployed with OCM!
```
{{< /step >}}
{{< /steps >}}

#### Cleanup

```shell
kubectl delete -f instance.yaml
kubectl delete -f rgd.yaml
```

---

## Part 2: Bootstrap with the Deployer

In this approach, the `ResourceGraphDefinition` is packaged inside the OCM component. The [Deployer]({{< relref "kubernetes-deployer.md" >}}) extracts and applies it automatically. This also demonstrates **localization**, injecting an updated image reference into the Helm chart values.

{{<callout context="note" title="Localization" icon="outline/current-location">}}
**Localization** inserts a new image reference into the deployment instructions. When an OCM component is transferred with `--copy-resources`, referential resources update their image references to the new registry. The Deployer and FluxCD's `HelmRelease` values field propagate this change into the actual deployment.
{{</callout>}}

### Create the OCM Component Version

{{< steps >}}
{{< step >}}

#### Create a working directory

```shell
mkdir /tmp/helm-bootstrap && cd /tmp/helm-bootstrap
```
{{< /step >}}

{{< step >}}

#### Create the ResourceGraphDefinition file

Create `resourceGraphDefinition.yaml`. This RGD will be stored as a blob inside the OCM component and later extracted by the Deployer:

```yaml
apiVersion: kro.run/v1alpha1
kind: ResourceGraphDefinition
metadata:
  name: bootstrap
spec:
  schema:
    apiVersion: v1alpha1
    kind: Bootstrap
  resources:
    - id: resourceChart
      template:
        apiVersion: delivery.ocm.software/v1alpha1
        kind: Resource
        metadata:
          name: bootstrap-helm-resource
        spec:
          componentRef:
            name: bootstrap-component
          resource:
            byReference:
              resource:
                name: helm-resource
          additionalStatusFields:
            registry: resource.access.globalAccess.toOCI().registry
            repository: resource.access.globalAccess.toOCI().repository
            digest: resource.access.globalAccess.toOCI().digest
          interval: 1m
    - id: resourceImage
      template:
        apiVersion: delivery.ocm.software/v1alpha1
        kind: Resource
        metadata:
          name: bootstrap-image-resource
        spec:
          componentRef:
            name: bootstrap-component
          resource:
            byReference:
              resource:
                name: image-resource
          additionalStatusFields:
            registry: resource.access.globalAccess.toOCI().registry
            repository: resource.access.globalAccess.toOCI().repository
            tag: resource.access.globalAccess.toOCI().tag
            digest: resource.access.globalAccess.toOCI().digest
          interval: 1m
    - id: ocirepository
      template:
        apiVersion: source.toolkit.fluxcd.io/v1
        kind: OCIRepository
        metadata:
          name: bootstrap-ocirepository
        spec:
          interval: 1m0s
          insecure: true # This is set for testing purposes only!
          layerSelector:
            mediaType: "application/vnd.cncf.helm.chart.content.v1.tar+gzip"
            operation: copy
          url: oci://${resourceChart.status.additional.registry}/${resourceChart.status.additional.repository}
          ref:
            digest: ${resourceChart.status.additional.digest}
    - id: helmrelease
      template:
        apiVersion: helm.toolkit.fluxcd.io/v2
        kind: HelmRelease
        metadata:
          name: bootstrap-helmrelease
        spec:
          releaseName: bootstrap-release
          interval: 1m
          timeout: 5m
          chartRef:
            kind: OCIRepository
            name: ${ocirepository.metadata.name}
            namespace: default
          values:
            image:
              repository: ${resourceImage.status.additional.registry}/${resourceImage.status.additional.repository}
              tag: ${resourceImage.status.additional.tag}@${resourceImage.status.additional.digest} # we are using tag@digest here because Podinfo values doesn't expose any other ways to construct a valid image reference using only a Digest.
```

This RGD assumes the `Repository` and `Component` resources already exist in the cluster (they will be created as part of the bootstrap resources below).

{{< callout context="note" title="globalAccess vs direct access" icon="outline/info-circle" >}}
Unlike Part 1, this RGD uses `resource.access.globalAccess.toOCI()` instead of `resource.access.toOCI()`. When the component is transferred with `--copy-resources`, the resources are copied into the target registry and the component descriptor records a _local_ reference to them. The `globalAccess` field resolves the resource through its relocated OCI reference, which is required for the HelmRelease to pull the artifact ( the podinfo image ) from the correct registry.
{{< /callout >}}
{{< /step >}}

{{< step >}}

#### Define the component

Create `component-constructor.yaml`. This component bundles three resources: the Helm chart, the application image (for localization), and the RGD itself:

```yaml
components:
  - name: ocm.software/ocm-k8s-toolkit/bootstrap
    version: "1.0.0"
    provider:
      name: ocm.software
    resources:
      - name: helm-resource
        type: helmChart
        version: "1.0.0"
        access:
          type: ociArtifact
          imageReference: "ghcr.io/stefanprodan/charts/podinfo:6.9.1@sha256:565d310746f1fa4be7f93ba7965bb393153a2d57a15cfe5befc909b790a73f8a"
      - name: image-resource
        type: ociArtifact
        version: "1.0.0"
        access:
          type: ociRegistry
          imageReference: "ghcr.io/stefanprodan/podinfo:6.9.1@sha256:262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb"
      - name: resource-graph-definition
        type: blob
        version: "1.0.0"
        input:
          type: file
          path: ./resourceGraphDefinition.yaml
```
{{< /step >}}

{{< step >}}

#### Build and transfer with localization

First, build the component into a local CTF archive:

```shell
ocm add cv
```

Then transfer it to the registry with `--copy-resources`. This copies the referenced OCI artifacts (Helm chart and image) into your registry, which is what enables localization. The component descriptor is updated to point at the new locations:

```shell
ocm transfer cv ctf::./transport-archive//ocm.software/ocm-k8s-toolkit/bootstrap:1.0.0 \
  $OCM_REPO --copy-resources
```

{{< callout context="note" >}}
If using a private registry, see the [OCM CLI credentials documentation]({{< relref "/docs/concepts/credential-system.md" >}}).
{{< /callout >}}

Verify:

```shell
ocm get componentversion $OCM_REPO//ocm.software/ocm-k8s-toolkit/bootstrap:1.0.0
```
{{< /step >}}
{{< /steps >}}

### Bootstrap the ResourceGraphDefinition

The bootstrap process creates the OCM controller resources that download and apply the RGD from the component. The chain is: `Repository` (validates the registry) -> `Component` (resolves the component version) -> `Resource` (fetches the RGD blob) -> `Deployer` (applies the RGD to the cluster via server-side apply).

{{< steps >}}
{{< step >}}

#### Create bootstrap resources

Create `bootstrap.yaml`:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: bootstrap-repository
spec:
  repositorySpec:
    baseUrl: OCM_REPO_PLACEHOLDER
    type: OCIRegistry
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Component
metadata:
  name: bootstrap-component
spec:
  component: ocm.software/ocm-k8s-toolkit/bootstrap
  repositoryRef:
    name: bootstrap-repository
  semver: 1.0.0
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: bootstrap-rgd
  namespace: default
spec:
  componentRef:
    name: bootstrap-component
  resource:
    byReference:
      resource:
        name: resource-graph-definition
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Deployer
metadata:
  name: bootstrap-deployer
  namespace: default
spec:
  resourceRef:
    name: bootstrap-rgd
    namespace: default
```

Replace the `baseUrl` placeholder with your repository:

```shell
sed -i'' -e "s|OCM_REPO_PLACEHOLDER|$OCM_REPO|" bootstrap.yaml
```

The `Deployer` references the `Resource` containing the RGD. Once that resource is ready, the Deployer downloads the RGD manifest and applies it to the cluster using server-side apply.

{{< callout context="note" title="Credentials" icon="outline/key" >}}
For private registries, add `ocmConfig` to the Repository, Component, Resource, and Deployer specs. See [Configure Credentials for Controllers]({{< relref "configure-credentials-for-controllers.md" >}}).
{{< /callout >}}

{{< /step >}}

{{< step >}}

#### Apply bootstrap resources

```shell
kubectl apply -f bootstrap.yaml
```

The controllers reconcile in order. Wait for the RGD to appear. This means that the Deployer successfully downloaded and applied it:

```shell
kubectl get rgd
```

```text
NAME        APIVERSION   KIND        STATE    AGE
bootstrap   v1alpha1     Bootstrap   Active   2m56s
```

Once the RGD is `Active`, kro has created a new `Bootstrap` CRD that you can instantiate.
{{< /step >}}
{{< /steps >}}

### Create an Instance

{{< steps >}}
{{< step >}}

#### Deploy

Create `instance.yaml`. This triggers kro to create the `Resource`, `OCIRepository`, and `HelmRelease` objects defined in the RGD:

```yaml
apiVersion: kro.run/v1alpha1
kind: Bootstrap
metadata:
  name: bootstrap
```

```shell
kubectl apply -f instance.yaml
```

```shell
kubectl get bootstrap -w
```

```text
NAME        STATE    SYNCED   AGE
bootstrap   ACTIVE   True     3m23s
```
{{< /step >}}

{{< step >}}

#### Verify

Check the deployment:

```shell
kubectl get deployments
```

```text
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
bootstrap-release-podinfo   1/1     1            1           4m25s
```

Verify localization. The image should reference your registry, not the original:

```shell
kubectl get pods -l app.kubernetes.io/name=bootstrap-release-podinfo \
  -o jsonpath='{.items[0].spec.containers[0].image}'
```

```text
$OCM_REPO/component-descriptors/ocm.software/ocm-k8s-toolkit/bootstrap:1.0.0@sha256:262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb
```
{{< /step >}}
{{< /steps >}}

#### Cleanup

```shell
kubectl delete -f instance.yaml
kubectl delete -f bootstrap.yaml
```

## Troubleshooting

### Authentication Errors

```text
failed to list versions: response status code 401: unauthorized
```

Your registry package may be private. Either make it public or [configure credentials]({{< relref "configure-credentials-for-controllers.md" >}}).

### Resource Not Found

Verify the component was transferred to your repository:

```shell
ocm get cv $OCM_REPO//<component>:<version>
```

Check that the `baseUrl` in the Repository resource matches your registry.

## Next Steps

- [Tutorial: Structure Software Products with OCM]({{< relref "complex-component-structure-deployment.md" >}}), complex applications with multiple components
- [Concept: Deployer]({{< relref "kubernetes-deployer.md" >}}), architecture and lifecycle management
- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}), overview of the controller ecosystem

## Related Documentation

- [Configure Credentials for Controllers]({{< relref "configure-credentials-for-controllers.md" >}})
- [Setup Controller Environment]({{< relref "setup-controller-environment.md" >}})
