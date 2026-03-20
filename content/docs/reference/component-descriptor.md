---
title: "Component Descriptor"
description: "Field reference for the OCM component descriptor — the serializable description of a component version."
icon: "📋"
weight: 12
toc: true
---

The component descriptor is the central data structure of the Open Component Model — a serializable description of a component version (YAML or JSON). Every component version in a [component repository](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/01-model.md#component-repositories) has exactly one component descriptor.

**Schema:** [Open Component Model v2 schema](https://github.com/open-component-model/open-component-model/blob/main/bindings/go/descriptor/v2/resources/schema-2020-12.json) (JSON Schema)

**Specification:** [OCM Specification — Elements](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md)

## Top-Level Structure

```yaml
component:
  componentReferences: null
  name: github.com/acme.org/myapp
  provider: acme.org
  repositoryContexts: null
  resources: null
  sources: null
  version: 1.0.0
meta:
  schemaVersion: v2
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `meta` | object | yes | Metadata of the component descriptor. |
| `meta.schemaVersion` | string | yes | Schema version of the component descriptor. Currently only `v2` is supported. |
| `component` | object | yes | The component specification. |
| `signatures` | array | no | Optional signing information for verifying component validity. |
| `nestedDigests` | array | no | Digest information for nested components. |

## `component`

Contains the component identity, provider, and all artifacts.

```yaml
component:
  componentReferences: null
  name: github.com/acme.org/myapp
  provider: acme.org
  repositoryContexts: null
  resources: null
  sources: null
  version: 1.0.0
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Unique name of the component following the Open Component Model naming convention. Must match `^[a-z][-a-z0-9]*([.][a-z][-a-z0-9]*)*[.][a-z]{2,}(/[a-z][-a-z0-9_]*([.][a-z][-a-z0-9_]*)*)+$`. Max 255 characters. |
| `version` | string | yes | Version of the component. Follows [relaxed semver](https://semver.org): full `major.minor.patch` is expected, but a `v` prefix and shorter forms like `1` or `1.0` are accepted as well. |
| `provider` | string | yes | The organization or entity that maintains the component (e.g. `ocm.software`). Must be non-empty. |
| `creationTime` | string | no | Creation time of the component version. RFC 3339 formatted date-time. |
| `labels` | array | no | Labels associated with the component. See [Labels](#labels). |
| `repositoryContexts` | array | yes | Previous repositories of the component. May be empty or null. |
| `resources` | array | yes | Resources created by the component or third parties. May be empty or null. See [Resources](#resources). |
| `sources` | array | yes | Sources that produced the component. May be empty or null. See [Sources](#sources). |
| `componentReferences` | array | yes | References to other component versions. May be empty or null. See [Component References](#component-references). |

### Component Name

The component name follows the pattern `<DNS domain>/<name>{/<name>}`. The DNS domain (and optionally leading name segments) **must** be owned by the component provider. This guarantees global uniqueness without a central registry.

Examples:

- `github.com/open-component-model/ocm`
- `acme.org/platform/frontend`

See [Component Identity](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#component-identity) in the specification.

## Resources

Artifacts described by a component version for delivery.

```yaml
component:
  resources:
  - access:
      imageReference: ghcr.io/acme/myapp:1.0.0@sha256:efa2b998...
      type: OCIImage
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: efa2b998...
    name: image
    relation: external
    type: ociImage
    version: 1.0.0
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the resource. Pattern: `^[a-z0-9]([-_+a-z0-9]*[a-z0-9])?$`, min 2 characters. |
| `type` | string | yes | Type of the resource. See [Artifact Types](#artifact-types). |
| `version` | string | no | Version of the resource (relaxed SemVer). Defaults to the component version if omitted. |
| `relation` | string | yes | Relation of the resource to the component (`local` or `external`). |
| `access` | object | yes | Access specification for the resource. Must include a `type` field. See [Access Specification](#access-specification). |
| `extraIdentity` | object | no | Additional identity attributes for the resource. Used when multiple resources share the same `name`. |
| `labels` | array | no | Labels associated with the resource. See [Labels](#labels). |
| `srcRefs` | array | no | References to sources that produced this resource. Each entry contains `identitySelector` (map) and optional `labels`. |
| `digest` | object | no | Optional digest of the resource. Present when the component is signed. See [Digest](#digest). |

### Element Identity

A resource is uniquely identified within a component version by `name` + `version` (if present) + `extraIdentity`.

```yaml
resources:
- name: ocmcli
  type: ociImage
  version: 0.5.0
  extraIdentity:
    architecture: amd64
    os: linux
- name: ocmcli
  type: ociImage
  version: 0.5.0
  extraIdentity:
    architecture: arm64
    os: linux
```

## Sources

Artifacts describing the sources a component version has been built from. Sources share the same base fields as resources but omit `relation`, `srcRefs`, and `digest`. See [Sources](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#sources) in the specification.

```yaml
component:
  sources:
  - access:
      localReference: sha256:727513969553bfcc603e1c0ae1a75d79e4132b58
      mediaType: application/x-tar
      type: localBlob/v1
    name: source-repo
    type: git
    version: 1.0.0
```

> **Note:** The access type for sources depends on how the source was stored. Common types include `localBlob` (stored alongside the component) and custom types like `gitHub`. The CLI accepts any access type string.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the source. Pattern: `^[a-z0-9]([-_+a-z0-9]*[a-z0-9])?$`, min 2 characters. |
| `type` | string | yes | Type of the source (e.g. `git`). |
| `version` | string | yes | Version of the source (relaxed SemVer). |
| `access` | object | yes | Access specification for the source. See [Access Specification](#access-specification). |
| `extraIdentity` | object | no | Additional identity attributes for the source. |
| `labels` | array | no | Labels associated with the source. |

## Component References

References to other component versions, forming a component hierarchy. The JSON key is `componentReferences`. A reference is resolved when the component version is processed, using [resolvers]({{< relref "docs/concepts/resolvers.md" >}}).

```yaml
component:
  componentReferences:
  - componentName: github.com/acme.org/frontend
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v4alpha1
      value: 04eb20b6...
    name: frontend
    version: 1.5.0
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Local name of the reference. Not the referenced component's name. |
| `componentName` | string | yes | Name of the referenced component. Same naming rules as `component.name`. |
| `version` | string | yes | Version of the referenced component (relaxed SemVer). |
| `extraIdentity` | object | no | Additional identity attributes for the reference. |
| `labels` | array | no | Labels associated with the reference. |
| `digest` | object | no | Optional digest of the referenced component. Present when signed. |

References are always resolved in the context of the current repository. They contain no location information, making them stable across transports.

## Access Specification

Describes how to technically retrieve artifact content. Every access specification has a `type` field that determines the access method and its additional attributes.

| Access Type | Description | Key Fields |
| ----------- | ----------- | ---------- |
| `localBlob` | Content stored alongside the component descriptor. | `localReference`, `mediaType`, `referenceName` (optional), `globalAccess` (optional) |
| `OCIImage` | Artifact in an OCI registry. Also accepted: `ociRegistry`, `ociImage`. | `imageReference` |
| `OCIImageLayer` | Single blob in an OCI repository. Legacy alias: `ociBlob`. | `ref`, `mediaType`, `digest`, `size` |
| `Helm` | Helm chart in a Helm repository or OCI registry. Legacy alias: `helm`. | `helmRepository`, `helmChart`, `version` (optional) |

Access types may include a version suffix (e.g. `localBlob/v1`, `ociArtifact/v1`, `OCIImageLayer/v1`, `Helm/v1`).

```yaml
# localBlob — content stored with the component version
access:
  type: localBlob/v1
  localReference: sha256:57563cb4...
  mediaType: application/json

# OCIImage — image in an OCI registry
access:
  type: OCIImage
  imageReference: ghcr.io/acme/myapp:1.0.0@sha256:efa2b998...

```

See the [OCM Specification — Access Methods](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#access-specification) for the full definition.

## Artifact Types

The `type` field on resources and sources describes the logical meaning of the artifact.

| Type | Description |
| ---- | ----------- |
| `helmChart` | A Helm chart (OCI artifact or tar archive). |
| `ociImage` | An OCI container image or image index. |

The `type` field is a free-form string. Any value is accepted (e.g. `blob` for generic binary data), but the types above have built-in support in the new OCM implementation.

See [Artifact Types](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#artifact-types) in the specification.

## Labels

Key-value metadata that can appear on the component version, resources, sources, and references.

```yaml
labels:
- name: org
  value: acme.org
- name: purpose
  value: production
  signing: true
  version: v1
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the label. Must be non-empty. Centrally defined names use `[a-z][a-zA-Z0-9]*`. Vendor-specific names use `<DNS domain>/name`. |
| `value` | any | yes | Any JSON-compatible YAML value (string, number, object, array, boolean). |
| `version` | string | no | Version of the label. Pattern: `^v[0-9]+$`. |
| `signing` | boolean | no | Indicates whether the label should be included in the signature. Default: `false`. |

## Digest

Cryptographic hash of artifact content or a component descriptor.

```yaml
digest:
  hashAlgorithm: SHA-256
  normalisationAlgorithm: genericBlobDigest/v1
  value: efa2b9980ca2de65dc5a0c8cc05638b1a4b4ce8f6972dc08d0e805e5563ba5bb
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `hashAlgorithm` | string | yes | Algorithm used for hashing (e.g. `SHA-256`, `SHA-512`). |
| `normalisationAlgorithm` | string | yes | Algorithm used for normalizing content before hashing (e.g. `genericBlobDigest/v1`, `jsonNormalisation/v4alpha1`). |
| `value` | string | yes | The actual hash value (hex-encoded). |

## `signatures`

Cryptographic signatures proving the component version has not been tampered with.

```yaml
signatures:
- name: acme-release
  digest:
    hashAlgorithm: SHA-256
    normalisationAlgorithm: jsonNormalisation/v4alpha1
    value: 4faff782...
  signature:
    algorithm: RSASSA-PSS
    mediaType: application/vnd.ocm.signature.rsa
    value: 26468587...
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the signature. Unique within the component version. |
| `digest` | object | yes | Digest information for the signature. See [Digest](#digest). |
| `signature` | object | yes | Signature details. |
| `signature.algorithm` | string | yes | Algorithm used for signing (e.g. `RSASSA-PSS`, `RSASSA-PKCS1-V1_5`). |
| `signature.mediaType` | string | yes | Media type of the signature value (e.g. `application/vnd.ocm.signature.rsa`). |
| `signature.value` | string | yes | The actual signature value. |
| `signature.issuer` | string | no | Optionally identifies the signer. Can be an RFC 2253 Distinguished Name or a free-form identifier. |

See [Signing and Verification](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/02-signing.md) in the specification.

## `nestedDigests`

Digest information for aggregated component versions whose digests cannot be persisted in the referenced component itself but must be incorporated into signatures.

```yaml
nestedDigests:
- name: github.com/acme.org/frontend
  version: 1.5.0
  digest:
    hashAlgorithm: SHA-256
    normalisationAlgorithm: jsonNormalisation/v4alpha1
    value: 04eb20b6...
  resourceDigests:
  - name: image
    version: 1.5.0
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 6c1975b8...
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `name` | string | yes | Name of the component. |
| `version` | string | yes | Version of the component. |
| `digest` | object | no | Digest information for the component. |
| `resourceDigests` | array | no | Digest information for resources in the component. Each entry has `name`, `version`, optional `extraIdentity`, and `digest`. |

## `repositoryContexts`

Transport history — the list of repositories this component version has been stored in.

```yaml
component:
  repositoryContexts:
  - baseUrl: ghcr.io
    componentNameMapping: urlPath
    subPath: acme/ocm
    type: OCIRepository
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `type` | string | yes | Type of the repository (e.g. `OCIRepository`). Legacy descriptors may use `OCIRegistry`. |

Additional fields depend on the repository type. For `OCIRepository`:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `baseUrl` | string | yes | Registry host (e.g. `ghcr.io`). |
| `subPath` | string | no | Repository path prefix. |
| `componentNameMapping` | string | no | How component names map to repository paths. Known value: `urlPath`. |

This field is informational and does not affect component resolution.

## Full Example

A component descriptor as output by the new OCM CLI, showing resources (external image, local blob, extra identity), sources, and a component reference. The `nestedDigests` and `signatures` sections are omitted here; see their respective sections above for the schema.

<details>
<summary>Show full descriptor</summary>

```yaml
component:
    componentReferences:
    - componentName: github.com/acme.org/frontend
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: jsonNormalisation/v4alpha1
        value: d47eb8f20115a9f66f8473b0c69c26bbf03b3c7d...
      name: frontend
      version: 1.5.0
    name: github.com/acme.org/myapp
    provider: acme.org
    repositoryContexts: null
    resources:
    - access:
        imageReference: ghcr.io/acme/myapp:1.0.0@sha256:d2b3cd93...
        type: OCIImage
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: d2b3cd93a48acdc91327533ce28fcb3169b2d9fe...
      name: image
      relation: external
      type: ociImage
      version: 1.0.0
    - access:
        localReference: sha256:510beb7dd2632863bd15facbd523ee53...
        mediaType: application/json
        type: localBlob/v1
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: 510beb7dd2632863bd15facbd523ee537e9c84df...
      name: config
      relation: local
      type: blob
      version: 1.0.0
    - access:
        imageReference: ghcr.io/acme/myapp-cli:1.0.0@sha256:d2b3cd93...
        type: OCIImage
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: d2b3cd93a48acdc91327533ce28fcb3169b2d9fe...
      extraIdentity:
        architecture: amd64
        os: linux
      name: cli
      relation: external
      type: ociImage
      version: 1.0.0
    - access:
        imageReference: ghcr.io/acme/myapp-cli:1.0.0@sha256:6c1975b8...
        type: OCIImage
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: 6c1975b871efb327528c84d46d38e6dd7906eece...
      extraIdentity:
        architecture: arm64
        os: linux
      name: cli
      relation: external
      type: ociImage
      version: 1.0.0
    sources:
    - access:
        localReference: sha256:727513969553bfcc603e1c0ae1a75...
        mediaType: application/x-tar
        type: localBlob/v1
      name: source-repo
      type: git
      version: 1.0.0
    version: 1.0.0
meta:
  schemaVersion: v2
```

</details>

## Related

- [Build a Multi-Component Product]({{< relref "../tutorials/advanced-component-constructor.md" >}}) — how to write a `component-constructor.yaml` and build component versions
- [Signing and Verification]({{< relref "../tutorials/signing-and-verification.md" >}}) — how to sign and verify component versions
