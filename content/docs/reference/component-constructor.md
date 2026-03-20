---
title: "Component Constructor"
description: "Field reference for the component constructor — the input format used by the OCM CLI to build component versions."
icon: "🔧"
weight: 11
toc: true
---

The component constructor is the input format used by the OCM CLI to build component versions (YAML or JSON). It describes one or more component versions and their artifacts.

## Top-Level Structure

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: ocm.software/example/myapp
  version: 1.0.0
  provider:
    name: ocm.software
  labels: []
  labels: []
  resources: []
  sources: []
  componentReferences: []
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `components` | array | yes | List of component specifications to build. |

Each entry in `components` defines one component version.

Alternatively, a single component can be specified directly as the top-level object (without the `components` wrapper).

## Component

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the component. Must match `^[a-z][-a-z0-9]*([.][a-z][-a-z0-9]*)*[.][a-z]{2,}(/[a-z][-a-z0-9_]*([.][a-z][-a-z0-9_]*)*)+$`. Max 255 characters. |
| `version` | string | yes | Version of the component. [Relaxed semver](https://semver.org) — optional `v` prefix. |
| `provider` | object | yes | Provider type of the component in the origin's context. |
| `provider.name` | string | yes | Name of the provider (e.g. `ocm.software`). |
| `provider.labels` | array | no | Labels on the provider. See [Labels](#labels). |
| `labels` | array | no | Labels associated with the component. See [Labels](#labels). |
| `resources` | array | no | Resources created by the component or third parties. See [Resources](#resources). |
| `sources` | array | no | Sources that produced the component. See [Sources](#sources). |
| `componentReferences` | array | no | References to other component versions. See [Component References](#component-references). |
| `creationTime` | string | no | Creation time of the component version. RFC 3339 formatted date-time. |

### Environment Variable Substitution

Any string value supports `${VARIABLE}` substitution from the shell environment. Undefined variables expand to empty strings.

```yaml
version: ${VERSION}
```

## Resources

Each resource describes a delivery artifact. A resource must have exactly one of `input` (embed by value) or `access` (reference by location).

### Resource with `input`

```yaml
resources:
- name: manifests
  type: blob
  version: 1.0.0
  relation: local
  extraIdentity:
    arch: amd64
  labels: []
  sourceRefs: []
  input:
    type: dir
    path: ./deploy
    compress: true
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the resource. Pattern: `^[a-z0-9]([-_+a-z0-9]*[a-z0-9])?$`, min 2 characters. |
| `type` | string | yes | Type of the resource. See [Artifact Types](#artifact-types). |
| `input` | object | yes | Input specification for the resource. See [Input Types](#input-types). |
| `extraIdentity` | object | no | Additional identity attributes for the resource. |
| `labels` | array | no | Labels associated with the resource. |
| `sourceRefs` | array | no | References to sources that produced this resource. |
| `version` | string | no | Version of the resource (relaxed semver). Defaults to the component version. |
| `relation` | string | no | Must be `local` if specified. Defaults to `local`. |

### Resource with `access`

```yaml
resources:
- name: image
  type: ociImage
  version: 1.0.0
  relation: external
  extraIdentity:
    arch: amd64
  labels: []
  sourceRefs: []
  access:
    type: OCIImage/v1
    imageReference: ghcr.io/acme/myapp:1.0.0
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the resource. |
| `type` | string | yes | Type of the resource. See [Artifact Types](#artifact-types). |
| `access` | object | yes | Access specification for the resource. See [Access Types](#access-types). |
| `version` | string | no | Version of the resource (relaxed semver). Defaults to the component version. |
| `relation` | string | no | Relation of the resource to the component (`local` or `external`). Default: `external`. |
| `extraIdentity` | object | no | Additional identity attributes for the resource. |
| `labels` | array | no | Labels associated with the resource. |
| `sourceRefs` | array | no | References to sources that produced this resource. |

## Sources

Source code references for provenance tracking. Like resources, each source has either `input` or `access`.

```yaml
sources:
- name: source
  type: filesystem
  version: 1.0.0
  extraIdentity:
    arch: amd64
  labels: []
  input:
    type: dir
    path: ./src
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | --- |
| `name` | string | yes | Name of the source. Pattern: `^[a-z0-9]([-_+a-z0-9]*[a-z0-9])?$`, min 2 characters. |
| `type` | string | yes | Type of the source (e.g. `git`, `filesystem`). |
| `access` or `input` | object | yes | Exactly one of the two. Same types as for resources. |
| `version` | string | yes | Version of the source (relaxed semver). |
| `extraIdentity` | object | no | Additional identity attributes for the source. |
| `labels` | array | no | Labels associated with the source. |

## Component References

References to other component versions, creating a component hierarchy.

```yaml
componentReferences:
- name: frontend
  componentName: ocm.software/tutorials/frontend
  version: 1.5.0
  extraIdentity:
    arch: amd64
  labels: []
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Local name of the reference. |
| `componentName` | string | yes | Name of the referenced component. Same naming rules as the component `name`. |
| `version` | string | yes | Version of the referenced component. |
| `extraIdentity` | object | no | Additional identity attributes for the reference. |
| `labels` | array | no | Labels associated with the reference. |

Referenced components must be reachable at build time — either defined in the same constructor file or available in a repository accessible through configured [resolvers]({{< relref "docs/concepts/resolvers.md" >}}).

## Input Types

Input types embed content directly into the component version. The following input types are supported:

| Type | Description |
| ---- | ----------- |
| `dir/v1` | Embeds a directory as a tar archive. Short form: `dir`. |
| `file/v1` | Embeds a single file. Short form: `file`. |
| `helm/v1` | Embeds a Helm chart from a local path or remote repository. Short form: `helm`. |
| `utf8/v1` | Embeds inline text or structured data (JSON, YAML). Short form: `utf8`. |

For field-level details and examples, see [Input and Access Types]({{< relref "input-and-access-types.md" >}}).

## Access Types

Access types store a reference to external content. The content is not embedded — it must be resolvable at the destination.

| Type | Description |
| ---- | ----------- |
| `OCIImage/v1` | References an OCI artifact by image reference. Short form: `OCIImage`. Legacy aliases: `ociArtifact`, `ociRegistry`, `ociImage`. |
| `localBlob/v1` | References content stored alongside the component descriptor. Short form: `localBlob`. |
| `OCIImageLayer/v1` | References a single blob in an OCI repository by digest. Short form: `OCIImageLayer`. Legacy alias: `ociBlob`. |
| `Helm/v1` | References a Helm chart in a Helm repository or OCI registry. Short form: `Helm`. Legacy alias: `helm`. |
| `File/v1alpha1` | References a file by URI (RFC 8089). Short form: `File`. Legacy alias: `file`. **Alpha — schema may change.** |

For field-level details and examples, see [Input and Access Types]({{< relref "input-and-access-types.md" >}}).

## Artifact Types

The `type` field on resources and sources declares the logical meaning of the artifact.

| Type | Description |
| ---- | ----------- |
| `blob` | Untyped binary data (e.g. configuration files, scripts). |
| `helmChart` | A Helm chart (e.g. stored as OCI artifact or chart archive). |
| `ociImage` | An OCI container image (e.g. application containers, sidecars). |

## Labels

Key-value metadata on components, resources, sources, references, or the provider.

```yaml
labels:
- name: purpose
  value: production
  signing: true
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the label. |
| `value` | any | yes | Any JSON-compatible YAML value. |
| `version` | string | no | Version of the label. Pattern: `^v[0-9]+$`. |
| `signing` | boolean | no | Indicates whether the label should be included in the signature. |

See [Component Descriptor — Labels]({{< relref "component-descriptor.md#labels" >}}) for the full specification.

## Schema Validation

Add the following comment as the first line of the constructor file to enable IDE validation and autocompletion:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
```

## Related

- [Component Descriptor]({{< relref "component-descriptor.md" >}}) — field reference for the output format
- [Create Component Versions]({{< relref "docs/getting-started/create-component-version.md" >}}) — getting started with `ocm add cv`
- [Advanced Component Constructor]({{< relref "docs/tutorials/advanced-component-constructor.md" >}}) — tutorial on multi-level component hierarchies
- [Input and Access Types]({{< relref "input-and-access-types.md" >}}) — field reference for all input and access types
- [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) — formal specification
