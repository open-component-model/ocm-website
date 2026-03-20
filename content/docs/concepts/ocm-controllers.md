---
title: OCM Controllers
description: "Learn about the OCM controllers and their capabilities."
icon: "🏁"
weight: 3
toc: true
---

The OCM controllers reconcile OCM component versions into a Kubernetes cluster. They form a chain of four custom resources, each depending on the previous one becoming `Ready`:

**Repository** validates that an OCM repository is reachable. **Component** resolves and verifies a component version from that repository. **Resource** fetches a specific resource from the component version. **[Deployer]({{< relref "kubernetes-deployer.md" >}})** downloads the resource content and applies it to the cluster.

## Architecture

The primary purpose of OCM Controllers is simple: Deploy an OCM resource from an OCM component version into a Kubernetes cluster.

The diagram below provides an overview of the architecture of the OCM Controllers.

{{< inline-svg src="images/controller-tam.svg" >}}

## Asynchronous Component Resolution

Component version resolution happens in a background worker pool. When a controller needs a component version, it submits a request and receives a sentinel error (`ErrResolutionInProgress`). The controller returns early without blocking. Once the worker finishes, it broadcasts an event that re-triggers reconciliation for all waiting objects.

Requests for the same component version are deduplicated across multiple subscribers.

## Configuration Propagation

OCM configuration such as credentials and resolvers flows through the reconciliation chain. Each object can declare its own config references and inherit configs from its parent:

```yaml
spec:
  configRefs:
    - kind: Secret
      name: registry-credentials
      policy: Propagate
```

`Propagate` makes the config available to child objects in the chain. `DoNotPropagate` scopes it to that object only. Supported sources are Kubernetes `Secrets`, `ConfigMaps`, and `OCMConfiguration` objects.

## Additional Status Fields

The `Resource` object supports `additionalStatusFields`, a map of field names to [CEL](https://github.com/google/cel-spec) expressions evaluated against the resource descriptor:

```yaml
spec:
  additionalStatusFields:
    registry: "resource.access.globalAccess.imageReference.split('/')[0]"
```

Results are stored under `status.additional.<fieldName>` and can be consumed by downstream tools like [Kro](https://kro.run/) to wire values between resources in a `ResourceGraphDefinition`.

## Installation

The OCM controllers are distributed as an OCI Helm chart:

```console
helm install ocm-k8s-toolkit oci://ghcr.io/open-component-model/kubernetes/controller/chart \
  --namespace ocm-system \
  --create-namespace
```

CRDs are retained by default on uninstall. The chart requires Kubernetes 1.26 or later.

## Related Documentation

- [Kubernetes Deployer](`<kubernetes-deploy.md doc placeholder>`), how the Deployer applies and manages resources
- [Setup Controller Environment]({{< relref "setup-controller-environment.md" >}}), prerequisites for running the controllers
- [Configuring Credentials]({{< relref "configure-credentials-for-controllers.md" >}}), setting up access to private OCM repositories
