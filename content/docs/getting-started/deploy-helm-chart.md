---
title: "Deploy Helm Charts"
description: "Deploy a Helm chart from an OCM component version with OCM Controllers, kro, and Flux."
icon: "🚀"
weight: 26
toc: true
---

The [OCM Controllers]({{< relref "ocm-controllers.md" >}}) deploy Helm charts from OCM component versions into Kubernetes clusters using kro and Flux. The basic flow is:

1. **Create** an OCM component version containing your Helm chart.
2. **Define** a `ResourceGraphDefinition` (RGD) that wires up OCM and Flux resources.
3. **Apply** the RGD and create an instance to trigger the deployment.

For an automated approach where the RGD is packaged inside the OCM component itself, the
[Deployer]({{< relref "kubernetes-deployer.md" >}}) can extract and apply it for you.

The [Deploy with Controllers]({{< relref "deploy-with-controllers.md" >}}) tutorial covers both approaches step by step.

## Related Documentation

- [Tutorial: Deploy with Controllers]({{< relref "deploy-with-controllers.md" >}}), full walkthrough with both manual and bootstrap approaches
- [Concept: Deployer]({{< relref "kubernetes-deployer.md" >}}), how the Deployer applies resources from OCM components
- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}}), overview of the controller ecosystem
