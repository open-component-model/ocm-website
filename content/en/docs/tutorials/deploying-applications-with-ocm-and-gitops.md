---
title: "Deploying Applications with OCM & GitOps"
description: "Deploying Applications with OCM & GitOps"
lead: ""
date: 2022-11-23T10:00:00+00:00
lastmod: 2022-11-23:00:00+00:00
draft: false
images: []
weight: 66
toc: true
---

## Introduction

This tutorial will demonstrate how to get started deploying applications using the Open Component Model & Flux.

In this guide we will leverage Flux and the `ocm-controller` to deploy an existing component to a Kubernetes cluster. Specifically, we will deploy the `phoban.io/podinfo` component that contains the resources needed to launch the [podinfo](https://github.com/stefanprodan/podinfo) application.

Here's a diagram showing what we'll be building:

![deploy-applications-with-gitops](/images/deploy-applications-diagram.png)

As you can see we'll add some manifests to a git repository that will be deployed by Flux. These will, in turn, deploy a resource from an OCM repository, in this case, a `Deployment` of the `podinfo` microservice.

If you'd like to learn how to build a component then checkout our getting started guide [here](/docs/guides/getting-started-with-ocm)

## Table of contents
- [Requirements](#requirements)
- [Setup the Environment](#setup-the-environment)
- [Deploy the OCM Controller](#deploy-the-ocm-controller)
- [Deploy the Component](#deploy-the-component)
- [Wrapping Up](#wrapping-up)

### Requirements

- [OCM command line tool](https://github.com/open-component-model/ocm)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [git](https://git-scm.com/downloads)
- [gh](https://github.com/cli/cli)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [flux](https://fluxcd.io/flux/installation/#install-the-flux-cli)


### Setup the environment

First of all, let's create a cluster using `kind`:

```bash
kind create cluster
```

With the cluster created, we can now bootstrap Flux to automate the deployment of our component. Flux can create a repository and clone it to our local environment by running the following shell command:

```bash
export GITHUB_REPOSITORY=podinfo-flux-repo

flux bootstrap github \
  --owner $GITHUB_USER \
  --repository $GITHUB_REPOSITORY \
  --path ./clusters/kind \
  --personal
```

This command will create a GitHub repository named `podinfo-flux-repo`, configure Flux to use it, and deploy the resources in the ./clusters/kind directory to our Kubernetes cluster.

Let's now clone the repository flux has created and put in place the manifests required to deploy components:

```bash
gh repo clone $GITHUB_REPOSITORY && cd $GITHUB_REPOSITORY
```

We'll add a `Kustomization` to the `./clusters/kind` directory in order to reconcile any resources found in the `./components` directory:

```bash
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

Commit this file, push and then ensure Flux has reconciled the resource:

```bash
git add ./clusters/kind/components_kustomization.yaml
git commit -m "add components kustomization"
git push

# trigger an immediate reconciliation of our repo
flux reconcile source git flux-system

# view kustomizations and their status
flux get kustomizations
```

### Deploy the OCM Controller

We can use the OCM CLI to install the controller:

```bash
ocm controller install
```

### Deploy the Component

Now that we have flux configured and the `ocm-controller` installed we can started deploying components.

We told flux that our component manifests will live in `./components`, so let's create that directory:

```bash
mkdir -p ./components
```

To make the component accessible within the cluster create the following `ComponentVersion`:

```yaml
cat > ./components/component_version.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  interval: 1m0s
  component: phoban.io/podinfo
  version:
    semver: ">=v6.3.5"
  repository:
    url: ghcr.io/phoban01
EOF
```

Then create a `Resource` to retrieve the `deployment` resource from the component:

```yaml
cat > ./components/resource.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: podinfo-deployment
  namespace: ocm-system
spec:
  interval: 1m0s
  sourceRef:
    kind: ComponentVersion
    name: podinfo
    resourceRef:
      name: deployment
      version: latest
EOF
```

Finally create a `FluxDeployer` to deploy the `Resource` contents using Flux:

```yaml
cat > ./components/deployer.yaml <<EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  sourceRef:
    kind: Resource
    name: podinfo-deployment
  kustomizationTemplate:
    interval: 1m0s
    path: ./
    prune: true
    targetNamespace: default
EOF
```

At this point we can commit these files, push to the remote repository and tell flux to reconcile the changes:

```bash
git add ./components

git commit -m "add ocm manifests"

git push

flux reconcile source git flux-system
```

Within a few moments we will see the deployment spinning up:

```shell
kubectl get po -n default

NAME                       READY   STATUS    RESTARTS   AGE
podinfo-84cb98c9b6-75rx5   1/1     Running   0          1m
podinfo-84cb98c9b6-k4lk8   1/1     Running   0          1m
```

### Wrapping Up

That's it! That's how easy it is to get started using the Open Component Model and Flux.

Want to know more about working with OCM and GitOps, checkout these guides:

- [Air-gapped GitOps with OCM & Flux](/docs/guides/air-gapped-gitops-with-ocm-and-flux)
- [GitOps Driven Configuration of OCM Applications](/docs/guides/gitops-driven-configuration-of-ocm-applications)
