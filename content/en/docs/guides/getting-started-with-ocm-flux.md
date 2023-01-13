---
title: "Getting Started with Flux & OCM"
description: "Deploying OCM components using Flux"
lead: ""
date: 2022-11-23T10:00:00+00:00
lastmod: 2022-11-23:00:00+00:00
draft: false
images: []
menu:
  docs:
    parent: ""
    identifier: "getting-started-with-flux-ocm"
weight: 101
toc: true
---

## Introduction

This tutorial will demonstrate how get started with the Open Component Model & Flux.

We shall build a component to deliver the [`podinfo`](https://github.com/stefanprodan/podinfo) application, which we will then deploy using OCM's Flux integration. Along the way, we'll demonstrate some of the useful features of OCM.

## Table of content
- [Requirements](#requirements)
- [Building the component](#building-the-component)
  - [The shape of things to come](#the-shape-of-things-to-come)
  - [Setting up our project](#setting-up-our-project)
  - [Adding resources](#adding-resources)
  - [Inspecting Components](#inspecting-components)
- [Shipping the component](#shipping-the-component)
  - [Signing](#signing)
  - [Verification](#verification)
  - [Transferring](#transferring)
- [Deploying the component](#deploying-the-component)
  - [Bootstrapping Flux](#bootstrapping-flux)
  - [Deploying the OCM Controller](#deploying-the-ocm-controller)
  - [Reconciling Components](#reconciling-components)
  - [Consuming `Snapshots` via Flux](#consuming-snapshots-via-flux)
- [Wrapping Up](#wrapping-up)

## Requirements

- [OCM command line tool](https://github.com/open-component-model/ocm)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [git](https://git-scm.com/downloads)
- [gh](https://github.com/cli/cli)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [flux](https://fluxcd.io/flux/installation/#install-the-flux-cli)


## Building the component

### The shape of things to come

Our component will consist of three resources:
- podinfo OCI image
- Kubernetes manifest to create a podinfo deployment
- configuration to enable updating our deployment using information from the OCM component descriptor

Don't worry if some of the terminology is unfamiliar at this point, we will introduce concepts and terminology as we go.

### Setting up our project

Let's configure a workspace for developing our component:

`mkdir podinfo-component && cd $_`

OCM will store local artifacts and metadata in a **component archive**. We can use the `ocm` CLI to create the component archive:
`ocm create componentarchive github.com/acme/podinfo v1.0.0 --provider acme`

As we can see above, the command `ocm create componentarchive` takes three parameters: the name of our component, it's version and the name of the component provider.

If we now examine the contents of our working directory, we can see that a new sub-directory has been created for the component archive:

```shell
$ tree .
.
└── component-archive
    ├── blobs
    └── component-descriptor.yaml

2 directories, 1 files
```

This archive contains a directory for the blobs of local artifacts that we add to our component and a `component-descriptor.yaml` file. The component descriptor is a metadata file that holds information describing the entire surface of our component.

If we examine the file now we will see that it is empty apart from the basic metadata about our component; let's fix that.

### Adding resources

`Resources` are an OCM concept that defines artifacts which are necessary to deploy our software. These artifacts can be things like OCI images, binaries, Helm charts, local files or directries, and so on.

To add our podinfo OCI image, we need to create a resource file describing the resource and how to access it:

```shell
cat > image_resource.yaml << EOF
name: image
version: v6.2.0
type: ociImage
relation: external
access:
  type: ociArtifact
  imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
EOF
```

With this file, we can use the ocm CLI to store the resource information in our component archive:

`ocm add resource ./component-archive image_resource.yaml`

Let's use the ocm CLI to verify that the resource has been successfully added:

```shell
$ ocm get resources ./component-archive

NAME  VERSION IDENTITY TYPE     RELATION
image v6.2.0           ociImage external
```

Now that we've successfully added an external resource, it's time to add something from the local filesystem.

The following command will generate a simple deployment file for podinfo:
```shell
cat > deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: podinfo
  namespace: default
  labels:
    app: podinfo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: podinfo
  template:
    metadata:
      labels:
        app: podinfo
    spec:
      containers:
      - image: noimage:v0.0.0 # we'll use localization later to correctly specify the image
        name: podinfo
        ports:
        - containerPort: 9898
          name: http
EOF
```

```shell
cat > deployment_resource.yaml << EOF
name: deployment
version: v1.0.0
type: localBlob
input:
  type: file
  path: ./deployment.yaml
  compress: true
EOF
```

Again, we can use the ocm CLI to add the resource information in our component archive, just as we did above when we added the image:

`ocm add resource ./component-archive deployment_resource.yaml`

### Inspecting Components

Now if we inspect the resources associated with our component we can see the file resource is present with its name `deployment`:

```shell
$ ocm get resources ./component-archive

NAME       VERSION IDENTITY TYPE     RELATION
deployment v1.0.0           file     local
image      v6.2.0           ociImage external
```

Additionally, if we examine the blobs directory we can see that our local file is now present here also:

```shell
tree .
.
├── component-archive
│   ├── blobs
│   │   └── sha256.9d0f28a66f76a31d5d21ac96eb8d0ce34544e8804eaf5288cd43624467a25fef
│   └── component-descriptor.yaml
├── deployment.yaml
├── deployment_resource.yaml
└── image_resource.yaml

2 directories, 5 files
```

And if we examine the blob itself further we can see that it in fact contains our content (the deployment.yaml):

```
$ cat ./component-archive/blobs/sha256.9d0f28a66f76a31d5d21ac96eb8d0ce34544e8804eaf5288cd43624467a25fef | gzip -d

apiVersion: apps/v1
kind: Deployment
metadata:
  name: podinfo
  labels:
    app: podinfo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: podinfo
  template:
    metadata:
      labels:
        app: podinfo
    spec:
      containers:
      - image: noimage:v0.0.0 # we'll use localization later to correctly specify the image
        name: podinfo
        ports:
        - containerPort: 9898
          name: http
```

Finally, we will add a configuration file that will be used when we deploy our application in Kubernetes:

Create the config file:
```
cat > config.yaml << EOF
apiVersion: config.ocm.software/v1alpha1
kind: ConfigData
metadata:
  name: ocm-config
localization:
- resource:
    name: image
    file: deployment.yaml
    image: spec.template.spec.containers[0].image
EOF
```

Create the resource file:
```shell
cat > config_resource.yaml << EOF
name: config
version: v1.0.0
type: localBlob
input:
  type: file
  path: ./config.yaml
  compress: true
EOF
```

Add the resource to the component archive:
`ocm add resource ./component-archive config_resource.yaml`

Now let's examine the final component:

```shell
$ ocm get resources ./component-archive

NAME       VERSION IDENTITY TYPE     RELATION
config     v1.0.0           file     local
deployment v1.0.0           file     local
image      v6.2.0           ociImage external
```

Now our component is ready to be shipped. In the next section, we shall examine how to securely transfer our component to a remote repository.

## Shipping the component

To deliver our component, we have a number of options. In this introductory guide, will we deliver the component to an OCI repository. The OCM cli will pickup credentials from the default docker credentials chain, so we can get started by logging into our registry of choice (in this case GitHub container registry, `ghcr.io`):

`echo $GITHUB_PAT_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin`

### Signing

To ensure our component is securely delivered, we can use OCM's signing features. To get started quickly, OCM cli can generate signing keys for us (but we could also bring our own):

`ocm create rsakeypair`

This will create a public and private key (by default named `rsa.priv` and `rsa.pub`) in our working directory.

We can sign our component using these keys. OCM allows for multiple signers so we provide a name using the `--signature` flag to identify our signature.

`ocm sign component --signature alice --private-key rsa.priv --public-key rsa.pub ./component-archive`

### Verification

We can also verify the component using the ocm CLI:

`ocm verify component -s alice -k rsa.pub ./component-archive`

### Transferring

Now  we can transfer our component to an OCI repository:

`ocm transfer component ./component-archive ghcr.io/$GITHUB_USER`

Now that our component has been transferred, let's verify the signatures once again, this time using the remote OCM repository:

`ocm verify component -s alice -k rsa.pub --repo ghcr.io/$GITHUB_USER github.com/acme/podinfo`

## Deploying the component

We'll deploy our component on a Kind cluster using Flux.

First of all, let's create the cluster:

`kind`

### Bootstrapping Flux

Flux requires a git repository, so let's configure our working directory as a git repository:

```shell
git init
echo rsa.priv >> .gitignore
mkdir ./clusters && touch ./clusters/kind/.keep
mkdir ./components  && touch ./components/.keep
git add .gitignore ./clusters/kind/ ./components
git commit -m "project setup"
```

We can use the `gh` cli to quickly initialise a GitHub repository:

`gh repo create`

With all this in place, it's time to bootstrap flux:

`flux bootstrap github --owner $GITHUB_USER --repository $GITHUB_REPOSITORY --path ./clusters/kind --personal`

Flux will install some resources in the cluster and commit manifests to our repository so that it can manage itself. Once Flux has finished bootstrapping we should ensure our local git tree is in sync with the remote:

`git pull`

We'll use a Kustomization to reconcile any resources found in the `./components` directory:

```shell
echo > ./clusters/kind/components_kustomization.yaml <<EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: components
  namespace: ocm-system
spec:
  interval: 1m0s
  prune: true
  targetNamespace: default
  sourceRef:
    kind: OCIRepository
    name: podinfo
  path: ./components
EOF
```

Create this file, then commit, push and ensure Flux has reconciled the resource:

```shell
git add ./clusters/kind/components_kustomization.yaml
git commit -m "add components kustomization"
git push

# trigger an immediate reconciliation of our repo
flux reconcile source git flux-system

# view kustomizations and their status
flux get kustomizations
```

### Deploying the OCM Controller

We'll use the OCM controller to help manage the lifecycle of an application with GitOps. Here is a diagram outlining what we will be building:

![Architecture](/images/getting-started-flux-figure-1.png)

The items outlined in purple and green are the resources we will create using GitOps; everything else shall be generated automatically for us.

The controller requires a few secrets in order to retrieve components from our OCI registry and to verify component signatures, let's set those up first:

```shell
kubectl create ns ocm-system

kubectl create secret docker-registry -n ocm-system regcred \
    --docker-server=ghcr.io \
    --docker-username=$GITHUB_USER
    --docker-password=$GITHUB_PAT \
    --docker-email=$GITHUB_USER_EMAIL

kubectl create secret generic -n ocm-system creds --from-literal=username=$GITHUB_USER --from-literal=password=$GITHUB_PAT

kubectl create secret generic -n ocm-system alice-publickey --from-file=alice=rsa.pub
```

> **note** Currently we require OCI registry credentials to be configured twice, this is a known issue and will be resolved in a future update to the ocm-controller

```
gh repo clone open-component-model/ocm-controller
cd ocm-controller
make deploy
```

### Reconciling Components

Next up we create a `ComponentVersion` custom resource in order to reconcile the component from the registry:

```
echo > ./components/componentversion.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 10m0s
  name: github.com/acme/podinfo
  version: v1.0.0
  repository:
    url: ghcr.io/$GITHUB_USER
    secretRef:
      name: creds
  verify:
  - name: phoban01
    publicKey:
      secretRef:
        name: alice-publickey
EOF
```

Again after creating the file, we commit, push and ensure Flux has reconciled the resource:

```shell
git add ./components/componentversion.yaml
git commit -m "add componentversion"
git push

# trigger an immediate reconciliation of our repo
flux reconcile source git flux-system

# view the componentversion
kubectl get componentversion podinfo
```

We'll use the `Resource` custom resource to extract the deployment manifests from our component:

```
echo > ./components/resource.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: podinfo-deployment
  namespace: ocm-system
spec:
  interval: 10m0s
  componentVersionRef:
    name: podinfo
    namespace: ocm-system
  resource:
    name: deployment
  snapshotTemplate:
    name: podinfo-deployment
    tag: latest
EOF
```

Commit this file to git and follow the push and reconcile pattern seen previously.

When the resource has been created, we'll find a new snapshot in the cluster:

`kubectl get snapshot podinfo-deployment`

A `Snapshot` is a Flux compatible OCI image that's stored in a OCI-registry managed by the OCM controller. It allows us to transform resources from a component and to deploy them with flux.

One type of transformation we can apply is to set the correct image url in our deployment manifests based on the location of a component resource. This becomes particularly important if we are working in a heavily regulated or air-gapped environment. We call this process of configuring the component for a local environment **localization**.

To perform this operation, we will process the `Snapshot` that has been created by the `Resource` and merge it with configuration rules supplied via the `ConfigData` object we added to our component in an earlier step. All of this is done with a `localization`custom resource:

```

echo > ./components/localization.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 1m0s
  sourceRef:
    kind: Snapshot
    name: podinfo-deployment
    namespace: ocm-system
  configRef:
    componentVersionRef:
      name: podinfo
      namespace: ocm-system
    resource:
      name: config
  snapshotTemplate:
    name: podinfo-deployment-localized
    tag: latest
EOF
```

Commit, push and reconcile the `Localization` custom resource. Once it has done it's thing, we should see two snapshots:

```shell
$ kubectl get snapshots

NAME                            AGE
podinfo-deployment              5m20s
podinfo-deployment-localized    1m2s
```

`Localization` is the only transformation step we will perform in this simple scenario. For now let's move on and create a couple of Flux manifests so that we can apply the contents of our `Snapshot` to the cluster:

### Consuming `Snapshots` via Flux

We'll create a Flux `OCIRepository` in order to retrieve the snapshot from the in-cluster registry:

```
echo > ./components/ocirepo.yaml <<EOF
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: OCIRepository
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 1m0s
  url: oci://registry.ocm-system.svc.cluster.local/snapshots/podinfo-deployment-localized
  insecure: true
  ref:
    tag: latest
EOF
```

Then we will create a Flux `Kustomization` to apply the contents of the snapshot to the cluster:

```
echo > ./components/kustomization.yaml <<EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 1m0s
  prune: true
  targetNamespace: default
  sourceRef:
    kind: OCIRepository
    name: podinfo
  path: ./
EOF
```

Now we commit these two files, push and wait for Flux to reconcile the localized podinfo application.

```shell
git add ./components/ocirepo.yaml ./components/kustomization.yaml
git commit -m "add flux manifests to podinfo component"
git push

flux reconcile source git flux-system

kubectl get deployment podinfo -n default
```

## Wrapping Up

That's it for our introductory tutorial on OCM and Flux. We shall cover more advanced scenarios in future guides.
