---
title: OCM Controllers
description: "Learn about the OCM controllers and their capabilities."
icon: "🏁"
weight: 3
toc: true
---

{{<callout context="danger" title="Caution" icon="outline/alert-triangle">}}
This project is in early development and not yet ready for production use.
{{</callout>}}

The OCM controllers bridge the gap between OCM repositories and running Kubernetes clusters. They resolve OCM component versions, download resources, and deploy them using the built-in [Deployer]({{< relref "kubernetes-deployer.md" >}}) and [kro](https://kro.run).

### Before You Begin

You should be familiar with the following concepts:

- [Open Component Model](https://ocm.software/)
- [Kubernetes](https://kubernetes.io/) ecosystem
- [kro](https://kro.run)

## Architecture

The controller chain — `Repository` → `Component` → `Resource` → `Deployer` — reconciles OCM content into a cluster. See the [Deployer concept]({{< relref "kubernetes-deployer.md" >}}) for details on how resources are applied, including the architecture diagram.

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

{{<callout context="caution" title="kro" icon="outline/alert-triangle">}}
The OCM controllers deployment does not include kro. If you plan to use `ResourceGraphDefinitions`, install kro separately:

- [kro installation](https://kro.run/docs/getting-started/Installation/)
{{</callout>}}

## Getting Started

- [Setup your (test) environment]({{< relref "setup-controller-environment.md" >}})
- [Deploy with Controllers]({{< relref "deploy-with-controllers.md" >}})
- [Configuring credentials for OCM controller resources to access private OCM repositories]({{< relref "configure-credentials-for-controllers.md" >}})

[controller-image]: https://github.com/open-component-model/open-component-model/pkgs/container/kubernetes%2Fcontroller
