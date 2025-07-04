---
title: "Component Version"
description: "Learn about the CRD for a Component Version"
icon: "📄"
weight: 44
toc: true
---

The `ComponentVersion` API produces component descriptors for a specific component version.

## Example

The following is an example of a ComponentVersion:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 10m0s
  component: phoban.io/podinfo
  repository:
    url: ghcr.io/phoban01
  version:
    semver: ">=6.3.x"
```

In the above example:

- A ComponentVersion named `podinfo` is created, indicated by the `.metadata.name` field.
- The ocm-controller checks the OCM repository every 10m0s, indicated by the `.spec.interval` field.
- It retrieves the version matching the semver constraint specified by `.spec.version.semver` field.
- The resolved component descriptor and version are written to the `.status.componentDescriptor` and `.status.reconciledVersion` fields.
- Whenever a new version is available that satisfies `.spec.version.semver` and is greater than `.status.reconciledVersion` then the ocm-controller will fetch the new component version.

You can run this example by saving the manifest into `componentversion.yaml`.

1. Apply the resource to the cluster:

    ```bash
    kubectl apply -f componentversion.yaml
    ```

2. Run `kubectl get componentversion` to see the ComponentVersion

    ```bash
    NAME      READY   VERSION   AGE   STATUS
    podinfo   True    6.3.6     8s    Applied version: 6.3.6
    ```

3. Run `kubectl describe componentversion podinfo` to see the ComponentVersion Status:

    ```bash
    Name:         podinfo
    Namespace:    default
    Labels:       <none>
    Annotations:  <none>
    API Version:  delivery.ocm.software/v1alpha1
    Kind:         ComponentVersion
    Metadata:
    Creation Timestamp:  2023-06-28T15:41:57Z
    Generation:          1
    Resource Version:    235307145
    UID:                 318963a5-3b4f-4098-b324-348a57e532ff
    Spec:
    Component:  phoban.io/podinfo
    Interval:   10m0s
    Repository:
        URL:  ghcr.io/phoban01
    Version:
        Semver:  >=6.3.x
    Status:
    Component Descriptor:
        Component Descriptor Ref:
        Name:       phoban.io-podinfo-6.3.6-10372358058082697739
        Namespace:  default
        Name:         phoban.io/podinfo
        Version:      6.3.6
    Conditions:
        Last Transition Time:  2023-06-28T15:42:01Z
        Message:               Applied version: 6.3.6
        Observed Generation:   1
        Reason:                Succeeded
        Status:                True
        Type:                  Ready
    Observed Generation:     1
    Reconciled Version:      6.3.6
    Events:
    Type    Reason       Age   From            Message
    ----    ------       ----  ----            -------
    Normal  Progressing  46s   ocm-controller  Version check succeeded, found latest version: 6.3.6
    Normal  Succeeded    43s   ocm-controller  Reconciliation finished, next run in 10m0s
    ```

4. View the ComponentDescriptor for this ComponentVersion by running

    ```bash
    kubectl get componentdescriptor -oyaml \
    $(kubectl get cv podinfo -ojsonpath="{.status.componentDescriptor.componentDescriptorRef.name}")
    ```

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentDescriptor
metadata:
  creationTimestamp: "2023-06-28T15:42:01Z"
  generation: 1
  name: phoban.io-podinfo-6.3.6-10372358058082697739
  namespace: default
  ownerReferences:
  - apiVersion: delivery.ocm.software/v1alpha1
    kind: ComponentVersion
    name: podinfo
    uid: 318963a5-3b4f-4098-b324-348a57e532ff
  resourceVersion: "235307140"
  uid: 4efd4eb2-cb2d-4e0d-ae3c-f74cc59e3fa0
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:265a95fcccabded6d2040e1438b8b1c5bef1441adb60039adf54640c00b84003
        mediaType: application/x-tar
        ref: ghcr.io/phoban01/component-descriptors/phoban.io/podinfo
        size: 3072
        type: ociBlob
      localReference: sha256:265a95fcccabded6d2040e1438b8b1c5bef1441adb60039adf54640c00b84003
      mediaType: application/x-tar
      type: localBlob
    name: deployment
    relation: local
    type: Directory
    version: 6.3.6
  - access:
      globalAccess:
        digest: sha256:b3fe60d3213e6c11006b6f62d9f1bcc6a6e12da1b3aa5ee9f27943710262d351
        mediaType: application/octet-stream
        ref: ghcr.io/phoban01/component-descriptors/phoban.io/podinfo
        size: 515
        type: ociBlob
      localReference: sha256:b3fe60d3213e6c11006b6f62d9f1bcc6a6e12da1b3aa5ee9f27943710262d351
      mediaType: application/octet-stream
      type: localBlob
    name: config
    relation: local
    type: PlainText
    version: 6.3.6
  - access:
      imageReference: ghcr.io/stefanprodan/podinfo:6.3.5
      type: ociArtifact
    name: image
    relation: external
    type: ociImage
    version: 6.3.5
  version: 6.3.6
```

## Writing a ComponentVersion spec

As with all other Kubernetes config, an ComponentVersion needs `apiVersion`, `kind`, and `metadata` fields. The name of an ComponentVersion object must be a valid DNS subdomain name.

An ComponentVersion also needs a `.spec` [section](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#spec-and-status).

### Component

`.spec.component` is a required field that specifies the name of the component.

### Version

`.spec.version.semver` specifies a semantic version constraint that is used to determine the specific component version or range of versions that will be reconciled.

### Repository

`.spec.repository` provides the necessary configuration for the `ocm-controller` to access the OCI repository where the component version is stored.

### URL

`.spec.repository.url` is a required field that denoting the registry in which the OCM component is stored.

### Secret Reference

`.spec.repository.secretRef.name` is an optional field to specify a name reference to a Secret in the same namespace as the ComponentVersion, containing authentication credentials for the OCI repository.

This secret is expected to contain the keys `username` and `password`. You can create such a secret using `kubectl`:

```bash
kubectl create secret generic registry-credentials --from-literal=username=$GITHUB_USER --from-literal=password=$GITHUB_TOKEN
```

### Service Account Name

`.spec.serviceAccountName` is an optional field to specify a name reference to a Service Account in the same namespace as the ComponentVersion. The controller will fetch the image pull secrets attached to the service account and use them for authentication.

{{<callout context="note" title="Public OCI Repository access">}}that for a publicly accessible OCI repository, you don’t need to provide a secretRef nor serviceAccountName.{{</callout>}}

### Interval

`.spec.interval` is a required field that specifies the interval at which the ComponentVersion must be reconciled.

After successfully reconciling the object, the ocm-controller requeues it for inspection after the specified interval. The value must be in a Go recognized duration string format, e.g. `10m0s` to reconcile the object every 10 minutes.

If the `.metadata.generation` of a resource changes (due to e.g. a change to the spec), this is handled instantly outside the interval window.

### Verify

`.spec.verify` is an optional list of signatures that should be validated before the component version is marked as verified. A ComponentVersion that is not verified will not be consumed by downstream ocm-controller resources. Each signature item consists of a `name` and a `publicKey`.

### Name

`.spec.verify.[].name` is a required field that specifies the name of the signature that should be verified.

### Public Key

`.spec.verify.[].publicKey` is a required field that specifies a reference to a secret containing the public key that can be used to verify the signature. The key of the public key in the secret must match the name of the signature.

For example, the following ComponentVersion verifies two signatures:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfo
  namespace: default
spec:
  interval: 10m0s
  component: phoban.io/podinfo
  repository:
    url: ghcr.io/phoban01
  version:
    semver: ">=6.3.x"
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

### Suspend

`.spec.suspend` is an optional field to suspend the reconciliation of a ComponentVersion. When set to true, the controller will stop reconciling the ComponentVersion. When the field is set to false or removed, it will resume.

## Debugging ComponentVersions

There are several ways to gather information about a ComponentVersion for debugging purposes.

### Describe the ComponentVersion

Describing an ComponentVersion using `kubectl describe componentversion <repository-name>` displays the latest recorded information for the resource in the Status and Events sections:

```bash
...
Status:
...
  Conditions:
    Last Transition Time:  2023-06-29T11:54:23Z
    Message:               reconcilation in progress for component: phoban.io/podinfo
    Observed Generation:   1
    Reason:                ProgressingWithRetry
    Status:                True
    Type:                  Reconciling
    Last Transition Time:  2023-06-29T11:54:23Z
    Message:               failed to verify phoban.io/podinfo with constraint >=6.3.x
    Observed Generation:   1
    Reason:                ComponentVerificationFailed
    Status:                False
    Type:                  Ready
Events:
  Type     Reason                       Age   From            Message
  ----     ------                       ----  ----            -------
  Normal   Progressing                  18s   ocm-controller  Version check succeeded, found latest version: 6.3.6
  Warning  ComponentVerificationFailed  16s   ocm-controller  failed to get public key for verification: public key not found, retrying in 10m0s
  Warning  ComponentVerificationFailed  16s   ocm-controller  Reconciliation did not succeed, retrying in 10m0s
```

### Trace emitted Events

To view events for specific ComponentVersion(s), `kubectl` events can be used in combination with `--for` to list the Events for specific objects. For example, running:

```bash
kubectl events --for ComponentVersion/<name>
```

outputs:

```bash
LAST SEEN               TYPE      REASON                        OBJECT                     MESSAGE
38s                     Warning   ComponentVerificationFailed   ComponentVersion/podinfo   failed to get public key for verification: public key not found, retrying in 10m0s
38s                     Warning   ComponentVerificationFailed   ComponentVersion/podinfo   Reconciliation did not succeed, retrying in 10m0s
```

Besides being reported in Events, the reconciliation errors are also logged by the controller. You can use a tool such as [stern](https://github.com/stern/stern) in tandem with `grep` to filter and refine the output of controller logs:

```bash
stern ocm-controller -n ocm-system | grep ComponentVersion
```

will output the following log stream:

```bash
ocm-controller-bcf4cbbb8-crd4d manager 2023-06-29T11:54:21Z     INFO    Version check succeeded, found latest version: 6.3.6    {"name": "podinfo", "namespace": "default", "reconciler kind": "ComponentVersion", "reason": "Progressing", "annotations": {}}
ocm-controller-bcf4cbbb8-crd4d manager 2023-06-29T11:54:23Z     ERROR   failed to get public key for verification: public key not found, retrying in 10m0s     {"name": "podinfo", "namespace": "default", "reconciler kind": "ComponentVersion", "annotations": {}, "error": "ComponentVerificationFailed"}
ocm-controller-bcf4cbbb8-crd4d manager github.com/open-component-model/ocm-controller/controllers.(*ComponentVersionReconciler).Reconcile
ocm-controller-bcf4cbbb8-crd4d manager 2023-06-29T11:54:23Z     ERROR   Reconciliation did not succeed, retrying in 10m0s       {"name": "podinfo", "namespace": "default", "reconciler kind": "ComponentVersion", "annotations": {}, "error": "ComponentVerificationFailed"}
ocm-controller-bcf4cbbb8-crd4d manager github.com/open-component-model/ocm-controller/controllers.(*ComponentVersionReconciler).Reconcile.func1
ocm-controller-bcf4cbbb8-crd4d manager github.com/open-component-model/ocm-controller/controllers.(*ComponentVersionReconciler).Reconcile
```

## ComponentVersion Status

### Observed Generation

The ocm-controller reports an observed generation in the ComponentVersion’s `.status.observedGeneration`. The observed generation is the latest `.metadata.generation` which resulted in either a ready state, or stalled due to error it can not recover from without human intervention.

### Conditions

ComponentVersion has various states during its lifecycle, reflected as Kubernetes Conditions. It can be reconciling while fetching the remote ComponentVersion or verifying signatures, it can be ready, or it can fail during reconciliation.

### Component Descriptor

The status contains a reference to the component descriptor for the reconciled component version.

The following fields make up the reference:

- `name`: name of the reconciled component.
- `version`: version of the reconciled component.
- `extraIdentity`: additional identity attributes of the reconciled component.
- `references`: a list of component references.
- `componentDescriptorRef`: a reference to the ComponentDescriptor Kubernetes representation.

### Reconciled Version

The reconciled version status field holds the specific version that was reconciled by the ocm-controller.

### Verified
