---
title: OCM Controllers
description: "Learn about the OCM controllers and their capabilities."
icon: "🏁"
weight: 43
toc: true
---

{{<callout context="danger" title="Caution" icon="outline/alert-triangle">}}
This project is in early development and not yet ready for production use.
{{</callout>}}

The OCM controllers

- support the deployment of an OCM component and its resources, like Helm charts or other manifests,
into a Kubernetes cluster with the help of kro and a deployer, e.g. FluxCD.

### Before You Begin

You should be familiar with the following concepts:

- [Open Component Model](https://ocm.software/)
- [Kubernetes](https://kubernetes.io/) ecosystem
- [kro](https://kro.run)
- Kubernetes resource deployer such as [FluxCD](https://fluxcd.io/).

## Architecture

The primary purpose of OCM Controllers is simple: Deploy an OCM resource
from an OCM component version into a Kubernetes cluster.

The diagram below provides an overview of the architecture of the OCM
Controllers.

<img src="/images/controller-tam.svg" alt="Architecture of OCM Controllers" />

## Installation

Currently, the OCM controllers are available as [image][controller-image] and
[Kustomization](https://github.com/open-component-model/open-component-model/blob/main/kubernetes/controller/config/default/kustomization.yaml). A Helm chart is planned for the future.

To install the OCM controllers into your running Kubernetes cluster, you can use the following commands:

```console
# In the open-component-model repository, folder kubernetes/controller
task deploy
```

or

```console
kubectl apply -k https://github.com/open-component-model/open-component-model/kubernetes/controller/config/default?ref=main
```

{{<callout context="caution" title="Deployer tools" icon="outline/alert-triangle">}}
While the OCM controllers technically can be used standalone, it requires kro and a deployer, e.g. FluxCD, to deploy
an OCM resource into a Kubernetes cluster. The OCM controllers deployment, however, does not contain kro or any
deployer. Please refer to the respective installation guides for these tools:

- [kro](https://kro.run/docs/getting-started/Installation/)
- [FluxCD](https://fluxcd.io/docs/installation/)
{{</callout>}}

## Getting Started

- [Setup your (test) environment with kind, kro, and FluxCD]({{< relref "setup-controller-environment.md" >}})
- [Deploying a Helm chart using a `ResourceGraphDefinition` with FluxCD]({{< relref "deploy-helm-chart.md" >}})
- [Deploying a Helm chart using a `ResourceGraphDefinition` inside the OCM component version (bootstrap) with FluxCD]({{< relref "deploy-helm-chart-bootstrap.md" >}})
- [Configuring credentials for OCM controller resources to access private OCM repositories]({{< relref "configure-credentials-for-controllers.md" >}})

[controller-image]: https://github.com/open-component-model/open-component-model/pkgs/container/kubernetes%2Fcontroller
