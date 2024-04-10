---
title: "Build & Deploy Infrastructure via Helm Charts with OCM"
description: ""
lead: ""
date: 2024-03-19T10:36:48+01:00
lastmod: 2024-03-19T10:36:48+01:00
draft: false
images: []
weight: 64
toc: true
---

## Introduction

Let's illustrate a very simple "Hello World" example application and show how to leverage OCM to build an application component containing a Helm Chart and an OCI Image and deploy it to a local `kind` k8s cluster.
The topics `ocm` [`localization`](https://ocm.software/docs/guides/complex-component-structure-deployment/#localization) and [`configuration`](https://ocm.software/docs/guides/complex-component-structure-deployment/#configuration) are NOT part of this very simple example and is part of other deep-dive guides.

As base we use the `podinfo` application from Stefan Prodan's [Github repo](https://github.com/stefanprodan/podinfo).
All files can be found [here](https://github.com/open-component-model/ocm-examples).

At the end of the tutorial you will have created one OCM component for your business application `podinfo`.
This component will be composed using the OCM guidelines and consist of several resources, here an OCI image and a Helm chart.

For building multiple components in one shot the ["all-in-one"](../getting-started-with-ocm#all-in-one)
mechanism becomes handy.

### Requirements

* [OCM command line tool](https://github.com/open-component-model/ocm)
* [kubectl](https://kubernetes.io/docs/reference/kubectl/)
* [git](https://git-scm.com/downloads)
* [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
* [flux](https://fluxcd.io/flux/installation/#install-the-flux-cli)

## Building the Application Component using OCM

First we build an OCM component which contains Helm Charts in different kind of formats. This 101 guide explains all possible formats,
but in reality you'll just pick the one most appropiate to you.

### Prepare Helm Charts

We are leveraging Kubernetes deployments which often use Helm charts. The OCM specification supports Helm charts as
an artifact type. For this simple example, we will re-use already existing open source community Helm charts.

The OCM CLI supports referencing Helm charts being stored in an OCI registry. However most
publicly available helm charts currently are available from helm chart repositories and
not from OCI registries. Therefore Helm charts can be embedded in the `component archive` in three different ways.

Reference a Helm Chart from:

1. a public Helm Chart repository
2. local `*.tgz` file
3. local folder containing a Helm Chart file

To demonstrate No. 2. and 3. we need a Helm chart on our local machine. For the sake of the this simplified guide, we download and unpack an already existing open source Helm chart for `podinfo`. In a real world application, this would be your own Helm chart. You will most likely already store your own Helm charts within a `git` repository and leverage a CI/CD pipeline to build `*.tgz` Helm chart files in order to push to your Helm chart repository.

This can easily be achieved with the Helm CLI:

```shell
helm repo add <repo-name> <helm-chart-repo-url>
helm pull --destination <target-dir> <repo-name/chart-name>
```

For the `podinfo` example:

```shell
helm repo add podinfo https://stefanprodan.github.io/podinfo
helm pull --destination . podinfo/podinfo
```

The Helm chart is then stored in the current working directory as `podinfo-6.6.0.tgz` and can be referenced as path from there in the `component-constructor.yaml` file (see below).

Unpack `podinfo-6.6.0.tgz` to simulate the process as if this helm chart is our own and is not downloaded from a public repository:

```shell
tar -czf podinfo-6.6.0.tgz podinfo
```

### Input Specification

The corresponding input file for building the component version ([`component-constructor.yaml`](https://github.com/open-component-model/ocm-examples/tree/main/components/guide-walkthrough-helm-chart/component-constructor.yaml)) looks like:

```yaml
components:
# podinfo component
- name: ${COMPONENT_NAME_PREFIX}/podinfo
  labels:
  - name: "org.opencontainers.image.source"
    value: "https://github.com/stb1337/ocm-hello-world-v1"
  version: ${PODINFO_VERSION}
  provider:
    name: ${PROVIDER}
  resources:
  - name: helm-chart-external
    type: helmChart
    version: ${PODINFO_VERSION}
    access:
      type: helm
      helmChart: podinfo:${PODINFO_CHART_VERSION}
      helmRepository: https://stefanprodan.github.io/podinfo
  - name: helm-chart-local-tgz
    type: helmChart
    input:
      type: helm
      path: podinfo-${PODINFO_CHART_VERSION}.tgz
  - name: helm-chart-local-folder
    type: helmChart
    version: ${PODINFO_VERSION}
    input:
      type: dir
      path: ./podinfo/
  - name: image
    type: ociImage
    version: ${PODINFO_VERSION}
    access:
      type: ociArtifact
      repository: ocm/ocm.software/podinfo/image
      imageReference: ghcr.io/stefanprodan/podinfo:${PODINFO_VERSION}

```

Some frequently changing parameters have been extracted as variables. The OCM CLI uses
templating to fill them with values. The templating mechanism is described
[here](../best-practices-with-ocm#templating-the-resources). For this example
we use the simple (default) template engine type `subst`.

Note the differences between the various components:

### Building the Common Transport Archive (CTF)

From the input file `component-constructor.yaml` the common transport archive can be created with the
OCM CLI. For all variables we need to provide values. Variable values can be passed in the
command line or stored in a file. For many variables having a values file is more convenient.
The corresponding file [`settings.yaml`](https://github.com/open-component-model/ocm-examples/tree/main/components/guide-walkthrough-helm-chart/settings.yaml) may look like this:

```yaml
VERSION: 0.0.1
NAME: ocm-hello-world-v1
COMPONENT_NAME_PREFIX: ocm.software
PROVIDER: stb1337
PODINFO_VERSION: 6.6.0
PODINFO_CHART_VERSION: 6.6.0
```

Create the transport archive then with:

```shell
ocm add componentversions --create --file <ctf-target-dir> --settings settings.yaml component-constructor.yaml
```

```shell
ocm add componentversions --create --file ocm-hello-world --settings settings.yaml component-constructor.yaml
processing component-constructor.yaml...
  processing document 1...
    processing index 1
found 1 component
adding component ocm.software/podinfo:6.6.0...
  adding resource helmChart: "name"="helm-chart-external","version"="6.6.0"...
  adding resource helmChart: "name"="helm-chart-local-tgz","version"="<componentversion>"...
  adding resource helmChart: "name"="helm-chart-local-folder","version"="6.6.0"...
  adding resource ociImage: "name"="image","version"="6.6.0"...
```

You can view the generated component descriptor using the command:

```shell
ocm get component -o yaml <ctf-target-dir>
```

```shell
ocm get component ./ocm-hello-world
COMPONENT            VERSION PROVIDER
ocm.software/podinfo 6.6.0   stb1337
```

You can store the transport archive in an OCI registry (this step needs a proper
configuration of credentials for the OCM CLI):

```shell
ocm transfer ctf -f <ctf-target-dir> <oci-repo-url>
```

```shell
ocm transfer commontransportarchive --copy-resources --enforce --overwrite ./ocm-hello-world OCIRegistry::ghcr.io/stb1337/ocm-hello-world-v1
transferring component "ocm.software/podinfo"...
  transferring version "ocm.software/podinfo:6.6.0"...
INFO[0000] trying next host - response was http.StatusNotFound  host=ghcr.io
INFO[0001] trying next host - response was http.StatusNotFound  host=ghcr.io
  ...resource 0 helm-chart-external[helmChart]...
  ...resource 1 helm-chart-local-tgz[helmChart](ocm.software/podinfo/podinfo:6.6.0)...
  ...resource 2 helm-chart-local-folder[helmChart]...
  ...resource 3 image[ociImage](stefanprodan/podinfo:6.6.0)...
  ...adding component version...

```

Note: Be careful with the `-f` or `--overwrite` flag. This will replace existing component
versions in the OCI registry. During development it is useful being able to overwrite
existing component versions until something is ready for release. **For released versions
you should never use this flag**! Released component versions should be immutable and
should never be overwritten. They serve as source of truth for what the release is made of
und should never be changed.

### Package

Navigate to the overview of your OCI repository, which should list following items:

![alt text](images/github-packages-ocm-hello-world.png)

## Deploying the OCM Software Artifact

Up to now we have created a transport archive containing all required parts (images and Helm charts) for
installing the application. This archive is self-contained and can be transferred to an OCI registry with a single
command from the OCM tooling. After pushing this archive to an OCI registry we have a shared location
that can be used as a source of deployment without any external references. As an alternative you can
transport the archive using offline mechanisms (file transfer, USB-stick) and push it on a target
location in an OCI registry.

To actually deploy the application we need to get access to the Helm charts contained in the archive.
We can use the OCM CLI to retrieve their location. See the [example](#example-1) below.

### Setup Local Kind Cluster

Create local `kind` cluster on your local machine:

```shell
kind create cluster -n ocm-hello-world
```

```shell
kind create cluster -n ocm-hello-world
Creating cluster "ocm-hello-world" ...
 ✓ Ensuring node image (kindest/node:v1.29.2) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-ocm-hello-world"
You can now use your cluster with:

kubectl cluster-info --context kind-ocm-hello-world

Have a question, bug, or feature request? Let us know! https://kind.sigs.k8s.io/#community 🙂
```

Make sure that your current kubectl context is set to "kind-ocm-hello-world":

```shell
kubectl context to "kind-ocm-hello-world"
kubectl cluster-info
Kubernetes control plane is running at https://127.0.0.1:52112
CoreDNS is running at https://127.0.0.1:52112/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

Install Flux:

```shell
flux install
✚ generating manifests
✔ manifests build completed
► installing components in flux-system namespace
CustomResourceDefinition/alerts.notification.toolkit.fluxcd.io created
CustomResourceDefinition/buckets.source.toolkit.fluxcd.io created
CustomResourceDefinition/gitrepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/helmcharts.source.toolkit.fluxcd.io created
CustomResourceDefinition/helmreleases.helm.toolkit.fluxcd.io created
CustomResourceDefinition/helmrepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/kustomizations.kustomize.toolkit.fluxcd.io created
CustomResourceDefinition/ocirepositories.source.toolkit.fluxcd.io created
CustomResourceDefinition/providers.notification.toolkit.fluxcd.io created
CustomResourceDefinition/receivers.notification.toolkit.fluxcd.io created
Namespace/flux-system created
ResourceQuota/flux-system/critical-pods-flux-system created
ServiceAccount/flux-system/helm-controller created
ServiceAccount/flux-system/kustomize-controller created
ServiceAccount/flux-system/notification-controller created
ServiceAccount/flux-system/source-controller created
ClusterRole/crd-controller-flux-system created
ClusterRole/flux-edit-flux-system created
ClusterRole/flux-view-flux-system created
ClusterRoleBinding/cluster-reconciler-flux-system created
ClusterRoleBinding/crd-controller-flux-system created
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

Install OCM controller:

```shell
ocm controller install
► running pre-install check
► installing prerequisites
► installing cert-manager with version v1.13.2
✔ successfully fetched install file
► applying to cluster...
► waiting for ocm deployment to be ready
✔ cert-manager successfully installed
► creating certificate for internal registry
✔ successfully installed prerequisites
► installing ocm-controller with version latest
► got latest version "v0.18.1"
✔ successfully fetched install file
► applying to cluster...
► waiting for ocm deployment to be ready
✔ ocm-controller successfully installed
```

### Inspect component descriptor

Let's assume that we have pushed the transport archive to an OCI registry. We need the identity of the
component version and the location of the component-descriptors in the OCI registry:

ComponentVersion:
name: `ocm.software/podinfo`
version: `6.6.0`

URL of OCI registry: `ghcr.io/stb1337/ocm-hello-world-v1`

It is convenient to put this into an environment variable:

```shell
export OCM_REPO=ghcr.io/stb1337/ocm-hello-world-v1
```

Getting the component version 6.6.0 of the application with the OCM CLI:

```shell
ocm get componentversion --repo OCIRegistry::${OCM_REPO} ocm.software/podinfo:6.6.0 -o yaml
```

```yaml
---
component:
  componentReferences: []
  creationTime: "2024-03-21T15:55:18Z"
  labels:
  - name: org.opencontainers.image.source
    value: https://github.com/stb1337/ocm-hello-world-v1
  name: ocm.software/podinfo
  provider: stb1337
  repositoryContexts:
  - baseUrl: ghcr.io
    componentNameMapping: urlPath
    subPath: stb1337/ocm-hello-world-v1
    type: OCIRegistry
  resources:
  - access:
      localReference: sha256:cf9318c4944f733f8ce925ca0b818cdae638dce4107a13c3395984bb86306c4b
      mediaType: application/vnd.cncf.helm.chart.content.v1.tar+gzip
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: cf9318c4944f733f8ce925ca0b818cdae638dce4107a13c3395984bb86306c4b
    name: helm-chart-external
    relation: external
    type: helmChart
    version: 6.6.0
  - access:
      imageReference: ghcr.io/stb1337/ocm-hello-world-v1/ocm.software/podinfo/podinfo:6.6.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: fa473086ce82810801785ec4ab70763fa81fcd971082035906a1695b9014c019
    name: helm-chart-local-tgz
    relation: local
    type: helmChart
    version: 6.6.0
  - access:
      localReference: sha256:8ff0604bfaebe6791ac4285c38a9f02771452497530367eeae49f1cf8594ca4c
      mediaType: application/x-tar
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 8ff0604bfaebe6791ac4285c38a9f02771452497530367eeae49f1cf8594ca4c
    name: helm-chart-local-folder
    relation: local
    type: helmChart
    version: 6.6.0
  - access:
      localReference: sha256:4a05cbc915a171301efdaad863d7d1bb0bc9193730767eca9385c49361956863
      mediaType: application/x-tgz
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 4a05cbc915a171301efdaad863d7d1bb0bc9193730767eca9385c49361956863
    name: manifests
    relation: local
    type: dir
    version: 6.6.0
  - access:
      imageReference: ghcr.io/stb1337/ocm-hello-world-v1/stefanprodan/podinfo:6.6.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: c04843c796025fbaa2574344994cb2461041b5e1d6b7a0de76b2b9fa46318e08
    name: image
    relation: external
    type: ociImage
    version: 6.6.0
  sources: []
  version: 6.6.0
meta:
  schemaVersion: v2
```

With this we can drill down to the installable Helm charts and the container images:

```shell
ocm get resource --repo OCIRegistry::${OCM_REPO} ocm.software/podinfo:6.6.0 -o wide
NAME                    VERSION IDENTITY TYPE      RELATION ACCESSTYPE  ACCESSSPEC
helm-chart-external     6.6.0            helmChart external localBlob   {"localReference":"sha256:cf9318c4944f733f8ce925ca0b818cdae638dce4107a13c3395984bb86306c4b","mediaType":"application/vnd.cncf.helm.chart.content.v1.tar+gzip"}
helm-chart-local-folder 6.6.0            helmChart local    localBlob   {"localReference":"sha256:8ff0604bfaebe6791ac4285c38a9f02771452497530367eeae49f1cf8594ca4c","mediaType":"application/x-tar"}
helm-chart-local-tgz    6.6.0            helmChart local    ociArtifact {"imageReference":"ghcr.io/stb1337/ocm-hello-world-v1/ocm.software/podinfo/podinfo:6.6.0"}
image                   6.6.0            ociImage  external ociArtifact {"imageReference":"ghcr.io/stb1337/ocm-hello-world-v1/stefanprodan/podinfo:6.6.0"}
```

### Apply k8s manifest

Create file [`k8s-component-version/01-pod-info-kind.yaml`](https://github.com/open-component-model/ocm-examples/tree/main/kubernetes/guide-walkthrough-helm-chart/01-pod-info-kind.yaml) with following content:

```yaml
#k8s-component-version/01-pod-info-kind.yaml
kind: ComponentVersion
metadata:
  name: ocm-hello-world-podinfo
  namespace: ocm-system
spec:
  component: ocm.software/podinfo
  interval: 10s
  references:
    expand: true
  repository:
    url: ghcr.io/stb1337/ocm-hello-world-v1
    secretRef:
      name: ghcr-pull-secret
  version:
    semver: "6.6.0"
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: ocm-hello-world-podinfo-helm-chart-external
  namespace: ocm-system
spec:
  interval: 10s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: ComponentVersion
    name: ocm-hello-world-podinfo
    namespace: ocm-system
    resourceRef:
      name: helm-chart-external
      version: "6.6.0"
      extraIdentity:
        helmChart: podinfo
---
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: ocm-hello-world-podinfo-helm-chart-external
  namespace: ocm-system
spec:
  interval: 10s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Resource
    name: ocm-hello-world-podinfo-helm-chart-external
  helmReleaseTemplate:
    chart:
      spec:
        chart: "podinfo"
        interval: 10s
    values:
      replicaCount: 3
      image:
        repository: ghcr.io/stb1337/ocm-hello-world-v1/stefanprodan/podinfo
      ui:
        color: "#8F00FF"
        message: "Hello from remote referenced Helm Chart"
      serviceAccount:
        enabled: true
        name: "sa-podinfo-ghcr-io-1"
        imagePullSecrets:
        - name: pull-secret
    interval: 10s
    releaseName: "podinfo-helm-chart-external"
    targetNamespace: default
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: ocm-hello-world-podinfo-helm-chart-local-tgz
  namespace: ocm-system
spec:
  interval: 10s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: ComponentVersion
    name: ocm-hello-world-podinfo
    namespace: ocm-system
    resourceRef:
      name: helm-chart-local-tgz
      version: "6.6.0"
      extraIdentity:
        helmChart: podinfo # name of the chart
---
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: ocm-hello-world-podinfo-helm-chart-local-tgz
  namespace: ocm-system
spec:
  interval: 10s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Resource
    name: ocm-hello-world-podinfo-helm-chart-local-tgz
  helmReleaseTemplate:
    chart:
      spec:
        chart: "podinfo"
        interval: 10s
    values:
      replicaCount: 2
      image:
        repository: ghcr.io/stb1337/ocm-hello-world-v1/stefanprodan/podinfo
      ui:
        color: "#FFC0CB"
        message: "Hello from local .tar file Helm Chart"
      serviceAccount:
        enabled: true
        name: "sa-podinfo-ghcr-io-2"
        imagePullSecrets:
        - name: pull-secret
    interval: 10s
    releaseName: "podinfo-helm-chart-local-tgz"
    targetNamespace: default
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: ocm-hello-world-podinfo-image
  namespace: ocm-system
spec:
  interval: 10s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: ComponentVersion
    name: ocm-hello-world-podinfo
    namespace: ocm-system
    resourceRef:
      name: image
      version: "6.6.0"
```

Create two k8s secrets in order for OCM and k8s to pull from your private OCI registry:

```shell
export GITHUB_USER=.. && export GITHUB_TOKEN=ghp_.... && export GITHUB_USER_EMAIL=steffen....

kubectl create secret docker-registry pull-secret -n default \
    --docker-server=ghcr.io \
    --docker-username=$GITHUB_USER \
    --docker-password=$GITHUB_TOKEN \
    --docker-email=$GITHUB_USER_EMAIL

kubectl create secret generic ghcr-pull-secret -n ocm-system \
    --from-literal=username=$GITHUB_USER \
    --from-literal=password=$GITHUB_TOKEN
```

Apply the manifest to your local `kind` cluster:

```shell
k apply -f k8s-component-version/01-pod-info-kind.yaml
componentversion.delivery.ocm.software/ocm-hello-world-podinfo created
resource.delivery.ocm.software/ocm-hello-world-podinfo-helm-chart-external created
fluxdeployer.delivery.ocm.software/ocm-hello-world-podinfo-helm-chart-external created
resource.delivery.ocm.software/ocm-hello-world-podinfo-helm-chart-local-tgz created
fluxdeployer.delivery.ocm.software/ocm-hello-world-podinfo-helm-chart-local-tgz created
resource.delivery.ocm.software/ocm-hello-world-podinfo-image created
```

```shell
kubectl port-forward service/podinfo-helm-chart-external -n default 9898:9898
Forwarding from 127.0.0.1:9898 -> 9898
Forwarding from [::1]:9898 -> 9898
Handling connection for 9898
```

![alt text](images/guide-helm-charts-hello-world.png)

```shell
kubectl port-forward service/podinfo-helm-chart-local-tgz -n default 9898:9898
Forwarding from 127.0.0.1:9898 -> 9898
Forwarding from [::1]:9898 -> 9898
Handling connection for 9898
```

![alt text](images/guide-helm-charts-hello-world-2.png)
