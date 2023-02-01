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

This tutorial will demonstrate how to get started with the Open Component Model & Flux.

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

Don't worry if some of the terminologies are unfamiliar at this point, we will introduce concepts and terminology as we go.

### Setting up our project

For setting up the component archive that we are going to use, we will follow the [All In One](https://github.com/open-component-model/ocm-spec/blob/main/doc/scenarios/getting-started/README.md#all-in-one) guide located in the ocm-spec
repository.

Let's configure a workspace for developing our component:

`mkdir podinfo-component && cd $_`

Create a folder for all manifest files that we are going to add later.

`mkdir manifests`

The following command will generate a simple deployment file for podinfo:
```shell
cat > ./manifests/deployment.yaml << EOF
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

Create a `config.yaml` which will contain our `ConfigData` information:

```shell
cat > config.yaml << EOF
apiVersion: config.ocm.software/v1alpha1
kind: ConfigData
metadata:
  name: ocm-config
localization:
  - name: image
    file: deployment.yaml
    image: spec.template.spec.containers[0].image
    resource:
      name: image
EOF
```

Now, let's create the component archive that we will sign and transfer:

```yaml
components:
- name: github.com/acme/podinfo
  version: "v1.0.0"
  provider:
    name: acme.org
  resources:
    - name: deployment
      type: Directory
      input:
        type: dir
        path: "manifests"
        compress: true
    - name: config
      type: PlainText
      input:
        type: file
        path: "config.yaml"
        compress: true
    - name: image
      type: ociImage
      version: "v6.2.0"
      access:
        type: ociArtifact
        imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
```

This component definition contains three resources. The manifests folder which contains our `deployment.yaml` file. The
ConfigData which we will use to configure the deployment. And the Image resource that we will use to replace the image
with in our deployment.

Run the following to create our archive:

```shell
ocm add componentversions --create --file ./component-archive components.yaml
```

This will create the following structure:

```shell
tree .
.
├── artifact-index.json
└── blobs
    ├── sha256.02d83912824282e51b4d262af69774a789afdf01e46de6569bf17086ec51d386
    ├── sha256.120bcfa0c813790b6eee51e7cd853f207ab07df7530092fdc8e91630615a1cc1
    ├── sha256.1f4e9d5fb65d6e56bfb445b24abe91bebd593c880b986bca6715d0b4120bad54
    ...
```

### Inspecting Components

Now if we inspect the resources associated with our component we can see the file resource is present with its name `deployment`:

```shell
➜  ocm get resources ./component-archive
NAME       VERSION IDENTITY TYPE      RELATION
config     v1.0.0           PlainText local
deployment v1.0.0           Directory local
image      v6.2.0           ociImage  external
```

We can also inspect the generated `component-descriptor.yaml` file:

```
cat component-archive/blobs/sha256.1f4e9d5fb65d6e56bfb445b24abe91bebd593c880b986bca6715d0b4120bad54
component-descriptor.yaml0000000000000000000000000000151014163714600014267 0ustar0000000000000000component:
  componentReferences: []
  name: github.com/acme/podinfo
  provider: acme.org
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256:54d5cf2cfd49bbae10c65717c8de0a6f15301407de79082a06049a80fcdb8e1c
      mediaType: application/x-tgz
      type: localBlob
    name: deployment
    relation: local
    type: Directory
    version: v1.0.0
  - access:
      localReference: sha256:e2e48344b234e068c2d8fcc5e2fa162d488ffb4127d757f9a7fded8ca8b15fd6
      mediaType: application/gzip
      type: localBlob
    name: config
    relation: local
    type: PlainText
    version: v1.0.0
  - access:
      imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
      type: ociArtifact
    name: image
    relation: external
    type: ociImage
    version: v6.2.0
  sources: []
  version: v1.0.0
meta:
  schemaVersion: v2
```

Now our component is ready to be shipped. In the next section, we shall examine how to securely transfer our component to a remote repository.

## Shipping the component

To deliver our component, we have several options. In this introductory guide, will we deliver the component to an OCI repository. The OCM cli will pickup credentials from the default docker credentials chain, so we can get started by logging into our registry of choice (in this case GitHub container registry, `ghcr.io`):

`echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin`

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

```
➜  kind create cluster
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.25.3) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-kind"
You can now use your cluster with:

kubectl cluster-info --context kind-kind

Not sure what to do next? 😅  Check out https://kind.sigs.k8s.io/docs/user/quick-start/
```

The above command will create a cluster with the name `kind`. To see if it's up and running, execute:

```
➜  kind get clusters
kind
```

### Bootstrapping Flux

Flux requires a git repository. Select a different folder and create an empty git repository with the following commands:

```shell
git init
# use gh to create and clone a fresh repository
gh repo create podinfo-flux-repo --public --source=.
mkdir -p ./clusters/kind && touch ./clusters/kind/.keep
mkdir ./components  && touch ./components/.keep
git add .
git commit -am 'project setup'
git push -u origin main
```

With all this in place, it's time to bootstrap flux:

```shell
export GITHUB_REPOSITORY=podinfo-flux-repo
flux bootstrap github --owner $GITHUB_USER --repository $GITHUB_REPOSITORY --path ./clusters/kind --personal
```

This command will generate a `GitRepository` object that has the content of the repository reconciled.
The name of that object is `flux-system`, but to make sure, let's list it.

```shell
k get gitrepository -n flux-system
NAME          URL                                              AGE   READY   STATUS
flux-system   ssh://git@github.com/Skarlso/podinfo-component   38s   True    stored artifact for revision 'main/5d1f0e79f8f46d704d0d68985f26f210d48ce656'
```

We will reference this resource as a `sourceRef` object in our Kustomization.

Flux will install some resources in the cluster and commit manifests to our repository so that it can manage itself.
Once Flux has finished bootstrapping we should ensure our local git tree is in sync with the remote:

`git pull`

We'll use a Kustomization to reconcile any resources found in the `./components` directory:

```shell
cat > ./clusters/kind/components_kustomization.yaml <<EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: components
  namespace: flux-system
spec:
  interval: 1m0s
  prune: true
  targetNamespace: ocm-system
  sourceRef:
    kind: GitRepository
    name: flux-system
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
    --docker-username=$GITHUB_USER \
    --docker-password=$GITHUB_TOKEN \
    --docker-email=$GITHUB_EMAIL

kubectl create secret generic -n ocm-system creds --from-literal=username=$GITHUB_USER --from-literal=password=$GITHUB_TOKEN

# This must be executed in the folder in which this key is located in. Since this is the public key
# it would also be safe to add it to the flux repository.
kubectl create secret generic -n ocm-system alice-publickey --from-file=alice=rsa.pub
```

> **note** Currently we require OCI registry credentials to be configured twice, this is a known issue and will be resolved in a future update to the ocm-controller

Choose a different folder and clone ocm-controller.

```shell
gh repo clone open-component-model/ocm-controller
cd ocm-controller
make deploy
```

### Reconciling Components

Next up we create a `ComponentVersion` custom resource to reconcile the component from the registry:

```shell
cat > ./components/componentversion.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 10m0s
  component: github.com/acme/podinfo
  version:
    semver: v1.0.0
  repository:
    url: ghcr.io/$GITHUB_USER
    secretRef:
      name: creds
  verify:
  - name: alice
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
kubectl get componentversion podinfo -n ocm-system
NAME      AGE
podinfo   48s
```

To follow what the ocm-controller does, you can view and tail the log of the controller like this:

```
kubectl logs `k get pods --template '{{range .items}}{{.metadata.name}}{{end}}' --selector=app=ocm-controller -n ocm-system` -n ocm-system -f
```

We'll use the `Resource` custom resource to extract the deployment manifests from our component:

```shell
cat > ./components/resource.yaml <<EOF
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
EOF
```

Commit this file to git and follow the push and reconcile pattern seen previously.

If everything was write, the `ocm-controller`'s log should have something along these lines:

```log
1.6747462557628431e+09  INFO    resource-controller     successfully reconciled resource        {"controller": "resource", "controllerGroup": "delivery.ocm.software", "controllerKind": "Resource", "Resource": {"name":"podinfo-deployment","namespace":"ocm-system"}, "namespace": "ocm-system", "name": "podinfo-deployment", "reconcileID": "930c97a5-7e8c-40f6-96ce-47dae431ed9f", "name": "podinfo-deployment"}
1.6747462557649686e+09  INFO    snapshot-reconcile      reconciling snapshot    {"controller": "snapshot", "controllerGroup": "delivery.ocm.software", "controllerKind": "Snapshot", "Snapshot": {"name":"podinfo-deployment","namespace":"ocm-system"}, "namespace": "ocm-system", "name": "podinfo-deployment", "reconcileID": "ee0de303-0093-40f0-8c70-960c4dfdaef4"}
1.6747462557711875e+09  INFO    snapshot-reconcile      reconciling snapshot    {"controller": "snapshot", "controllerGroup": "delivery.ocm.software", "controllerKind": "Snapshot", "Snapshot": {"name":"podinfo-deployment","namespace":"ocm-system"}, "namespace": "ocm-system", "name": "podinfo-deployment", "reconcileID": "3a9cac44-b7bd-40fb-8a25-12813a4ce637"}
```

When the resource has been created, we'll find a new snapshot in the cluster:

```shell
kubectl get snapshot podinfo-deployment -n ocm-system
NAME                 AGE
podinfo-deployment   49s
```


A `Snapshot` is a Flux compatible OCI image that's stored in a OCI-registry managed by the OCM controller. It allows us to transform resources from a component and to deploy them with flux.

**Optionally**:
You can verify that the snapshot contains the right resource using [crane](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane.md). Since our registry is a simple OCI registry, crane can interact with it.
To fetch the resource, follow these steps:
```shell
# in a separate terminal
kubectl port-forward service/registry -n ocm-system 5000:5000

# describe the snapshot to get the blob information
kubectl describe snapshot podinfo-deployment -n ocm-system | grep "Repository URL:"
  Repository URL:          http://registry.ocm-system.svc.cluster.local:5000/sha-4706289924494659704@sha256:fbeceb866f8f2096e44daf8801349dad233e7c7e20b77872d9e54b0bcb1c03e5

# replace the service name with 127.0.0.1:5000 and fetch the resource data.
crane blob 127.0.0.1:5000/sha-4706289924494659704@sha256:fbeceb866f8f2096e44daf8801349dad233e7c7e20b77872d9e54b0bcb1c03e5 > blob.tar

tar xf blob.tar
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
```

One type of transformation we can apply is to set the correct image URL in our deployment manifests based on the location of a component resource. This becomes particularly important if we are working in a heavily regulated or air-gapped environment. We call this process of configuring the component for a local environment **localization**.

To perform this operation, we will process the `Snapshot` that has been created by the `Resource` and merge it with configuration rules supplied via the `ConfigData` object we added to our component in an earlier step. All of this is done with a `Localization` custom resource:

```shell
cat > ./components/localization.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 1m0s
  componentVersionRef:
    name: podinfo
    namespace: ocm-system
  source:
    sourceRef:
      kind: Snapshot
      name: podinfo-deployment
      namespace: ocm-system
  configRef:
    resource:
      resourceRef:
        name: config
  snapshotTemplate:
    name: podinfo-deployment-localized
    createFluxSource: true
EOF
```
_Note_: `createFluxSource` will automatically create a matching `OCIRepository` which Flux can automatically consume.
To check if the `OCIRepository` has been created run `kubectl get ocirepositories -n A`.

Commit, push and reconcile the `Localization` custom resource. Once it has done its thing, we should see two snapshots:

```shell
$ kubectl get snapshots -n ocm-system

NAME                            AGE
podinfo-deployment              5m20s
podinfo-deployment-localized    1m2s
```

Optionally, you can verify the content of the localized snapshot using crane as before. It should look something like this:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: podinfo
  name: podinfo
  namespace: default
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
      - image: ghcr.io/stefanprodan/podinfo:6.2.0
        name: podinfo
        ports:
        - containerPort: 9898
          name: http
```

`Localization` is the only transformation step we will perform in this simple scenario. For now let's move on and create a couple of Flux manifests so that we can apply the contents of our `Snapshot` to the cluster:

### Consuming `Snapshots` via Flux

Since, on the previous step, we used `createFluxSource` the `OCIRepository` object already exists. Now, we just have to
create a `Kustomization` object to consume that repository.

```shell
cat > ./components/oci_kustomization.yaml <<EOF
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: podinfo
  namespace: flux-system
spec:
  interval: 1m0s
  prune: true
  targetNamespace: default
  sourceRef:
    kind: OCIRepository
    name: podinfo-deployment-localized
  path: ./
EOF
```

Now we commit this file, push and wait for Flux to reconcile the localized podinfo application.

```shell
git add ./components/oci_kustomization.yaml
git commit -m "add flux manifests to podinfo component"
git push

flux reconcile source git flux-system

kubectl get deployment podinfo -n default
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
podinfo   1/1     1            1           2m54s
```

## Wrapping Up

That's it for our introductory tutorial on OCM and Flux. We shall cover more advanced scenarios in future guides.
