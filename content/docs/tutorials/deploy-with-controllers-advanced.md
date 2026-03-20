---
title: "Deploy with Controllers using Kro and Flux"
description: "Deploy a Helm chart from an OCM component version using Kro as orchestrator and Flux as a deploy mechanic."
icon: "🚀"
weight: 56
toc: true
---

This tutorial builds upon [Deploy With Controllers]({{< relref "deploy-with-controllers.md" >}}). It assumes that you already
have the prerequisites from that and now have a basic understanding about how the controller works in general.

In this approach, we will pack a `ResourceGraphDefinition` inside the OCM component. The [Deployer](`kubernetes-deployment.yaml placeholder`) extracts and applies it automatically. This also demonstrates **localization**, injecting an updated image reference into the Helm chart values.

We will take the `podinfo` application, package its helm chart, and create a `HelmRelease` object that using some `values`, will deploy the helm chart of the `podinfo` application into the cluster.

During the component creation we will transfer the podinfo image into our own registry and the helm chart will fetch it from that location instead of
the currently configured `ghcr.io/stefanprodan/charts/podinfo`.

## Prerequisites

The previous scenario was using basic primitives. This guide assumes the user has installed [Kro] and [Flux].

## Environment Setup

Before starting, set environment variables for your GitHub username and OCM repository name:

```bash
export GITHUB_USERNAME=<your-github-username>
export OCM_REPO=ghcr.io/$GITHUB_USERNAME/ocm-tutorial
```

These variables will be used in registry paths throughout the tutorial.

## Create a working directory

We begin, by creating a temporary folder to work in.

```shell
mkdir /tmp/helm-deploy && cd /tmp/helm-deploy
```

## Create the ResourceGraphDefinition file

First, we are going to create our `resourceGraphDefinition.yaml`. 

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
            registry: resource.access.toOCI().registry
            repository: resource.access.toOCI().repository
            digest: resource.access.toOCI().digest
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
            registry: resource.access.toOCI().registry
            repository: resource.access.toOCI().repository
            tag: resource.access.toOCI().tag
            digest: resource.access.toOCI().digest
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

## Define the component

Now, let's define our `component-constructor.yaml` file that includes a couple of things. It includes a helm-resource, an image-resource and the RGD.

```yaml
components:
  - name: ocm.software/ocm-k8s-toolkit/advanced
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

We will transfer all of them to our remote repository.

### Build and transfer with localization

Run the following command:

```shell
ocm add cv
```

This will create a CTF archive under `.transport-archive` folder in the current working directory. Let's transfer this archive to our repository:

```shell
ocm transfer cv ctf::./transport-archive//ocm.software/ocm-k8s-toolkit/advanced:1.0.0 $OCM_REPO --copy-resources
...

Transferring component versions...
  ✓ transform100OcmSoftwareOcmK8sToolkitAdvancedAddtransform100HelmResource [OCIAddLocalResource]
  ✓ transform100OcmSoftwareOcmK8sToolkitAdvancedAddtransformImageResource100 [OCIAddLocalResource]
  ✓ transform100OcmSoftwareOcmK8sToolkitAdvancedAddtransformResourceGraphDefinition100 [OCIAddLocalResource]
  ✓ transform100OcmSoftwareOcmK8sToolkitAdvancedUpload [OCIAddComponentVersion]
  [████████████████████████████████████████] 100% 7/7
```

Verify:

```shell
ocm get componentversion $OCM_REPO//ocm.software/ocm-k8s-toolkit/advanced:1.0.0
```

<details>
<summary>Expected output</summary>

```text
COMPONENT                             │ VERSION │ PROVIDER
──────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/advanced │ 1.0.0   │ ocm.software
```

</details>

{{<callout context="note">}}
By default, packages created in GitHub Container Registry are _private_. Either make them public or [configure credentials]({{<relref "configure-credentials-for-controllers.md">}}) for the OCM controller resources.
{{</callout>}}

## Bootstrap the ResourceGraphDefinition

Now, we get to the interesting part. Let's bootstrap the RGD. The bootstrap process creates the [controller chain](`kubernetes-deploy.yaml placeholder`) resources that download the RGD from the component and hands it to the [Deployer](`kubernetes-deploy.yaml placeholder`) for server-side apply.

Create a `bootstrap.yaml` file with the following content:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: bootstrap-repository
spec:
  repositorySpec:
    baseUrl: $OCM_REPO
    type: OCIRepository
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Component
metadata:
  name: bootstrap-component
spec:
  component: ocm.software/ocm-k8s-toolkit/advanced
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

Again, let's substitute our OCM_REPO value:

```shell
envsubst < bootstrap.yaml > bootstrap_subs.yaml
```

And now, let's apply it:

```shell
kubectl apply -f bootstrap_subs.yaml
```

### Verify the RGD

With the bootstrap resources applied, the controller should fetch the component, then based on the `Resource` the `Deployer` object should apply the RGD
to the cluster. Therefore, we should be able to see a ready to be used rgd:

```shell
kubectl get rgd
NAME        APIVERSION   KIND        STATE   AGE
bootstrap   v1alpha1     Bootstrap           2s
```

### Create an Instance

In order for the RGD's resources to be applied, we need to create an [Instance](https://kro.run/docs/concepts/instances) of this resource.

Create the following instance in `instance.yaml`:

```yaml
apiVersion: kro.run/v1alpha1
kind: Bootstrap
metadata:
  name: bootstrap
```

and then apply it to the cluster:

```shell
kubectl apply -f instance.yaml
```

### Verify the Instance

Now, let's check if our instance succeeded in creating our resources:

```shell
kubectl get bootstrap
NAME        STATE    READY   AGE
bootstrap   ACTIVE   True    4s
```

### Verify Podinfo deployment

Now, we should see a couple of things applied to the cluster. For us now, the two most important objects are the `OCIRepository` and the `HelmRelease`.

```shell
➜ k get ocirepository,helmrelease -owide
NAME                                                             URL                                                                                                          READY   STATUS                                                                                                 AGE
ocirepository.source.toolkit.fluxcd.io/bootstrap-ocirepository   oci://ghcr.io/skarlso/deployment-test-advanced/component-descriptors/ocm.software/ocm-k8s-toolkit/advanced   True    stored artifact for digest 'sha256:565d310746f1fa4be7f93ba7965bb393153a2d57a15cfe5befc909b790a73f8a'   43s

NAME                                                       AGE   READY   STATUS
helmrelease.helm.toolkit.fluxcd.io/bootstrap-helmrelease   43s   True    Helm install succeeded for release default/bootstrap-release.v1 with chart podinfo@6.9.1+565d310746f1
```

This means that the helm release install was successful, and we can observe that indeed, it's fetch the image and the helm chart for podinfo from our own registry.

Let's check on the deployment:

```shell
kubectl get pods -l app.kubernetes.io/name=bootstrap-release-podinfo
NAME                                         READY   STATUS    RESTARTS   AGE
bootstrap-release-podinfo-766446fdd8-j48ch   1/1     Running   0          3m12s
```

## Cleanup

Kro has a very peculiar way of cleaning up. There is a very strict order to it. First, we need to remove the instance and THEN we can remove the bootstrap objects.

```shell
kubectl delete -f instance.yaml
kubectl delete -f bootstrap.yaml
```

## Conclusion

With this now, we have deployed a more complex application in a way that is more akin to a real-world scenario.
Complete with configuration and transfer to a private registry, and setting helm values for our deployment to boot.
