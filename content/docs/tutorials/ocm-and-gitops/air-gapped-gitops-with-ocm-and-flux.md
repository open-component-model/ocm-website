---
title: "Air-gapped GitOps with OCM & Flux"
description: "Automate your deployments to air-gapped environments using OCM and Flux."
weight: 13
toc: true
---

## Introduction

In this guide, we will show you how the tools provided by OCM make it possible to automate your deployments to air-gapped environments.

Air-gapped can mean different things depending on the context. For this guide, we'll assume it means your deployment artifacts are stored in a private registry protected by the security controls at your organization. Your applications only have access to this private registry and little to no public internet access.

We'll take the same `podinfo` component that we deployed in the [Deploy Applications with OCM & GitOps](/docs/tutorials/ocm-and-gitops/deploying-applications-with-ocm-gitops/) guide but this time we will use the OCM CLI to transfer the component to our own registry. The application will then be deployed from this "private" registry. This, of course, mimics a real-world air-gap scenario. In practice, there could be many layers of security between the two registries; however, the mechanics are ultimately the same.

## Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
  - [Component Content](#component-content)
  - [Component Transfer](#component-transfer)
  - [GitOps \& Localization](#gitops--localization)
  - [Verification](#verification)
  - [To Be Continued](#to-be-continued)
  - [Conclusion](#conclusion)

## Requirements

- [OCM command line tool](https://github.com/open-component-model/ocm)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [git](https://git-scm.com/downloads)
- [gh](https://github.com/cli/cli)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [flux](https://fluxcd.io/flux/installation/#install-the-flux-cli)

### Component Content

The `podinfo` component contains three resources:

- a container image for podinfo
- a kubernetes deployment manifest for podinfo
- a configuration file read by the ocm-controller

We can list these resources using the `ocm` CLI:

```bash
ocm get resources ghcr.io/phoban01//phoban.io/podinfo -c v6.3.5

NAME       VERSION IDENTITY TYPE      RELATION
config     6.3.5            PlainText local
deployment 6.3.5            Directory local
image      6.3.5            ociImage  external
```

If we examine the `config` file, we will see a section named `localization`:

```bash
ocm download resource ghcr.io/phoban01//phoban.io/podinfo -c v6.3.5 config -O -

apiVersion: config.ocm.software/v1alpha1
kind: ConfigData
metadata:
  name: ocm-config
...
localization:
- name: image # rule name
  file: deployment.yaml # target file for substitution
  image: spec.template.spec.containers[0].image # path in file to insert image name
  resource: # ocm resource from which to resolve the image location
    name: image
```

The `localization` section contains a list of rules that describe the substitutions the `ocm-controller` needs to perform to ensure that the **Local** copy of our image is deployed. OCM provides an identifier for each resource which can always be resolved to a specific storage location at which the resource can be accessed. This secret sauce makes it possible to automate air-gapped deployments using OCM.

We can examine the image resource to see precisely where the image can be accessed:

```bash
ocm get resources ghcr.io/phoban01//phoban.io/podinfo -c 6.3.5 image -owide

NAME  VERSION IDENTITY TYPE     RELATION ACCESSTYPE  ACCESSSPEC
image 6.3.5            ociImage external ociArtifact {"imageReference":"ghcr.io/stefanprodan/podinfo:6.3.5"}
```

### Component Transfer

We can use the `ocm` CLI to transfer this public component into our "private" registry. Because we are simulating an air-gapped install, we instruct the `ocm` CLI to copy the resources along with the component metadata:

```bash
AIR_GAPPED_REGISTRY=ghcr.io/phoban01/air-gapped

ocm transfer component --copy-resources ghcr.io/phoban01//phoban.io/podinfo $AIR_GAPPED_REGISTRY
```

It will take few moments to complete the transfer. Once it is complete we can view the component in the air-gapped registry:

```bash
ocm get component ghcr.io/phoban01/air-gapped//phoban.io/podinfo

COMPONENT         VERSION PROVIDER
phoban.io/podinfo 6.2.3   phoban.io
phoban.io/podinfo 6.3.5   phoban.io
```

Let's examine the image resource on the component in our private registry:

```bash
ocm get resources $AIR_GAPPED_REGISTRY//phoban.io/podinfo -c 6.3.5 image -owide

NAME  VERSION IDENTITY TYPE     RELATION ACCESSTYPE  ACCESSSPEC
image 6.3.5            ociImage external ociArtifact {"imageReference":"ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5"}
```

We can see that the image reference now points to an image stored in our air-gapped registry.

### GitOps & Localization

Now that our component has been successfully transferred, let's deploy it using GitOps.

We assume you have completed the [Deploy Applications with OCM & GitOps](/docs/tutorials/ocm-and-gitops/deploying-applications-with-ocm-gitops/) guide and will use that repository as the starting point for our air-gapped deployment.

Because our air-gapped OCM repository is private, we need to provide credentials. This will enable the `ocm-controller` to retrieve components from the repository.

We can do this using a `ServiceAccount`. First, create an Kubernetes `Secret` to hold the credentials:

```bash
kubectl create secret docker-registry -n ocm-system ghcr-cred \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER \
  --docker-password=$GITHUB_TOKEN
```

Then, create the `ServiceAccount`:

```yaml
cat > ./components/service_account.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: air-gapped-ops
  namespace: ocm-system
imagePullSecrets:
- name: ghcr-cred
EOF
```

Next, let's modify the `ComponentVersion` manifest so that it points to our air-gapped OCM repository and references the `ServiceAccount`:

```yaml
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
    url: ghcr.io/phoban01/air-gapped
  serviceAccountName: air-gapped-ops
```

Now we need to tell the `ocm-controller` to use the **Localization** rules we discussed earlier. To do this, we create a `Localization` Custom Resource:

```yaml
cat > ./components/localization.yaml >>EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: podinfo-deployment
  namespace: ocm-system
spec:
  interval: 5m
  sourceRef:
    kind: Resource
    name: podinfo-deployment # this is the podinfo deployment manifest resource we created previously
  configRef:
    kind: ComponentVersion
    name: podinfo
    resourceRef:
      name: config # here we reference the resource containing localization rules
EOF
```

You can see that we have used the existing `Resource` as the source for the `Localization` and have provided the localization rules using the `spec.configRef` field. The `ocm-controller` enables us to freely chain resources together in order to perform a sequence of transformations upon an OCM resource.

Because the output we want to deploy is now generated by the `Localization` CR rather than the `Resource` CR, we need to update our `FluxDeployer`:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  sourceRef:
    kind: Localization
    name: podinfo-deployment
  kustomizationTemplate:
    interval: 1m0s
    path: ./
    prune: true
    targetNamespace: default
```

Let's commit, push, and reconcile these changes:

```bash
git add ./components

git commit -m "move to air-gapped repository"

git push

flux reconcile source git flux-system
```

### Verification

Flux should now be reconciling the **Localized** manifest with image references pointing to our private OCM repository.

We can easily verify this using kubectl:

```bash
kubectl get deployment -n default podinfo -oyaml | grep image | xargs

image: ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5
```

### To Be Continued

If we look closer, however, we will see that our application has not successfully rolled out:

```sh
kubectl get po -n default

NAME                       READY   STATUS             RESTARTS   AGE
podinfo-7b7d874bf8-xv75x   0/1     ImagePullBackOff   0          1m4s
```

If we filter the events we can see that Kubernetes cannot pull the image owing to missing credentials:

```bash
kubectl get events --field-selector involvedObject.kind=Pod

LAST SEEN   TYPE      REASON      OBJECT                         MESSAGE
7m31s       Normal    Scheduled   pod/podinfo-7b7d874bf8-xv75x   Successfully assigned default/podinfo-7b7d874bf8-xv75x to kind-control-plane
6m7s        Normal    Pulling     pod/podinfo-7b7d874bf8-xv75x   Pulling image "ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5"
6m6s        Warning   Failed      pod/podinfo-7b7d874bf8-xv75x   Failed to pull image "ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5": rpc error: code = Unknown desc = failed to pull and unpack image "ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5": failed to resolve reference "ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5": failed to authorize: failed to fetch anonymous token: unexpected status: 401 Unauthorized
6m6s        Warning   Failed      pod/podinfo-7b7d874bf8-xv75x   Error: ErrImagePull
2m31s       Normal    BackOff     pod/podinfo-7b7d874bf8-xv75x   Back-off pulling image "ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5"
5m44s       Warning   Failed      pod/podinfo-7b7d874bf8-xv75x   Error: ImagePullBackOff
```

Check out our [GitOps Driven Configuration of OCM Applications](/docs/tutorials/ocm-and-gitops/gitops-driven-configuration-of-ocm-applications/) guide to see how you can use the `ocm-controller` to configure your application at runtime and solve exactly this kind of problem!

### Conclusion

In this tutorial we have shown how we can automate the process of delivering software to air-gapped environments using the Open Component Model and Flux.

We have shown how the process of **Localization** is enabled via OCM and combined with GitOps delivers a seamless application deployment model suitable for any environment.
