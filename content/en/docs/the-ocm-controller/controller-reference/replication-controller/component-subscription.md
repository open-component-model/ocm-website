---
title: "Component Subscription"
description: ""
lead: ""
date: 2023-07-11T16:07:00+01:00
lastmod: 2023-07-11T16:07:00+01:00
draft: false
images: []
weight: 29
toc: true
---

The `ComponentSubscription` API produces component descriptors for a specific component version.

## Example

The following is an example of a ComponentSubscription:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentSubscription
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 10m0s
  component: phoban.io/podinfo
  semver: ">=6.3.x"
  source:
    url: ghcr.io/phoban01
  destination:
    url: ghcr.io/phoban01/foo
    secretRef:
      name: ghcr-credentials
```

In the above example:
- A ComponentSubscription named `podinfo` is created, indicated by the `.metadata.name` field.
- The replication-controller checks the Source repository every 10m0s, indicated by the `.spec.interval` field.
- It retrieves the version matching the semver constraint specified by `.spec.version.semver` field.
- Whenever a new version is available in the Source repository that satisfies `.spec.semver` and is greater than `.status.lastAppliedVersion` then the replication-controller will copy the component and all of it's resources to the OCI repository specified in `spec.destination`.

You can run this example by saving the manifest into `subscription.yaml`.

- 1. Create the registry access secret for GitHub Container Registry:
```bash
GITHUB_USER={USERNAME} # replace with your GitHub Username.
GITHUB_TOKEN={TOKEN} # replace with a GitHub Personal Access Token.
kubectl create secret generic ghcr-credentials \
  --from-literal=username=$GITHUB_USER \
  --from-literal=password=$GITHUB_TOKEN
```
- 2. Apply the resource to the cluster, (making sure to update the destination repository details for your own `ghcr.io` account):
```bash
 kubectl apply -f subscription.yaml
```
- 3. Run `kubectl get componentsubscriptions` to see the ComponentSubscription
```bash
NAME      AGE
podinfo   8s
```
- 4. Run `kubectl describe componentsubscription podinfo` to see the ComponentSubscription Status:
```bash
...
Status:
  Conditions:
    Last Transition Time:     2023-07-12T08:46:09Z
    Message:                  Reconciliation success
    Observed Generation:      1
    Reason:                   Succeeded
    Status:                   True
    Type:                     Ready
  Last Applied Version:       6.3.6
  Observed Generation:        1
  Replicated Repository URL:  ghcr.io/phoban01/foo
```

## Writing a ComponentSubscription spec

As with all other Kubernetes config, an ComponentSubscription needs `apiVersion`, `kind`, and `metadata` fields. The name of an ComponentSubscription object must be a valid DNS subdomain name.

An ComponentSubscription also needs a `.spec` [section](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status).

### Component

`.spec.component` is a required field that specifies the component's name.

### Version

`.spec.semver` specifies a semantic version constraint used to determine the range of versions to be replicated.

### Source Repository

`.spec.source` is a required field that provides the necessary configuration for the `replication-controller` to access the OCI repository where the source component versions are stored.

### Source Repository URL

`.spec.source.url` is a required field denoting the registry in which the source OCM components are stored.

### Source Repository Secret Reference

`.spec.source.secretRef.name` is an optional field to specify a name reference to a Secret in the same namespace as the ComponentSubscription, containing authentication credentials for the OCI repository.

This secret is expected to contain the keys `username` and `password`. You can create such a secret using `kubectl`:

Note: that for a publicly accessible source repository, you don’t need to provide credentials.

```bash
kubectl create secret generic registry-credentials --from-literal=username=$GITHUB_USER --from-literal=password=$GITHUB_TOKEN
```

### Destination Repository

`.spec.destination` is an optional field that provides the necessary configuration for the `replication-controller` to access the destination repository into which components will be replicated.

### Service Account Name

`.spec.serviceAccountName` is an optional field to specify a name reference to a Service Account in the same namespace as the ComponentSubscription. The controller will fetch the image pull secrets attached to the service account and use them for authentication.

### Interval

`.spec.interval` is a required field that specifies the interval at which the ComponentSubscription must be reconciled.

After successfully reconciling the object, the replication-controller requeues it for inspection after the specified interval. The value must be in a Go recognized duration string format, e.g. `10m0s` to reconcile the object every 10 minutes.

If the `.metadata.generation` of a resource changes (due to e.g. a change to the spec), this is handled instantly outside the interval window.

### Verify

`.spec.verify` is an optional list of signatures that should be validated before the component version is replicated. Each signature item consists of a `name` and a `publicKey`.

### Name

`.spec.verify.[].name` is a required field that specifies the name of the signature that should be verified.

### Public Key

`.spec.verify.[].publicKey` is a required field that specifies a reference to a secret containing the public key that can be used to verify the signature. The key of the public key in the secret must match the name of the signature.

For example, the following ComponentSubscription verifies two signatures:

```
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentSubscription
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 10m0s
  component: phoban.io/podinfo
  semver: ">=6.3.x"
  source:
    url: ghcr.io/phoban01
  destination:
    url: ghcr.io/phoban01/foo
    secretRef:
      name: ghcr-credentials
  verify:
  - name: operations
    publicKey:
      secretRef:
        name: signing-keys
  - name: security
    publicKey:
      secretRef:
        name: signing-keys
```

The accompanying secret should be in the following format:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: signing-keys
type: Opaque
data:
  operations: <BASE64>
  security: <BASE64>
```

## Debugging ComponentSubscriptions

There are several ways to gather information about a ComponentSubscription for debugging purposes.

### Describe the ComponentSubscription

Describing an ComponentSubscription using `kubectl describe componentsubscription <subscription-name>` displays the latest recorded information for the resource in the Status sections:

```bash
...
Status:
  Conditions:
    Last Transition Time:     2023-07-12T10:12:14Z
    Message:                  no matching versions found for constraint '>=7.3.x'
    Observed Generation:      2
    Reason:                   PullingLatestVersionFailed
    Status:                   False
    Type:                     Ready
  Last Applied Version:       6.3.6
  Observed Generation:        1
  Replicated Repository URL:  ghcr.io/phoban01/foo
```

Reconciliation errors are also logged by the controller. You can use a tool such as [stern](https://github.com/stern/stern) in tandem with `grep` to filter and refine the output of controller logs:

```bash
stern replication-controller -n ocm-system | grep ComponentSubscription
```

will output the following log stream:

```bash
replication-controller-76848b97c5-4flrl manager 2023-07-12T10:13:05Z    LEVEL(-4)       credentials configured  {"controller": "componentsubscription", "controllerGroup": "delivery.ocm.software", "controllerKind": "ComponentSubscription", "ComponentSubscription": {"name":"podinfo","namespace":"default"}, "namespace": "default", "name": "podinfo", "reconcileID": "a9eeba17-a533-4dc7-81fd-af97096d60aa"}
replication-controller-76848b97c5-4flrl manager 2023-07-12T10:13:06Z    ERROR   Reconciler error        {"controller": "componentsubscription", "controllerGroup": "delivery.ocm.software", "controllerKind": "ComponentSubscription", "ComponentSubscription": {"name":"podinfo","namespace":"default"}, "namespace": "default", "name": "podinfo", "reconcileID": "a9eeba17-a533-4dc7-81fd-af97096d60aa", "error": "failed to get latest component version: no matching versions found for constraint '>=7.3.x'"}
```

## ComponentSubscription Status

### Observed Generation

The replication-controller reports an observed generation in the ComponentSubscription's `.status.observedGeneration`. The observed generation is the latest `.metadata.generation`, which resulted in either a ready state or stalled due to an error it can not recover from without human intervention.

### Conditions

ComponentSubscription has various states during its lifecycle, reflected as Kubernetes Conditions. These are as follows:
- reconciling
- signature verification
- ready
- failed reconciling

### Last Applied Version

The `LastAppliedVersion` field holds information regarding the most up-to-date version that has been successfully replicated to the destination repository.

### Replicated Repository URL

`ReplicatedRepositoryURL` holds information regarding the repository's URL into which the last applied version has been replicated.
