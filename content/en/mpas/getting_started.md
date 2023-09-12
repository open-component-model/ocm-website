---
title: "Get Started with Mpas"
description: ""
lead: ""
date: 2023-09-12T10:37:58+01:00
lastmod: 2023-09-12T10:37:58+01:00
draft: true
images: []
weight: 101
toc: true
---

This tutorial shows you how to bootstrap Mpas to a Kubernetes cluster and deploy
a simple application.

## Prerequisites

- A Kubernetes cluster
- A Github access token with `repo` scope
- kubectl

## Objectives

- Bootstrap Mpas to a Kubernetes cluster
- Deploy a simple application

## Install the Mpas CLI

The Mpas CLI is the primary tool for interacting with Mpas. It can be used to
bootstrap Mpas to a Kubernetes cluster.

To install the Mpas CLI using `brew`:

```bash
brew install open-component-model/tap/mpas
```

For other installation methods, see the [installation guide](/mpas/overview/installation/).

## Bootstrap Mpas

### Export your Github access token

The Mpas CLI uses your Github access token to authenticate with Github. To create a
Github access token, see the [Github documentation](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token).

```bash
export GITHUB_TOKEN=<your-github-access-token>
export GITHUB_USER=<your-username>
```

### Bootstrap Mpas

To bootstrap Mpas to your Kubernetes cluster, run the following command:

```bash
mpas bootstrap github \
  --owner=$GITHUB_USER \
  --repository=mpas-bootstrap \
  --path=./clusters/my-cluster \
  --dev \
  --personal
```

This command will create a new Github repository called `mpas-bootstrap` and bootstrap
Mpas to your Kubernetes cluster. The following components will be installed:
- [Flux](https://fluxcd.io/docs/components/): A Kubernetes operator that will
  install and manage the other components.
- [Ocm-controller](https://github.com/open-component-model/ocm-controller): A Kubernetes operator 
  that enable the automated deployment of software using the Open Component Model and Flux.
- [Git-controller](https://github.com/open-component-model/git-controller): A
  Kubernetes controller that will create Pull Requests in the target Github repository
  when changes are made to the cluster.
- [Replication-controller](https://github.com/open-component-model/git-controller):
- [Mpas-product-controller](https://github.com/open-component-model/mpas-product-controller):
- [Mpas-project-controller](https://github.com/open-component-model/mpas-project-controller):

The output is similar to the following:

```bash
Running mpas bootstrap ...
 ✓   Preparing Management repository mpas-bootstrap
 ✓   Fetching bootstrap component from ghcr.io/open-component-model/mpas-bootstrap-component
 ✓   Installing flux with version v2.1.0
 ✓   Generating git-controller manifest with version v0.7.1
 ✓   Generating mpas-product-controller manifest with version v0.3.3
 ✓   Generating mpas-project-controller manifest with version v0.1.2
 ✓   Generating ocm-controller manifest with version v0.12.2
 ✓   Generating replication-controller manifest with version v0.6.2
 ✓   Waiting for components to be ready

Bootstrap completed successfully!
```

After completing the bootstrap process, the target github repository will contain
yaml manifests for the components to be installed on the cluster. The cluster will
also have the components installed. Furthermore the installed `Flux` components will
be configured to watch the target github repository for changes in the path `./clusters/my-cluster`.

#### Clone the git repository

Clone the `mpas-bootstrap` repository to your local machine:

```sh
git clone https://github.com/$GITHUB_USER/mpas-bootstrap
cd mpas-bootstrap
```

#### Registry certificate

The `--dev` flag will bootstrap Mpas in development mode, which means that a self-signed
certificate will be used for the Mpas components to communicate with the internal `oci` registry.

You may want to provide your own certificate for production use, for example by using [cert-manager](https://cert-manager.io/docs/usage/certificate/).
The certificate should be named `ocm-registry-tls-certs` and should be placed in the `mpas-system`
and `ocm-system` namespaces. You can use [syncing-secrets-across-namespaces](https://cert-manager.io/docs/tutorials/syncing-secrets-across-namespaces/) guide to sync the certificate between namespaces.


### Deploy podinfo application

The [podinfo application](https://github.com/stefanprodan/podinfo) has been packaged
as an ocm component and can be retrieved from [Github](ghcr.io/open-component-model/podinfo).

<!--TODO: Add project creation command

```bash
mpas create project podinfo-project --export > podinfo-project.yaml
```
We should also have a command to create a component subscription as well as a product deployment generator.
--->

1. Create a secret containing your Github credentials that will be used by Mpas to
create your project repository.

```bash
kubectl create secret generic \
  github-access \
  --from-literal=username=$GITHUB_USER \
  --from-literal=password=$GITHUB_TOKEN \
  -n mpas-system
```

2. Create a project that will contain the podinfo application.

Let's create a directory for the project:

```bash
mkdir -p ./clusters/my-cluster/podinfo
````

Then, create a `project.yaml` file in the `./clusters/my-cluster/podinfo` directory:

```bash
cat <<EOF >> ./clusters/my-cluster/podinfo/project.yaml
apiVersion: mpas.ocm.software/v1alpha1
kind: Project
metadata:
  name: podinfo-application
  namespace: mpas-system
spec:
  flux:
    interval: 1h
  git:
    provider: github
    owner: $GITHUB_USER
    isOrganization: false
    visibility: public
    maintainers:
    - $GITHUB_USER
    existingRepositoryPolicy: adopt
    defaultBranch: main
    credentials:
      secretRef:
        name: github-access
    commitTemplate:
      email: mpas@mpas.ocm.software
      message: Initializing Project repository
      name: mpas-admin
  prune: true
EOF
```

Then, apply the project to the clustern in a gitOps fashion:

```bash
git add --all && git commit -m "Add podinfo project" && git push
```

`Flux` will detect the changes and apply the project to the cluster.

This will create in the cluster a `namespace` for the project, a `service account`, and RBAC.
It will also create a GitHub repository for the project, and configure `Flux` to manage the project's resources.

3. Clone the project repository

```bash
git clone https://github.com/$GITHUB_USER/mpas-podinfo-application
cd mpas-podinfo-application
```

4. Add the podinfo component subscription

we need a secret in the project namespace that will be used to retrieve the component from the registry:

```bash
kubectl create secret generic \
  github-access \
  --from-literal=username=$GITHUB_USER \
  --from-literal=password=$GITHUB_TOKEN \
  -n mpas-podinfo-application
```

**Note** The credentials shall have access to github packages.

```bash
cat <<EOF >> ./subscriptions/podinfo.yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentSubscription
metadata:
  name: podinfo-subscription
  namespace: mpas-podinfo-application
spec:
  interval: 30s
  component: mpas.ocm.software/podinfo
  semver: ">=v1.0.0"
  source:
    url: ghcr.io/open-component-model/mpas
    secretRef:
      name: github-access
  destination:
    url: ghcr.io/$GITHUB_USER
    secretRef:
      name: github-access
EOF
```

Then, apply the `ComponentSubscription` to the project in a gitOps fashion:

```bash
git add --all && git commit -m "Add podinfo subscription" && git push
```

`Flux` will detect the changes and apply the subscription to the cluster.

This will replicate the product referenced by the `ComponentSubscription` `spec.component` field from
defined registry in the `spec.source.url` to the `spec.destination.url` registry.

5. Add a target for the podinfo application

The target will define where the application will be installed

```bash
cat <<EOF >> ./targets/podinfo.yaml
apiVersion: mpas.ocm.software/v1alpha1
kind: Target
metadata:
  name: podinfo-kubernetes-target
  namespace: mpas-podinfo-application
  labels:
    target.mpas.ocm.software/ingress-enabled: "true" # DO NOT CHANGE. expected by the component for target selection.
spec:
  type: kubernetes
  access:
    targetNamespace: podinfo
EOF
```

Then, apply the `Target` to the project in a gitOps fashion:

```bash
git add --all && git commit -m "Add a target for podinfo" && git push
```

`Flux` will detect the changes and apply the target to the cluster.

6. Deploy the podinfo application

In order to deploy the podinfo application, we need to create a `ProductDeploymentGenerator` resource:

```bash
cat <<EOF >> ./generators/podinfo.yaml
apiVersion: mpas.ocm.software/v1alpha1
kind: ProductDeploymentGenerator
metadata:
  name: podinfo
  namespace: mpas-podinfo-application
spec:
  interval: 1m
  serviceAccountName: mpas-podinfo-application
  subscriptionRef:
    name: podinfo-subscription
    namespace: mpas-podinfo-application
EOF
```

As part of step 2, a `service account` was created for the project. We will use this service account
to provide the necessary permissions to the `ProductDeploymentGenerator` to pull
the podinfo component from the registry.

First create a secret containing the credentials for the service account:

```bash
kubectl create secret docker-registry github-registry-key --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER --docker-password=$GITHUB_TOKEN \
  --docker-email=<MY_EMAIL> -n mpas-podinfo-application
```

Then, patch the service account to use the secret:

```bash
kubectl patch serviceaccount mpas-podinfo-application -p '{"imagePullSecrets": [{"name": "github-registry-key"}]}' \
  -n mpas-podinfo-application
```

Then, apply the `ProductDeploymentGenerator` to the project in a gitOps fashion:

```bash
git add --all && git commit -m "Add podinfo deployment generator" && git push
```

`Flux` will detect the changes and apply the resource to the cluster.

This will create a pull request in the project repository with the `ProductDeployment` resource
that will deploy the podinfo application.

<!--TODO: The pull request commit needs changed to something more meaningful--->

Go to the project repository and retrieve the pull request. 
It should contains a `ProductDeployment` declaration that provides the configuration and
all steps needed to deploy the product, as well as a `values.yaml` file. The `values` file
contains values that should used to configure the different resources that are part of
the product to be deployed. There is a check that should pass before merging the pull request.

Once the pull request is merged, `Flux` will detect the changes and deploy the application to the cluster.
