---
title: "Component Identity"
description: "How OCM identifies components, versions, and artifacts — from naming to descriptors."
icon: "🪪"
weight: 41
url: /docs/concepts/component-identity
toc: true
---

## Overview

OCM uses a coordinate system to uniquely identify every piece of software — from entire components down to individual artifacts. This page explains how that system works, what a component descriptor contains, and how identity stays stable regardless of where artifacts are stored.

For the high-level introduction, see [The OCM Core Model]({{< relref "docs/overview/core-model.md" >}}).

## Components and Component Versions

A **component** is a logical unit of software — a frontend, a database, an autoscaler, or an entire application. Components group a set of semantically related **component versions**.

Each component version is an immutable snapshot that contains:

- **Resources**: the deliverables (OCI images, Helm charts, binaries, configuration files).
- **Sources**: the inputs from which resources were built (git repositories, source archives).
- **References**: dependencies on other component versions.

A component version is always described by a [component descriptor](#the-component-descriptor) — a YAML document that lists every element and how to access it.

## Component Identity

Every component is identified by a **name** and a **version**. Together, they form the component's globally unique identity.

### Component Name

Component names follow a DNS-based naming scheme:

```text
<DNS domain>/<name component>{/<name component>}
```

The domain prefix must be controlled by the owner of the component, which prevents naming collisions across organizations. The remaining path segments further classify the component within the owner's namespace.

**Examples:**

| Component Name | Owner |
|---|---|
| `github.com/open-component-model/ocm` | OCM project |
| `acme.org/webshop/backend` | Acme Corp |
| `acme.org/webshop/frontend` | Acme Corp |

The name must match the regex: `^[a-z][-a-z0-9]*([.][a-z][-a-z0-9]*)*[.][a-z]{2,}(/[a-z][-a-z0-9_]*([.][a-z][-a-z0-9_]*)*)+$`

### Component Version

Versions must adhere to **relaxed SemVer**: major and minor segments are required, patch is optional, and a `v` prefix is allowed.

**Valid versions:** `1.0.0`, `v2.1`, `1.0.0-rc.1`, `v3.2.1+build.42`

### Combined Identity

A component identity is written as `name:version`:

```text
github.com/acme/webshop:1.0.0
```

This uniquely identifies one specific immutable snapshot of the `webshop` component.

## Artifact Identity

Artifact identities are always **relative to a component version**. They are not globally unique on their own — they only become globally unique when combined with a component identity.

Within a component version, every artifact (resource, source, or reference) must have a unique identity, defined by the following attributes:

| Attribute | Required | Purpose |
|---|---|---|
| `name` | Yes | Identifies the artifact. Typically describes its intended purpose (e.g., `backend-image`, `deploy-chart`). |
| `extraIdentity` | No | A string-to-string map that contributes to identity. Used for variants like `os: linux`, `architecture: amd64`. |
| `version` | No | Only contributes to identity when `name` + `extraIdentity` are not sufficient to disambiguate. |

**Global artifact identity** = component name + component version + artifact identity.

For example, the resource `backend-image` in `github.com/acme/webshop:1.0.0` has the global identity:

```text
github.com/acme/webshop:1.0.0:resource/backend-image
```

### Extra Identity for Variants

When a component version contains multiple variants of the same artifact (e.g., multi-architecture images), use `extraIdentity` to distinguish them:

```yaml
resources:
  - name: backend-image
    type: ociImage
    extraIdentity:
      architecture: amd64
      os: linux
  - name: backend-image
    type: ociImage
    extraIdentity:
      architecture: arm64
      os: linux
```

Both resources share the name `backend-image`, but their extra identity attributes make them unique within the component version.

## Coordinate Notation

OCM coordinates provide a shorthand for referencing elements in the model. Given a component `example.org/my-component` with versions `1.2.3` and `1.3.0`, each declaring a resource `my-resource`:

| Coordinate | Refers to |
|---|---|
| `example.org/my-component` | All versions of the component (1.2.3 + 1.3.0) |
| `example.org/my-component:1.2.3` | Version 1.2.3 of the component |
| `example.org/my-component:1.2.3:resource/my-resource` | The resource `my-resource` in version 1.2.3 |

The general pattern is:

```text
<component-name>[:<version>[:<artifact-type>/<artifact-name>]]
```

## The Component Descriptor

The component descriptor is a YAML document that fully describes a component version. It is the central data structure in OCM.

### Structure

```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/webshop
  version: 1.0.0
  provider:
    name: acme.org
  resources:
    - name: backend-image           # artifact identity
      type: ociImage                # artifact type
      version: 1.0.0               # artifact version
      relation: external           # local or external
      access:                      # how to retrieve the artifact
        type: ociArtifact
        imageReference: ghcr.io/acme/webshop/backend:1.0.0
      digest:                      # immutable content hash
        hashAlgorithm: SHA-256
        normalisationAlgorithm: ociArtifactDigest/v1
        value: abc123...
  sources:
    - name: source
      type: git
      version: 1.0.0
      access:
        type: github
        repository: github.com/acme/webshop
        commit: def456
  references:
    - name: database
      componentName: github.com/acme/postgres
      version: 14.2.0
  labels:
    - name: purpose
      value: demo
```

### Resources

Resources are the deliverables — the artifacts that get deployed or consumed. Each resource has:

| Field | Purpose |
|---|---|
| `name` | Artifact identity (required) |
| `type` | Semantic type (e.g., `ociImage`, `helmChart`, `blob`) |
| `version` | Version of this specific artifact |
| `relation` | `local` (built by this component) or `external` (from elsewhere) |
| `access` | Specification for how to retrieve the artifact |
| `digest` | Content hash for integrity verification |

### Sources

Sources describe the inputs from which resources were built:

| Field | Purpose |
|---|---|
| `name` | Artifact identity (required) |
| `type` | Source type (e.g., `git`) |
| `version` | Version of the source |
| `access` | Specification for how to retrieve the source |

### References

References declare dependencies on other component versions:

| Field | Purpose |
|---|---|
| `name` | Local reference name (required) |
| `componentName` | Full component name of the dependency |
| `version` | Version of the referenced component |

### Labels

Labels are extensible key-value metadata that can be attached to the component or any of its elements. They enable custom tooling and policy without modifying the core model.

For a field-by-field reference, see [Component Descriptor]({{< relref "docs/reference/component-descriptor.md" >}}).

## Artifact Types

Artifact types describe the semantic meaning of a resource or source. OCM defines two categories:

**Central types** use camelCase and are part of the OCM specification:

| Type | Description |
|---|---|
| `ociImage` | OCI container image |
| `helmChart` | Helm chart archive |
| `blob` | Untyped binary data |
| `directoryTree` | File system directory |
| `executable` | Platform-specific executable |

**Vendor-specific types** use DNS-based naming to avoid collisions:

| Type | Description |
|---|---|
| `landscaper.gardener.cloud/blueprint` | Landscaper blueprint |
| `acme.org/custom-config` | Custom artifact type |

The artifact type determines how tools interpret the content. It is independent of how the artifact is stored or accessed.

## Access Specifications

Access specifications decouple an artifact's identity from its storage location. The `access.type` field determines how to retrieve the artifact, while the remaining fields provide the location-specific details.

**Common access types:**

| Access Type | Description | Key Fields |
|---|---|---|
| `ociArtifact` | Artifact in an OCI registry | `imageReference` |
| `github` | Source in a GitHub repository | `repository`, `commit` |
| `localBlob` | Blob stored inline in the component archive | `localReference`, `mediaType` |
| `s3` | Object in S3-compatible storage | `bucket`, `key`, `region` |

The same artifact type can be accessed through different access specifications. For example, an `ociImage` could be stored in an OCI registry (`ociArtifact`) or bundled into a CTF archive (`localBlob`).

## Component Repositories and Storage

Component versions are stored in **component repositories**. OCM is technology-agnostic — the same component version can be stored in different repository implementations:

- **OCI registries** (e.g., GitHub Container Registry, Harbor, Docker Hub)
- **S3-compatible object storage**
- **Local filesystems**
- **CTF (Common Transport Format) archives**

### Common Transport Format (CTF)

CTF is an OCI-layout-compatible archive format designed for transporting component versions across boundaries. A CTF archive packages component descriptors and their artifacts into a single file that can be:

- Copied to removable media for air-gapped transfers.
- Uploaded to a different registry in a new environment.
- Verified and signed offline.

To create and work with CTF archives, see [Create Component Versions]({{< relref "docs/getting-started/create-component-version.md" >}}).

## Signing and Verification

Component versions can be cryptographically signed to ensure integrity and provenance. The signing model has important properties:

- **Digests** cover resources and references, providing tamper detection.
- **Access specifications are excluded** from the digest because they change when artifacts are transported to a new location — this is what makes location independence possible.
- **Multiple signatures** are supported, allowing different parties to independently attest to a component version.

For hands-on signing instructions, see [Sign Component Versions]({{< relref "docs/how-to/sign-component-version.md" >}}).

## Related Documentation

<!-- markdownlint-disable MD034 -->
{{< card-grid >}}
{{< link-card
  title="The OCM Core Model"
  description="High-level introduction to OCM's building blocks."
  href="/docs/overview/core-model/"
>}}
{{< link-card
  title="Create Component Versions"
  description="Build component versions with the OCM CLI."
  href="/docs/getting-started/create-component-version/"
>}}
{{< link-card
  title="Component Descriptor Reference"
  description="Field-by-field reference for the component descriptor."
  href="/docs/reference/component-descriptor/"
>}}
{{< link-card
  title="OCM Specification"
  description="The formal specification of the Open Component Model."
  href="https://github.com/open-component-model/ocm-spec"
>}}
{{< /card-grid >}}
