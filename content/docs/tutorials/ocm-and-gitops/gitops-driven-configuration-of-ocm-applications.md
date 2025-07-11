---
title: "GitOps Driven Configuration of OCM Applications"
description: "OCM as the source of truth for GitOps driven configuration."
weight: 13
toc: true
---

{{<callout context="tip" title="Did you know?">}}Get ready for the next evolution of the Open Component Model, designed to empower your cloud-native workflows. Discover a preview of the innovative `ocm-k8s-toolkit` [here](https://github.com/open-component-model/ocm-k8s-toolkit) and be part of shaping the future of component management!{{</callout>}}

## Introduction

This guide is the final part of our series exploring OCM, the `ocm-controller`, and how to drive GitOps processes using OCM as the source of truth.

Check out the previous guides if you haven't already:

- [Deploy Applications with OCM & GitOps](/docs/tutorials/ocm-and-gitops/deploying-applications-with-ocm-gitops/)
- [Air-gapped GitOps with OCM & Flux](/docs/tutorials/ocm-and-gitops/air-gapped-gitops-with-ocm-flux/)

In this guide we will pick up where we left off in the example for deployments to air-gapped environments.

We have successfully transferred a component to our private environment and deployed it using the `ocm-controller`. However, the Kubernetes `Deployment` for `podinfo` is failing because it does not have permission to access our private container images.

Let's fix that.

## Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
  - [Component Content Recap](#component-content-recap)
  - [GitOps \& Configuration](#gitops--configuration)
  - [Verify Deployment](#verify-deployment)
  - [Conclusion](#conclusion)

## Requirements

- [OCM command line tool](https://github.com/open-component-model/ocm)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [git](https://git-scm.com/downloads)
- [gh](https://github.com/cli/cli)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [flux](https://fluxcd.io/flux/installation/#install-the-flux-cli)

### Component Content Recap

We saw previously that the `podinfo` component contains three resources:

- `podinfo` container image
- kubernetes deployment manifest for `podinfo`
- configuration file read by the ocm-controller

We can list these resources using the `ocm` CLI:

```bash
ocm get resources ghcr.io/phoban01//phoban.io/podinfo -c v6.3.5

NAME       VERSION IDENTITY TYPE      RELATION
config     6.3.5            PlainText local
deployment 6.3.5            Directory local
image      6.3.5            ociImage  external
```

Let's examine the `config` resource once again and this time focus on a section named `configuration`:

```bash
ocm download resource ghcr.io/phoban01//phoban.io/podinfo -c v6.3.5 config -O -

apiVersion: config.ocm.software/v1alpha1
kind: ConfigData
metadata:
  name: ocm-config
configuration:
  defaults:
    serviceAccountName: default # this is the default value for our variable
  rules:
  - value: (( serviceAccountName ))  # this variable
    file: deployment.yaml # will be inserted into this file
    path: spec.template.spec.serviceAccountName # at this path
  schema: # allows us to define constraints for configuration values
    type: object
    additionalProperties: false
    properties:
      serviceAccountName:
        type: string
...
```

The `configuration` section contains a set of rules, some default values, and a schema.

These can be used to provide configuration values, which will be inserted into our resources at runtime by the `ocm-controller`.

In the above resource we can see that there is a variable named `serviceAccountName` and a rule which specifies that this variable should be inserted into the path `spec.template.spec.serviceAccountName` in the `deployment.yaml` file.

### GitOps & Configuration

Similar to how we **Localized** our deployment resource in the previous guide, we create another Custom Resource with the type `Configuration` in order to apply our configuration rules:

```yaml
cat > ./components/localization.yaml >>EOF
apiVersion: delivery.ocm.software/v1alpha1
kind: Configuration
metadata:
  name: podinfo-deployment
  namespace: ocm-system
spec:
  interval: 1m
  sourceRef:
    kind: Localization
    name: podinfo-deployment # this is the podinfo deployment localization
  configRef:
    kind: ComponentVersion
    name: podinfo
    resourceRef:
      name: config # here we reference the configuration resource
  values:
    serviceAccountName: app-ops
EOF
```

You can see that this time we have used the `Localization` resource as the input for the `Configuration` and have provided the configuration rules using the `spec.configRef` field. Finally, we specify our service account name in the `spec.values.serviceAccountName` field.

Once again we need to update the `FluxDeployer` so that it consumes the `Configuration` rather than the `Localization`:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: podinfo
  namespace: ocm-system
spec:
  sourceRef:
    kind: Configuration
    name: podinfo-deployment
  kustomizationTemplate:
    interval: 1m0s
    path: ./
    prune: true
    targetNamespace: default
```

Before we push these changes, we need to actually create the `ServiceAccount` and image-pull `Secret` in the target namespace.

Let's create the secret as we did previously (Note that in a real world scenario there are a number of ways to [manage secrets](https://fluxcd.io/flux/security/secrets-management/) when doing Gitops):

```bash
kubectl create secret docker-registry -n default ghcr-cred \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER \
  --docker-password=$GITHUB_TOKEN
```

Now let's add the `ServiceAccount`:

```bash
cat > ./clusters/kind/service_account.yaml <<EOF

apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-ops
  namespace: default
imagePullSecrets:
- name: ghcr-cred
```

Finally we are ready commit, push, and reconcile these changes:

```bash
git add ./components ./clusters

git commit -m "move to air-gapped repository"

git push

flux reconcile source git flux-system
```

### Verify Deployment

Flux should now be reconciling the **Configured** manifest with image references pointing to our private OCM repository and the correct `ServiceAccount` configured.

We can verify this using `kubectl`:

```bash
kubectl get deployment -n default podinfo -oyaml | grep serviceAccountName | xargs

serviceAccountName: app-ops
```

```bash
kubectl get deployment -n default podinfo -oyaml | grep image | xargs

image: ghcr.io/phoban01/air-gapped/stefanprodan/podinfo:6.3.5
```

Kubernetes can now retrieve the image and all pods should be happily running.

### Conclusion

We have shown how OCM and Flux can be combined to configure applications at runtime.

GitOps driven configuration in tandem with the powerful **Localization** functionality provided by OCM offers tremendous flexibility, reliability, and scalability when deploying your applications to any kind of compute environment, be it public, private or edge.
