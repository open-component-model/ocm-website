---
title: "Core Concepts"
description: Core Concepts of Mpas.
lead: ""
date: 2023-09-12T10:37:58+01:00
lastmod: 2023-09-12T10:37:58+01:00
draft: false
images: []
weight: 133
toc: true
---

This section describes the core concepts of `MPAS` and what Kubernetes controllers and custom resources are contained.
To learn more about the `MPAS` architecture,
see [Architecture](https://github.com/open-component-model/MPAS/tree/main/docs/concepts).

## Product

A Product is a package of software that can be deployed to target environments such as Kubernetes clusters,
virtual machines or bare-metal devices.

Products are made available to the `MPAS` system as [OCM Components](https://github.com/open-component-model/ocm-spec/blob/main/doc/introduction/component_versions.md#component-versions) via a `Subscription`.
Multiple instances of a Product may be installed that refer to the same Subscription.

A `ProductDeployment` is a Kubernetes Custom Resource that represents a product to
be deployed to a target. The `ProductDeployment` is reconciled by the [MPAS Product Controller](https://github.com/open-component-model/mpas-product-controller) which will generate the necessary Kubernetes resources to deploy the product to the cluster.

A `ProductDeploymentGenerator` is a Kubernetes Custom Resource that represents a
`ProductDeployment` to be deployed to a Kubernetes cluster. The `ProductDeploymentGenerator`
is reconciled by the `MPAS Product Controller` in order to generate the `ProductDeployment` resource.

A `ProductDescription` is a manifest that describes a product. It specifies the set
of resources that are needed to deploy the product in a form of pipeline steps.
The `ProductDescription` is retrieved by the `MPAS Product Controller` in order to
generate the `ProductDeployment` resource during a `ProductDeploymentGenerator` reconciliation.

A `ProductDeploymentPipeline` is a Kubernetes Custom Resource that defines a resource
that needs to be deployed as part of the `ProductDeployment`. The `ProductDeploymentPipeline` is
reconciled by the `MPAS Product Controller` as part of the `ProductDeployment` deployment.


## Project

A `Project` is a Kubernetes Custom Resource that is used to manage the lifecycle of
a `MPAS` project. A `Project` is reconciled by the
[MPAS Project Controller](https://github.com/open-component-model/mpas-project-controller) which
will generate a project namespace and a git repository for the project containing
the project folder structure. The controller will also generate the necessary
`Flux kustomization` resources in the `mpas-system` namespace in order to update
the cluster with the project resources from the git repository. All items that the
`MPAS Project Controller` created during reconcile, are visible in the `status` subresource
of a `Project` CR.

The project git repository is designed to be used as a GitOps repository for the
project. It contains all the product custom resources in order
to be deployed to the cluster.

## Subscription

The purpose of a Subscription is to replicate `OCM` components containing a particular
product from a delivery registry into a target registry in the `MPAS` customer's environment.

A `ComponentSubscription` is a Kubernetes Custom Resource that represents a subscription
to a component. The `ComponentSubscription` is reconciled by the
[Replication Controller](https://github.com/open-component-model/replication-controller)
which will transfer the OCM component into the target registry using the OCM library.

## Target

A `Target` is a Kubernetes Custom Resource that represents a target environment where
a `Product` should be deployed. The `MPAS Product Controller` controller reconciles the `Target`
and creates any necessary prerequisite that needs to exist in the target environment, e.g.
a namespace and a service account.
