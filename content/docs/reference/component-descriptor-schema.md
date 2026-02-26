---
title: "Component Descriptor Schema"
description: "JSON Schema reference for validating OCM Component Descriptors. Includes schema download, structure overview, and field documentation."
weight: 10
toc: true
---

The Component Descriptor is the central metadata document in the Open Component Model.
It describes a component version with all its resources, sources, and references to other components.

{{< callout context="note" title="Component Descriptor vs. Component Constructor" icon="outline/info-circle" >}}
This schema is for **Component Descriptors** (the final output artifact stored in registries).

If you're looking for the schema to validate **Component Constructor files** (`component-constructor.yaml` used as input for `ocm add componentversion`), use the [Configuration Schema](/schemas/configuration-schema.yaml) instead.
{{< /callout >}}

## Download

{{< callout context="tip" title="Download Schema" icon="outline/download" >}}
[component-descriptor-v2-schema.json](/schemas/component-descriptor-v2-schema.json) — JSON Schema (version `Draft 2020-12`)

Use this schema for editor validation and IDE autocompletion.
{{< /callout >}}

### Editor Integration

{{< tabs "editor-integration" >}}

{{< tab "VS Code (YAML)" >}}
Add this comment at the top of your YAML file:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/component-descriptor-v2-schema.json
```
{{< /tab >}}

{{< tab "JetBrains IDEs" >}}
1. Open **Settings** → **Languages & Frameworks** → **Schemas and DTDs** → **JSON Schema Mappings**
2. Add a new mapping with URL: `https://ocm.software/schemas/component-descriptor-v2-schema.json`
3. Associate it with your component descriptor files
{{< /tab >}}

{{< /tabs >}}

## Structure Overview

A Component Descriptor consists of four main sections:

| Property | Required | Description |
|----------|----------|-------------|
| `meta` | ✓ | Metadata including the schema version |
| `component` | ✓ | The component specification with name, version, resources, etc. |
| `signatures` | | Optional signing information for verification |
| `nestedDigests` | | Digest information for nested components |

{{< details "Minimal Example" >}}
```json
{
  "meta": {
    "schemaVersion": "v2"
  },
  "component": {
    "name": "github.com/open-component-model/podinfo",
    "version": "v1.0.0",
    "provider": "open-component-model",
    "repositoryContexts": [],
    "sources": [],
    "componentReferences": [],
    "resources": []
  }
}
```
{{< /details >}}

## Component Properties

The `component` object contains the core information about your software component:

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Unique component name (e.g., `github.com/org/repo`) |
| `version` | ✓ | Component version following relaxed semver |
| `provider` | ✓ | Provider/owner of the component |
| `repositoryContexts` | ✓ | List of repositories where the component is stored |
| `sources` | ✓ | Source artifacts used to build the component |
| `componentReferences` | ✓ | References to other component versions |
| `resources` | ✓ | Delivery artifacts (images, charts, binaries, etc.) |
| `labels` | | Optional key-value metadata |
| `creationTime` | | ISO 8601 timestamp of creation |

### Component Name Format

Component names must follow this pattern:
- Start with a DNS-like domain (e.g., `github.com`, `my.company.io`)
- Followed by path segments separated by `/`
- Only lowercase letters, numbers, hyphens, and underscores allowed
- Maximum 255 characters

**Valid examples:**
- `github.com/open-component-model/ocm`
- `my.company.io/team/application`

## Resources

Resources are the delivery artifacts of a component—container images, Helm charts, binaries, or any other artifact.

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Resource identifier within the component |
| `version` | ✓ | Version of the resource |
| `type` | ✓ | Type of resource (e.g., `ociImage`, `helmChart`) |
| `relation` | ✓ | `local` (built by this component) or `external` (third-party) |
| `access` | ✓ | How to retrieve the resource |
| `extraIdentity` | | Additional identity attributes |
| `labels` | | Optional metadata |
| `digest` | | Content digest for verification |
| `srcRefs` | | References to sources that produced this resource |

{{< details "Resource Example" >}}
```json
{
  "name": "backend-image",
  "version": "1.0.0",
  "type": "ociImage",
  "relation": "local",
  "access": {
    "type": "ociArtifact",
    "imageReference": "ghcr.io/myorg/backend:1.0.0"
  },
  "digest": {
    "hashAlgorithm": "SHA-256",
    "normalisationAlgorithm": "ociArtifactDigest/v1",
    "value": "abc123..."
  }
}
```
{{< /details >}}

## Sources

Sources describe the origin of the component's code or content.

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Source identifier |
| `version` | ✓ | Source version |
| `type` | ✓ | Source type (e.g., `git`, `http`) |
| `access` | ✓ | How to access the source |
| `labels` | | Optional metadata |

{{< details "Source Example" >}}
```json
{
  "name": "source-code",
  "version": "1.0.0",
  "type": "git",
  "access": {
    "type": "gitHub",
    "repoUrl": "github.com/myorg/myrepo",
    "ref": "refs/tags/v1.0.0",
    "commit": "abc123def456..."
  }
}
```
{{< /details >}}

## Component References

Component references allow you to compose components from other components, creating a hierarchical structure.

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Local reference name |
| `componentName` | ✓ | Full name of the referenced component |
| `version` | ✓ | Version of the referenced component |
| `extraIdentity` | | Additional identity attributes |
| `labels` | | Optional metadata |
| `digest` | | Digest for verification |

{{< details "Component Reference Example" >}}
```json
{
  "name": "logging",
  "componentName": "github.com/myorg/logging-component",
  "version": "v2.0.0"
}
```
{{< /details >}}

## Labels

Labels provide extensible metadata for components, resources, sources, and references.

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Label name |
| `value` | ✓ | Label value (any JSON type) |
| `version` | | Label schema version (e.g., `v1`) |
| `signing` | | Include in signature calculation |
| `merge` | | Configuration for label merging |

{{< details "Label Example" >}}
```json
{
  "name": "documentation-url",
  "value": "https://docs.example.com/mycomponent",
  "signing": false
}
```
{{< /details >}}

## Signatures

Signatures provide cryptographic verification of component integrity.

| Property | Required | Description |
|----------|----------|-------------|
| `name` | ✓ | Signature name/identifier |
| `digest` | ✓ | Digest that was signed |
| `signature` | ✓ | Signature details |
| `timestamp` | | When the signature was created |

## Access Types

The `access` specification defines how to retrieve resources and sources. Common types include:

| Type | Description |
|------|-------------|
| `ociArtifact` | OCI registry artifact (images, charts) |
| `gitHub` | GitHub repository |
| `http` | HTTP/HTTPS URL |
| `localBlob` | Local blob storage |

## Related Resources

- [Component Descriptor Concepts]({{< relref "docs/concepts" >}})
- [Creating Component Versions]({{< relref "create-component-version.md" >}})
- [OCM CLI Reference]({{< relref "docs/reference/ocm-cli" >}})
- [JSON Schema Specification](https://json-schema.org/)

## Schema Source

This schema is sourced from the [Open Component Model specification](https://github.com/open-component-model/open-component-model/blob/main/bindings/go/descriptor/v2/resources/schema-2020-12.json).
