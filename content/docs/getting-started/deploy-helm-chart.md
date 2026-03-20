---
title: "Deploy Helm Charts"
description: "Deploy a Helm chart from an OCM component version with OCM Controllers, kro, and Flux."
icon: "🚀"
weight: 26
toc: true
---

This guide gives you a quick overview of deploying a Helm chart using the OCM Controllers.
For the full walkthrough, including the bootstrap approach with the Deployer, see the
[Deploy with Controllers]({{< relref "deploy-with-controllers.md" >}}) tutorial.

## Overview

The OCM Controllers deploy Helm charts from OCM component versions into Kubernetes clusters using kro and Flux.
The basic flow is:

1. **Create** an OCM component version containing your Helm chart.
2. **Define** a `ResourceGraphDefinition` (RGD) that wires up OCM and Flux resources.
3. **Apply** the RGD and create an instance to trigger the deployment.

For an automated approach where the RGD is packaged inside the OCM component itself, the
[Deployer]({{< relref "deployer.md" >}}) can extract and apply it for you.

## Prerequisites

- [Controller environment]({{< relref "setup-controller-environment.md" >}}) set up
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- Access to an OCI registry

## Quick Start

Create a component referencing a Helm chart:

```yaml
components:
  - name: ocm.software/ocm-k8s-toolkit/simple
    provider:
      name: ocm.software
    version: "1.0.0"
    resources:
      - name: helm-resource
        type: helmChart
        version: 1.0.0
        access:
          type: ociArtifact
          imageReference: "ghcr.io/stefanprodan/charts/podinfo:6.9.1@sha256:565d310746f1fa4be7f93ba7965bb393153a2d57a15cfe5befc909b790a73f8a"
```

Build, transfer, and deploy:

```shell
ocm add cv
ocm transfer cv transport-archive//ocm.software/ocm-k8s-toolkit/simple:1.0.0 ghcr.io/<your-namespace>
```

Then define an RGD and create an instance. The [full tutorial]({{< relref "deploy-with-controllers.md" >}}) covers every step in detail.

## Next Steps

- [Tutorial: Deploy with Controllers]({{< relref "deploy-with-controllers.md" >}}), full walkthrough with both manual and bootstrap approaches
- [Concept: Deployer]({{< relref "deployer.md" >}}), how the Deployer applies resources from OCM components
- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}), overview of the controller ecosystem
- [Tutorial: Create a Multi-Component Product]({{< relref "docs/tutorials/advanced-component-constructor.md" >}}) - Learn how to structure complex applications with multiple components and resources

## Related Documentation

- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}) - Learn about the architecture and capabilities of the OCM Controllers
