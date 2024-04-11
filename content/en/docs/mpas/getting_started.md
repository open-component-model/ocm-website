---
title: "Get Started with MPAS"
description: ""
lead: ""
date: 2023-09-12T10:37:58+01:00
lastmod: 2023-11-03T10:53:00+01:00
draft: false
images: []
weight: 131
toc: true
---

This tutorial shows you how to bootstrap MPAS to a Kubernetes cluster and deploy
a simple application.

## Prerequisites

- A Kubernetes cluster
- A GitHub access token with `repo` scope
- kubectl

## Objectives

- Bootstrap MPAS to a Kubernetes cluster
- Deploy a simple application

## Install the MPAS CLI

The MPAS CLI is the primary tool for interacting with MPAS. It can be used to
bootstrap MPAS to a Kubernetes cluster.

To install the MPAS CLI using `brew`:

```bash
brew install open-component-model/tap/mpas
```

For other installation methods, see the [installation guide](/mpas/overview/installation/).

## Bootstrap MPAS

### Export your GitHub access token

The MPAS CLI uses your GitHub access token to authenticate with GitHub. To create a
GitHub access token, see the [GitHub documentation](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token). In addition to that we need to export your GitHub user and an your email address as they are used later.

```bash
export GITHUB_TOKEN=<your-github-access-token>
export GITHUB_USER=<your-username>
export MY_EMAIL=<your-email-address>
```

### Bootstrap MPAS

To bootstrap MPAS to your Kubernetes cluster, run the following command. If nothing is specified it will use the KUBECONFIG specified in the user's environment. It is also possible to specify a dedicated config using the --kubeconfig option.

```bash
mpas bootstrap github \
  --owner=$GITHUB_USER \
  --repository=mpas-bootstrap \
  --path=./clusters/my-cluster \
  --personal
```

This command will create a new Github repository called `mpas-bootstrap` and bootstrap
MPAS to your Kubernetes cluster. The following components will be installed:

- [Flux](https://fluxcd.io/docs/components/): A Kubernetes operator that will
  install and manage the other components.
- [ocm-controller](https://github.com/open-component-model/ocm-controller): A Kubernetes controller
  that enables the automated deployment of software components using the Open Component Model and Flux.
- [git-controller](https://github.com/open-component-model/git-controller): A
  Kubernetes controller that will create pull requests in the target Github repository
  when changes are made to the cluster.
- [replication-controller](https://github.com/open-component-model/replication-controller): A Kubernetes controller that
  keeps keep component versions in the cluster up-to-date with a version defined by the consumer in the `ComponentSubscription` resource.
- [mpas-product-controller](https://github.com/open-component-model/mpas-product-controller): A Kubernetes controller, responsible for creating a product. Reconciles the `Product` resource.
- [mpas-project-controller](https://github.com/open-component-model/mpas-project-controller): A Kubernetes controller responsible for bootstrapping a whole project. Creates relevant access credentials, service accounts, roles and the main GitOps repository and
reconciles the `Project` resource.

The output of the bootstrap is similar to the following:

```bash
Running mpas bootstrap ...
 ✓   Preparing Management repository mpas-bootstrap
 ✓   Fetching bootstrap component from ghcr.io/open-component-model/mpas-bootstrap-component
 ✓   Installing flux with version v2.1.0
 ✓   Installing cert-manager with version v1.13.1
 ✓   Reconciling infrastructure components
 ✓   Waiting for cert-manager to be available
 ✓   Generating external-secrets-operator manifest with version v0.9.6
 ✓   Generating git-controller manifest with version v0.9.0
 ✓   Generating mpas-product-controller manifest with version v0.6.0
 ✓   Generating mpas-project-controller manifest with version v0.5.0
 ✓   Generating ocm-controller manifest with version v0.14.1
 ✓   Generating replication-controller manifest with version v0.8.0
 ✓   Generate certificate manifests
 ✓   Reconciling infrastructure components
 ✓   Waiting for components to be ready

Bootstrap completed successfully!
```

After completing the bootstrap process, the target github repository will contain
yaml manifests for the components to be installed on the cluster and Flux will
apply all of them to get the components installed. Furthermore the installed `Flux` components will
be configured to watch the target github repository for changes in the path `./clusters/my-cluster`.

#### Clone the git repository

Clone the `mpas-bootstrap` repository to your local machine:

```sh
git clone https://github.com/$GITHUB_USER/mpas-bootstrap
cd mpas-bootstrap
```

### Deploy podinfo application

The [podinfo application](https://github.com/stefanprodan/podinfo) has been packaged
as an OCM component and can be retrieved from [Github](ghcr.io/open-component-model/podinfo).

1. Create a secret containing your GitHub credentials that will be used by MPAS to
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
mpas create project podinfo-application \
  --owner=$GITHUB_USER \
  --provider=github \
  --visibility=public \
  --already-exists-policy=fail \
  --branch=main \
  --secret-ref=github-access \
  --email=$MY_EMAIL \
  --message=xxx \
  --author=mpas-admin \
  --maintainers=$GITHUB_USER \
  --prune \
  --personal \
  --export  >> ./clusters/my-cluster/podinfo/project.yaml
```

Then, apply the project to the cluster in a GitOps fashion:

```bash
git add --all && git commit -m "Add podinfo project" && git push
```

`Flux` will detect the changes and apply the project to the cluster.

This will create a `namespace` for the project, a `serviceaccount`, and RBAC in the cluster.
It will also create a GitHub repository for the project, and configure `Flux` to manage the project's resources.

3. Add the needed secrets to the namespace

`Flux` is used to deploy all workloads in a GitOps way. `Flux` needs a secret in
the project namespace that will be used to communicate with github:

```bash
kubectl create secret generic \
  github-access \
  --from-literal=username=$GITHUB_USER \
  --from-literal=password=$GITHUB_TOKEN \
  -n mpas-podinfo-application
```

**Note** The credentials should have access to GitHub packages.

As part of step 2, a `serviceaccount` was created for the project. We will use this service account
to provide the necessary permissions to pull from the `ghcr` registry.

First, create a secret containing the credentials for the service account:

```bash
kubectl create secret docker-registry github-registry-key --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER --docker-password=$GITHUB_TOKEN \
  --docker-email=$MY_EMAIL -n mpas-podinfo-application
```

Then, patch the service account to use the secret:

```bash
kubectl patch serviceaccount mpas-podinfo-application -p '{"imagePullSecrets": [{"name": "github-registry-key"}]}' \
  -n mpas-podinfo-application
```

1. Clone the project repository

```bash
git clone https://github.com/$GITHUB_USER/mpas-podinfo-application
cd mpas-podinfo-application
```

5. Add the podinfo `ComponentSubscription`

Create a file under `./subscriptions/` that will contain the subscription declaration.

```bash
mpas create cs podinfo-subscription \
  --component=ocm.software/mpas/podinfo \
  --semver=">=v1.0.0" \
  --source-url=ghcr.io/open-component-model/mpas \
  --source-secret-ref=github-access \
  --target-url=ghcr.io/$GITHUB_USER \
  --target-secret-ref=github-access \
  --namespace=mpas-podinfo-application  \
  --export >> ./subscriptions/podinfo.yaml
```

Then, apply the `ComponentSubscription` to the project in a GitOps fashion:

```bash
git add --all && git commit -m "Add podinfo subscription" && git push
```

`Flux` will detect the changes and apply the subscription to the cluster.

This will replicate the product referenced by the field `spec.component` in the `ComponentSubscription` resource from
the defined registry in `spec.source.url` to the `spec.destination.url` registry.

6. Add a `Target` for the podinfo application

The target will define where the application will be installed


```bash
cat <<EOF >> ./targets/podinfo.yaml
apiVersion: mpas.ocm.software/v1alpha1
kind: Target
metadata:
  name: podinfo-kubernetes-target
  namespace: mpas-podinfo-application
  labels:
    target.mpas.ocm.software/ingress-enabled: "true" # This label is defined by the component that will use it to select an appropriate target to deploy to.
spec:
  type: kubernetes
  access:
    targetNamespace: podinfo
  serviceAccountName: podinfo-sa
  selector:
    matchLabels:
      mpas.ocm.software/target-selector: podinfo-kubernetes-target
  interval: 5m0s
EOF
```

Then, apply the `Target` to the project in a GitOps fashion:

```bash
git add --all && git commit -m "Add a target for podinfo" && git push
```

`Flux` will detect the changes and apply the target to the cluster.

In order for the `Target` to reach a `Ready` state, the needed secrets should be created in the `podinfo` namespace.

First, create a secret containing the credentials for the service account:

```bash
kubectl create secret docker-registry github-registry-key --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER --docker-password=$GITHUB_TOKEN \
  --docker-email=$MY_EMAIL -n podinfo
```

Then, add a label to allow the target to select it using the label selector:

```bash
kubectl label secret github-registry-key mpas.ocm.software/target-selector=podinfo-kubernetes-target -n podinfo
```

1. Deploy the podinfo application

In order to deploy the podinfo application, we need to create a `ProductDeploymentGenerator` resource:

```bash
mpas create pdg podinfo \
  --service-account=mpas-podinfo-application \
  --subscription-name=podinfo-subscription \
  --subscription-namespace=mpas-podinfo-application  \
  --namespace=mpas-podinfo-application \
  --export >> ./generators/podinfo.yaml
```

Then, apply the `ProductDeploymentGenerator` to the project in a GitOps fashion:

```bash
git add --all && git commit -m "Add podinfo deployment generator" && git push
```

`Flux` will detect the changes and apply the resource to the cluster.

This will create a pull request in the project repository with the `ProductDeployment` resource
that will deploy the podinfo application.

Go to the project repository and retrieve the pull request.
It should contain a `ProductDeployment` declaration that provides the configuration and
all steps needed to deploy the product, as well as a `values.yaml` file. The `values` file
contains values that should be used to configure the different resources that are part of
the product to be deployed. There is a check that should pass before merging the pull request.

Once the pull request is merged, `Flux` will detect the changes and deploy the application to the cluster.

After a moment the `ProductDeployment` should be deployed successfully.
It is possible to verify this with the command:

```bash
k describe productdeployment -n mpas-podinfo-application
```

The result should look something like:

```bash
Name:         podinfo
Namespace:    mpas-podinfo-application
Labels:       kustomize.toolkit.fluxcd.io/name=mpas-podinfo-application-products
              kustomize.toolkit.fluxcd.io/namespace=mpas-system
API Version:  mpas.ocm.software/v1alpha1
Kind:         ProductDeployment
Metadata:
...
Status:
  Conditions:
    Last Transition Time:  2023-09-14T10:14:41Z
    Message:               Reconciliation success
    Observed Generation:   1
    Reason:                Succeeded
    Status:                True
    Type:                  Ready
  Observed Generation:     1
```

The application is deployed in the `podinfo` namespace.
