---
title: "Switch from v1 Credentials"
description: "Most OCM v1 credential configurations work in OCM v2 unchanged. Learn what is supported and what changed."
icon: "🔑"
weight: 46
toc: true
---

## Overview

If you're switching from OCM v1 to v2, most `.ocmconfig` files will continue to work. OCM v2 supports the most common v1 credential types and config format — with a few exceptions.

This guide explains:

1. What works unchanged
2. What is not yet supported in v2
3. Key differences between v1 and v2 formats

See [Credential System Concepts]({{< relref "../concepts/credential-system.md" >}}) for the full v2 credential system documentation.

## What Works Unchanged

The following v1 configurations work identically in v2:

- **Config file format and location** — `~/.ocmconfig`, `$OCM_CONFIG`, same YAML structure
- **`identity` field (singular)** — still accepted; parsed as a single-entry `identities` list
- **Inline credentials** — `Credentials/v1` type and `properties` field
- **Docker config** — `DockerConfig/v1` type, `dockerConfigFile`, `dockerConfig` fields

{{< callout context="caution" >}}
`HashiCorpVault/v1`, `GardenerConfig/v1`, and `NPMConfig/v1` from OCM v1 are not yet available in OCM v2. If you rely on these, stay on OCM v1 for now.
{{< /callout >}}

### Example: Docker Config (Identical in v1 and v2)

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
```

## Key Differences

### `identity` vs `identities`

In v1, each consumer entry has a single `identity` field that describes which registry or service the credentials apply to. In v2, this field was renamed to `identities` and became a list — allowing one credential block to cover multiple registries at once. This is called **multi-identity credentials** and eliminates the need to duplicate consumer entries when the same username and password work across multiple registries.

For a detailed explanation of how multi-identity credentials work and when to use them, see [Multi-Identity Credentials]({{< relref "../concepts/credential-system.md#multi-identity-credentials" >}}) in the Credential System Concepts.

#### v1: Single identity per consumer

In v1, the `identity` field is a single object. If the same credentials work for multiple registries, you must repeat the entire consumer entry:

```yaml
consumers:
  - identity:
      type: OCIRegistry
      hostname: ghcr.io
    credentials:
      - type: Credentials/v1
        properties:
          username: my-user
          password: my-token
```

#### v2: Multiple identities per consumer

In v2, the `identities` field is a list. You can specify multiple registries or paths in a single consumer entry, and they all share the same credentials. See [Multi-Identity Credentials]({{< relref "../concepts/credential-system.md#multi-identity-credentials" >}}) in the Credential System Concepts for a detailed explanation of this feature.

```yaml
consumers:
  - identities:
      - type: OCIRepository
        hostname: ghcr.io
      - type: OCIRepository
        hostname: docker.io
    credentials:
      - type: Credentials/v1
        properties:
          username: shared-user
          password: shared-token
```

#### Backward compatibility

You do **not** need to rename `identity` to `identities` in your existing configs. OCM v2 still accepts the singular `identity` field. When parsing the configuration, v2 automatically converts a single `identity` into a one-element `identities` list internally. Your v1 configs will continue to work without modification.

{{< callout context="note" >}}
The only required changes when moving to v2 are the consumer type (`OCIRegistry` → `OCIRepository`) and path field (`pathprefix` → `path`). The `identity` vs `identities` field name is handled automatically.
{{< /callout >}}

### Consumer Identity Types

These are the `type` values used under `consumers[].identity`:

| Identity Type | OCM v1 | OCM v2 |
| --- | --- | --- |
| `OCIRegistry` | ✅ | ⚠️ renamed to `OCIRepository` |
| `HelmChartRepository` | ✅ | ✅ unchanged |
| `MavenRepository` | ✅ | ❌ not available |
| `NpmRegistry` | ✅ | ❌ not available |
| `Github` | ✅ | ❌ not available |

#### Example: OCI Registry Credentials

For OCI credentials, two fields must be updated: `type` and `pathprefix`.

**v1:**

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: OCIRegistry
          hostname: ghcr.io
          pathprefix: open-component-model
        credentials:
          - type: Credentials/v1
            properties:
              username: my-user
              password: my-token
```

**v2:**

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identities:
          - type: OCIRepository
            hostname: ghcr.io
            path: open-component-model
        credentials:
          - type: Credentials/v1
            properties:
              username: my-user
              password: my-token
```

### Credential Repository Types

These are the `type` values used under `repositories[].repository`:

| Repository Type | OCM v1 | OCM v2 |
| --- | --- | --- |
| `DockerConfig/v1` | ✅ | ✅ unchanged |
| `NPMConfig/v1` | ✅ | ❌ not available |
| `HashiCorpVault/v1` | ✅ | ❌ not available |
| `GardenerConfig/v1` | ✅ | ❌ not available |

## Tips

1. **Check credential types first** — if you use `Credentials/v1` or `DockerConfig/v1`, you can switch to v2 today
2. **Update OCI consumer entries** — change `type: OCIRegistry` → `OCIRepository` and `pathprefix` → `path`
3. **Test thoroughly** — use `ocm credentials get` to verify [credential resolution]({{< relref "../concepts/credential-system.md#how-resolution-works" >}})
4. **Adopt gradually** — change `identity` to `identities` when you need [multi-identity support]({{< relref "../concepts/credential-system.md#multi-identity-credentials" >}})

## What's Next?

- [Credential System Concepts]({{< relref "../concepts/credential-system.md" >}}) — understand the full v2 credential system
