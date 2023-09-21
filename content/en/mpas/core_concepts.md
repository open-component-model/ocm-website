---
title: "Core Concepts"
description: Core Concepts of Mpas.
lead: ""
date: 2023-09-12T10:37:58+01:00
lastmod: 2023-09-12T10:37:58+01:00
draft: true
images: []
weight: 101
toc: true
---


## Product

Products are packages of software that can be deployed to a Kubernetes cluster.
Products are made available to the `MPAS` system as `OCM` Components via a Subscription.
Multiple instances of a Product may be installed that refer to the same Subscription.

A `ProductDeployment` is a Kubernetes Custom Resource that represents a product to 
be deployed to a Kubernetes cluster. The `ProductDeployment` is reconciled by the
`MPAS Product Controller` which will generate the necessary Kubernetes resources
to deploy the product to the cluster.

A `ProductDeploymentGenerator` is a Kubernetes Custom Resource that represents a
`ProductDeployment` to be deployed to a Kubernetes cluster.
The `ProductDeploymentGenerator` is reconciled by the `MPAS Product Controller`
in order to generate the `ProductDeployment` resource.

A `ProductDescription` is a manifest that describes a product. It specifies the set 
of resources that are needed to deploy the product in a form of pipeline steps.
The `ProductDescription` is retrieved by the `MPAS Product Controller` in order to
generate the `ProductDeployment` resource during a `ProductDeploymentGenerator` reconciliation.

A `ProductDeploymentPipeline` is a Kubernetes Custom Resource that defines a resource
that needs to be deployed as part of the `ProductDeployment`. The `ProductDeploymentPipeline` is
reconciled by the `MPAS Product Controller` as part of the `ProductDeployment` deployment.


## Project

A `Project` is a Kubernetes Custom Resource that is used to manage the lifecycle of
a `MPAS` project. A `Project` is reconciled by the `MPAS Project Controller` which
will generate a project namespace and a git repository for the project containing
the project folder structure. The controller will also generate the necessary
`Flux kustomization` resources in the `mpas-system` namespace in order to update
the cluster with the project resources from the git repository.

The project git repository is designed to be used as a gitops repository for the
project. It is where all the product custom resources are to be defined in order
to be deployed to the cluster.

## Subscription

The purpose of a Subscription is to replicate `OCM` components containing a particular
Product from a delivery registry to a registry in the `MPAS` customer's environment.

A `ComponentSubscription` is a Kubernetes Custom Resource that represents a subscription
to a component. The `ComponentSubscription` is reconciled by the `OCM Replication Controller`
which will generate the necessary Kubernetes resources to replicate the component to the
target registry.

## Target

A `Target` is a Kubernetes Custom Resource that represents a target environment where
a `Product` is to be deployed. The `Target` is reconciled by the `MPAS Product Controller`
which will generate the necessary Kubernetes namespace and service account for the target.