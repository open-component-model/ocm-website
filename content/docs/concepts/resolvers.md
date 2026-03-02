---
title: "Resolvers"
description: "Learn how OCM resolvers map component name patterns to repositories for recursive resolution."
icon: "🔍"
weight: 44
toc: true
---

## What Are Resolvers?

A resolver maps a **component name pattern** (glob) to an **[OCM repository](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/01-model.md#component-repositories)**. When OCM
encounters a component reference during recursive resolution, it consults the configured resolvers to find the first
pattern that matches the component name and queries the associated repository.

This is particularly useful when:

- A component references other components and you need recursive resolution
- Components are distributed across multiple ocm repositories

## Configuration

Resolvers are configured in the OCM configuration file. By default, the CLI searches for configuration in `$HOME/.ocmconfig`.
You can also specify a configuration file explicitly with the `--config` flag.

{{<callout context="tip">}}
For more information about OCM configurations, see [.ocmconfig documentation](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_configfile.md).
{{</callout>}}

### Basic Configuration

The resolver configuration uses the type `resolvers.config.ocm.software/v1alpha1` inside a generic OCM configuration file:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: my-org/components
        componentNamePattern: "example.com/services/*"
```

This tells OCM: "When looking for any component matching `example.com/services/*`, check the OCI registry at
`ghcr.io/my-org/components`."

### Resolver Evaluation Order

{{<callout context="note">}}
Resolvers are evaluated **in the order they are defined**. The first matching resolver wins. Place more specific patterns before broader ones.
{{</callout>}}

## Repository Types

The `repository` field accepts any OCM repository specification. The most common types are:

{{< tabs >}}
{{< tab "OCI Registry" >}}

```yaml
repository:
  type: OCIRepository/v1
  baseUrl: ghcr.io
  subPath: my-org/components
```

| Field     | Required | Description                                                                                       |
|-----------|----------|---------------------------------------------------------------------------------------------------|
| `type`    | Yes      | Repository type. Must be `OCIRepository/v1`.                                                      |
| `baseUrl` | Yes      | Registry host and optional port (e.g., `ghcr.io`, `localhost:5000`).                              |
| `subPath` | No       | Repository prefix path within the registry.                                                       |

{{< /tab >}}
{{< tab "CTF (File-based)" >}}

```yaml
repository:
  type: CommonTransportFormat/v1
  filePath: /path/to/ctf-archive
```

| Field        | Required | Description                                                                                      |
|--------------|----------|--------------------------------------------------------------------------------------------------|
| `type`       | Yes      | Repository type. Accepted values include `CommonTransportFormat/v1` and the short form `CTF/v1`. |
| `filePath`   | Yes      | Path to the CTF archive file or directory.                                                       |
| `accessMode` | No       | Access mode: `readonly`, `readwrite`, or `create`.                                               |

{{< /tab >}}
{{< /tabs >}}

## Component Name Patterns

Each resolver entry can include a `componentNamePattern` field that uses **glob patterns** to match component names.
Only components matching the pattern will be routed to that repository.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: my-org/components
        componentNamePattern: "example.com/services/*"
```

**Excerpt of the supported glob patterns:**

When configuring resolvers, you can use glob patterns to specify which component names should be resolved by which repositories.
Here are some examples of supported patterns:

| Pattern                     | Matches                                                  |
|-----------------------------|----------------------------------------------------------|
| `example.com/services/*`    | Any component directly under `example.com/services/`     |
| `example.com/core/**`       | Any component under `example.com/core/` or its subpaths  |
| `*`                         | All components (wildcard catch-all)                      |

**Pattern syntax explanation:**

- `*` — Matches any sequence of characters within a path segment
- `**` — Matches any sequence of characters in subpath segments
- `?` — Matches any single character
- `[abc]` — Matches any character in the set (a, b, or c)
- `[a-z]` — Matches any character in the range

{{<callout context="note">}}
For more information on the supported glob syntax, see the [glob package documentation](https://github.com/gobwas/glob).
{{</callout>}}

## CLI and Resolver Interaction

When you provide both a repository reference on the command line and have resolvers configured, the CLI uses the following priority order:

1. **Command-line reference** (highest priority) — the repository specified directly in the command
2. **Configured resolvers** — resolvers from the configuration file, matched by component name pattern

This means you can always override resolver behavior by specifying a repository explicitly:

```bash
# Uses resolvers from config to find referenced components
ocm get cv ghcr.io/my-org/components//example.com/services/app:1.0.0 \
  --recursive=-1
```

With the resolver configured, the CLI discovers the component references and automatically locates them in the configured repositories.

## Recursive Resolution

When a component version has references to other component versions (via `componentReferences`), the CLI can follow these references recursively using the `--recursive` flag. Resolvers are essential for this: the CLI uses them to locate the referenced components in their respective repositories.

For example, an app component might reference backend and frontend components stored in a separate repository. With resolvers configured, the CLI automatically finds and retrieves all referenced components.

{{<callout context="tip">}}
For the `transfer cv` command, resolvers are currently not taking into account.
{{</callout>}}

## Configuration Reference

The resolver configuration is defined by the `resolvers.config.ocm.software/v1alpha1` type in the [OCM specification](https://github.com/open-component-model/open-component-model/tree/main/bindings/go/configuration/resolvers/v1alpha1/spec).

### Config Schema

| Field       | Type   | Required | Description                                        |
|-------------|--------|----------|----------------------------------------------------|
| `type`      | string | Yes      | Must be `resolvers.config.ocm.software/v1alpha1`.  |
| `resolvers` | array  | No       | List of resolver entries.                          |

### Resolver Schema

| Field                  | Type   | Required | Description                                                                                  |
|------------------------|--------|----------|----------------------------------------------------------------------------------------------|
| `repository`           | object | Yes      | An OCM repository specification (must include a `type` field).                               |
| `componentNamePattern` | string | No       | Glob pattern for matching component names. If omitted, the resolver matches all components.  |

## Related Documentation

- [Components]({{< relref "components.md" >}}) — Core concepts behind component versions, identities, and references
- [Configure Resolvers Tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) — Hands-on walkthrough for setting up resolvers
- [Resolve Components from Multiple Repositories]({{< relref "docs/how-to/resolve-components-from-multiple-repositories.md" >}}) — Step-by-step recipe for multi-repository resolution
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries
