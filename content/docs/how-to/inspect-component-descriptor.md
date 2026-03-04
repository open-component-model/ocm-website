---
title: "Inspect a Component Descriptor"
description: "Retrieve a component descriptor and understand its structure: identity, resources, sources, references, and signatures."
icon: "🔍"
weight: 49
toc: true
---

This guide walks you through retrieving and reading a component descriptor — the YAML document at the heart of every OCM component version.

## You'll end up with

- A clear understanding of each section in a component descriptor
- The ability to inspect any component version stored in an OCI registry or CTF archive

## Estimated time

~5 minutes

## Prerequisites

- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- Access to a component version (local CTF archive or remote OCI registry)

## Walk Through a Component Descriptor

{{< steps >}}
{{< step >}}

### Retrieve the descriptor

Fetch a component descriptor from a repository. For a local CTF archive:

```shell
ocm get cv ./transport-archive -o yaml
```

For a remote OCI registry:

```shell
ocm get cv --repo ghcr.io/acme/ocm github.com/acme.org/myapp -o yaml
```

The output is a YAML document with three top-level sections:

```yaml
meta:
  schemaVersion: v2
component:
  name: ...
  version: ...
  # ...
signatures:
- # ...
```

- **`meta`** — schema version of the descriptor format (currently `v2`)
- **`component`** — the component identity, provider, and all artifacts
- **`signatures`** — cryptographic signatures (only present if the component has been signed)

{{< /step >}}
{{< step >}}

### Identify the component

The first fields inside `component` establish the component's identity:

```yaml
component:
  name: github.com/acme.org/myapp
  version: v1.0.0
  provider: acme.org
```

- **`name`** — a globally unique identifier. Must start with a DNS domain controlled by the provider (e.g., `github.com/acme.org/...`).
- **`version`** — a [semantic version](https://semver.org). An optional `v` prefix is allowed.
- **`provider`** — the organization or entity that maintains this component.

Together, `name` + `version` uniquely identify this component version across all repositories. See the [Component Identity](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#component-identity) specification.

{{< /step >}}
{{< step >}}

### Read the resources

Resources are the delivery artifacts — container images, Helm charts, files, or any other content the component ships:

```yaml
  resources:
  - name: image
    type: ociImage
    version: v0.14.1
    relation: external
    access:
      type: ociArtifact
      imageReference: ghcr.io/acme/myapp:v0.14.1
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: efa2b998...
```

Key fields:

- **`name`** — identity of the resource within this component version
- **`type`** — what kind of artifact it is (`ociImage`, `helmChart`, `blob`, `fileSystem`, etc.). See [Artifact Types](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#artifact-types).
- **`version`** — the resource's own version
- **`relation`** — `local` means the provider created it; `external` means it comes from a third party
- **`access`** — how to retrieve the content. The `type` field determines the [access method](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#access-specification) (e.g., `ociArtifact` for OCI registries, `localBlob` for content stored alongside the descriptor)
- **`digest`** — cryptographic hash of the content, present when the component is signed

A component version can have multiple resources. List them with:

```shell
ocm get resources ./transport-archive
```

{{< /step >}}
{{< step >}}

### Read the sources

Sources record where the component's code originates. They follow the same structure as resources but omit `relation`:

```yaml
  sources:
  - name: source-repo
    type: git
    version: v1.0.0
    access:
      type: gitHub
      repoUrl: github.com/acme/myapp
      ref: refs/tags/v1.0.0
      commit: 727513969553bfcc603e1c0ae1a75d79e4132b58
```

Sources are not deployed — they exist for audit trails and provenance tracking. A component version may have zero or more sources.

{{< /step >}}
{{< step >}}

### Read the component references

Component references link to other component versions, forming a product hierarchy:

```yaml
  componentReferences:
  - name: frontend
    componentName: github.com/acme.org/frontend
    version: v1.5.0
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v1
      value: 04eb20b6...
```

- **`name`** — the reference's identity within this component version (not the referenced component's name)
- **`componentName`** — the globally unique name of the referenced component
- **`version`** — which version of the referenced component
- **`digest`** — digest of the referenced component's descriptor, present when signed

References are always resolved in the context of the current repository. This makes them stable across transports — the same reference works regardless of where the component lives. See [Referencing](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/01-references.md) in the OCM specification.

To see the full tree of references:

```shell
ocm get cv ./transport-archive --recursive
```

{{< /step >}}
{{< step >}}

### Read the labels

Labels attach key-value metadata to the component, resources, sources, or references:

```yaml
  labels:
  - name: org
    value: acme.org
  - name: purpose
    value: demo
    signing: true
```

- **`name`** — label identifier. Use `<domain>/name` for vendor-specific labels.
- **`value`** — any JSON-compatible value (string, number, object, array)
- **`signing`** — if `true`, this label is included when computing the component's signature. Labels without `signing: true` can change without invalidating signatures.

See the [Labels](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#labels) specification for naming conventions and merge behavior.

{{< /step >}}
{{< step >}}

### Read the signatures

Signatures prove the component version hasn't been tampered with:

```yaml
signatures:
- name: acme-release
  digest:
    hashAlgorithm: SHA-256
    normalisationAlgorithm: jsonNormalisation/v1
    value: 4faff782...
  signature:
    algorithm: RSASSA-PSS
    mediaType: application/vnd.ocm.signature.rsa
    value: 26468587...
```

- **`name`** — identifies this signature (a component can have multiple signatures from different parties)
- **`digest`** — hash of the [normalized](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/02-signing.md) component descriptor. The normalization algorithm strips volatile fields (like access specs) so the digest remains stable across transports.
- **`signature`** — the cryptographic payload, including the algorithm and encoding format

To verify a signature:

```shell
ocm verify cv --repo ghcr.io/acme/ocm --signature acme-release --public-key key.pub github.com/acme.org/myapp
```

For details on signing and verification, see [Signing and Verification]({{< relref "signing-and-verification.md" >}}).

{{< /step >}}
{{< step >}}

### Check the repository contexts

The `repositoryContexts` list records the transport history — which repositories this component version has passed through:

```yaml
  repositoryContexts:
  - baseUrl: ghcr.io
    componentNameMapping: urlPath
    subPath: acme/ocm
    type: OCIRegistry
```

The most recent repository is at the top. This field is informational — it helps trace where a component has been, but does not affect how the component is used. See [Repository Contexts](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/03-elements-sub.md#repository-contexts) in the specification.

{{< /step >}}
{{< /steps >}}

## Example Descriptor

A signed component descriptor combining all sections above:

<details>
<summary>Show full descriptor</summary>

```yaml
meta:
  # component schema version
  schemaVersion: v2
component:
  # globally unique component name (DNS domain prefix controlled by provider)
  name: github.com/acme.org/myapp
  # semantic version
  version: v1.0.0
  # component provider
  provider: acme.org
  # key-value metadata (can also appear on resources, sources, references)
  labels:
  - name: org
    value: acme.org
  - name: purpose
    value: demo
    signing: true
  # transport history — most recent repository first
  repositoryContexts:
  - baseUrl: ghcr.io
    componentNameMapping: urlPath
    subPath: acme/ocm
    type: OCIRegistry
  # delivery artifacts
  resources:
  - name: image
    # local = same provider, external = third-party
    relation: external
    # artifact type
    type: ociImage
    version: v1.0.0
    # how to retrieve the content
    access:
      type: ociArtifact
      imageReference: ghcr.io/acme/myapp:v1.0.0
    # signing metadata (present if component has been signed)
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: efa2b9980ca2de65dc5a0c8cc05638b1a4b4ce8f6972dc08d0e805e5563ba5bb
  # source code references
  sources:
  - name: source-repo
    type: git
    version: v1.0.0
    access:
      type: gitHub
      repoUrl: github.com/acme/myapp
      ref: refs/tags/v1.0.0
      commit: 727513969553bfcc603e1c0ae1a75d79e4132b58
  # references to other component versions
  componentReferences:
  - name: frontend
    componentName: github.com/acme.org/frontend
    version: v1.5.0
    # digest of the referenced component descriptor
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v1
      value: 04eb20b6fd942860325caf7f4415d1acf287a1aabd9e4827719328ba25d6f801
# signatures used for signing and verification
signatures:
  # signature name
- name: acme-release
  # digest of the normalized component descriptor
  digest:
    hashAlgorithm: SHA-256
    normalisationAlgorithm: jsonNormalisation/v1
    value: 4faff7822616305ecd09284d7c3e74a64f2269dcc524a9cdf0db4b592b8cee6a
  # cryptographic signature
  signature:
    algorithm: RSASSA-PSS
    mediaType: application/vnd.ocm.signature.rsa
    value: 26468587671bdbd2166cf5f69829f090c10768511b15e804294fcb26e552654316...
```

</details>

## Related

- [Use the Component Constructor]({{< relref "use-component-constructor.md" >}}) — how to write a `component-constructor.yaml` and build component versions
- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) — how to sign and verify component versions
