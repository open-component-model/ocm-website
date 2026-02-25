---
title: "OCM Credentials"
description: "How OCM resolves credentials for registries, repositories, and other services."
icon: "🔑"
weight: 43
toc: true
---

When you work with OCM, many operations need credentials — pushing to an OCI registry, pulling from a private repository, or signing a component. Instead of passing credentials to every command, OCM provides a **central credential system** that automatically finds the right credentials for each operation.

You configure your credentials once in a configuration file, and OCM takes care of the rest.

## Terminology

- [**Consumer**](#consumers) — a service that requires authentication (e.g., an OCI registry)
- [**Consumer Identity**](#identities) — a set of key-value attributes that uniquely describe a consumer (type + attributes like `hostname`, `path`)
- [**Credentials**](#credentials) — key-value pairs used to authenticate (e.g., `username` / `password`)
- [**Credential Type**](#credential-types) — defines how credentials are stored or retrieved (e.g., `Credentials/v1` for inline key-value pairs)
- [**Repository**](#repositories) — a fallback credential source checked only when no consumer entry matches (e.g., `DockerConfig/v1`)

## Consumers

A *consumer* is any service that requires authentication. Each consumer is represented by one or more **consumer identities** and its associated **credentials**.

The simplest configuration links one consumer to one set of credentials:

```yaml
consumers:
  - identities:
      - type: OCIRepository
        hostname: docker.io
    credentials:
      - type: Credentials/v1
        properties:
          username: my-user
          password: my-token
```

### Identities

A *consumer identity* is a set of key-value attributes that uniquely describe a consumer. A consumer can have one or more identities — multiple identities on the same consumer share the same credentials. Every identity has a **type** that classifies what kind of service it represents.

The primary identity type built into the CLI is:

| Identity Type | Service | Attribute | Required | Description |
| --- | --- | --- | --- | --- |
| `OCIRepository` | OCI registries | `hostname` | yes | Registry hostname (e.g., `ghcr.io`) |
| | | `port` | no | Port number |
| | | `scheme` | no | URL scheme (`https`, `http`) |
| | | `path` | no | Repository path (e.g., `my-org/my-repo`) |

For example, a consumer identity for GitHub Container Registry looks like this:

```yaml
identity:
  type: OCIRepository
  hostname: ghcr.io
  path: my-org
```

This tells OCM: *"I need credentials for the OCI registry at ghcr.io, specifically for the repository path `my-org`."*

### Credentials

*Credentials* are key-value pairs used to authenticate against a consumer. For `OCIRepository` consumers, the recognized properties are:

| Property | Description |
| --- | --- |
| `username` | Basic auth username |
| `password` | Basic auth password or personal access token |
| `accessToken` | Bearer token for token-based auth |
| `refreshToken` | Token used to obtain a new access token |

#### Credential Types

A *credential type* defines how credentials are stored or retrieved. The built-in credential type is:

**`Credentials/v1`** (also known as `DirectCredentials/v1`) — inline credentials written directly in the configuration file as key-value pairs. The type itself is a generic `properties` map with no fixed schema — the keys depend on the consumer that uses them.

```yaml
credentials:
  - type: Credentials/v1
    properties:
      username: my-user
      password: my-token
```

Additional credential types can be added through plugins.

## Repositories

> **Note:** Repositories are a legacy fallback mechanism. While still supported, the recommended approach is to use explicit consumer entries in the `consumers` section for deterministic credential resolution.

*Repositories* act as fallback credential sources — they are consulted only **after** no direct credentials are found in the graph. They are useful when:

- Credentials are not known in advance
- Credentials are retrieved from an external source (e.g., Docker credential helpers)

The built-in repository type is:

**`DockerConfig/v1`** — reads credentials from a Docker `config.json` file, including any configured credential helpers (e.g., `docker-credential-osxkeychain`). This lets you reuse existing Docker logins without duplicating them.

```yaml
repositories:
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: "~/.docker/config.json"
```

## Configuration File

The OCM configuration file uses a generic wrapper that can hold multiple configuration types. Credential configuration is one of them. The wrapper exists because OCM's config file is not credential-specific — it can also carry plugin settings, signing keys, and other configuration in the same file.

### Structure

The `credentials.config.ocm.software` section has two subsections:

| Section | Purpose | Priority |
| --- | --- | --- |
| `consumers` | Direct mappings from consumer identities to credentials | Higher — checked first |
| `repositories` | Fallback credential sources (e.g., Docker config files) | Lower — checked after consumers |

**`consumers`** — each entry maps one or more identities to credential sources:

```yaml
consumers:
  - identities:
      - type: OCIRepository
        hostname: ghcr.io
        path: my-org
    credentials:
      - type: Credentials/v1
        properties:
          username: my-user
          password: my-token
```

| Field | Description |
| --- | --- |
| `identities` | One or more consumer identities (type + attributes) sharing the same credentials |
| `identity` | Legacy alias for a single identity (still supported for backward compatibility) |
| `credentials` | One or more credential sources, merged in order (later entries override earlier ones) |

**`repositories`** — each entry wraps a typed fallback credential source:

```yaml
repositories:
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: "~/.docker/config.json"
```

| Field | Description |
| --- | --- |
| `type` | Repository type — `DockerConfig/v1` or a plugin-provided type |
| `dockerConfigFile` | Path to a Docker `config.json` (for `DockerConfig/v1`) |
| `dockerConfig` | Inline Docker config JSON as an alternative to a file path |

A minimal complete example:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identities:
          - type: OCIRepository
            hostname: ghcr.io
        credentials:
          - type: Credentials/v1
            properties:
              username: my-user
              password: my-token
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
```

### Configuration Discovery

The OCM CLI searches for its configuration file in multiple locations. If the `--config` flag is set, only that path is used. Otherwise, the CLI searches the following locations and **merges all found configuration files**:

1. **`OCM_CONFIG` environment variable** — path from environment
2. **XDG / home directory** — first match from:
   - `$XDG_CONFIG_HOME/.ocm/config` or `$XDG_CONFIG_HOME/.ocmconfig`
   - `$HOME/.config/.ocm/config` or `$HOME/.config/.ocmconfig`
   - `$HOME/.ocm/config` or `$HOME/.ocmconfig`
3. **Current working directory** — `.ocm/config` or `.ocmconfig`
4. **Executable directory** — `.ocm/config` or `.ocmconfig` next to the `ocm` binary

## How Resolution Works

When resolving credentials, OCM checks the two config sections in this order:

1. **`consumers`** — explicit consumer-to-credential mappings
2. **`repositories`** — fallback providers like Docker config files

Consumer entries always take priority over repository lookups. This means you can rely on Docker config for most registries while overriding specific ones with explicit credentials — without touching your Docker setup.

### Identity Matching

When OCM needs credentials for an operation (e.g., pushing to `ghcr.io/my-org/my-repo`), it constructs a **lookup identity** from the request and tries to match it against the configured consumer entries. The matching supports **partial matching** — a lookup identity with fewer attributes (e.g., just `hostname` + `type`) will match credential entries that have additional attributes (e.g., `hostname` + `type` + `port` + `scheme`). This means you don't need to specify every attribute in your configuration — a broad entry can serve many requests.

Matching is performed in three steps:

**1. Type matching** — the identity `type` (e.g., `OCIRepository`) must be exactly equal between the lookup and the configured entry.

**2. URL matching** — the URL components of the identity are compared:

- `hostname` must be equal
- `scheme` must be equal (if neither side specifies it, they match)
- `port` is compared with scheme-aware defaults — `https` defaults to `443`, `http` defaults to `80`, so `https://ghcr.io` and `https://ghcr.io:443` are equivalent
- `path` supports glob matching where `*` matches exactly one path segment. If `path` is missing from the configured entry, any path in the request is accepted

**3. First match wins** — OCM returns the first matching entry it finds.

Examples:

| Configured identity | Request | Result | Why |
| --- | --- | --- | --- |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`path: my-org/my-repo` | `ghcr.io/my-org/my-repo` | ✅ | Exact path match |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`path: my-org/*` | `ghcr.io/my-org/my-repo` | ✅ | `*` matches `my-repo` |
| `type: OCIRepository`<br>`hostname: ghcr.io` | `ghcr.io/my-org/my-repo` | ✅ | No path — accepts any |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`path: my-org` | `ghcr.io/my-org/my-repo` | ❌ | `my-org` ≠ `my-org/my-repo` |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`path: my-org/*` | `ghcr.io/other-org/foo` | ❌ | `other-org` ≠ `my-org` |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`scheme: https` | `https://ghcr.io:443/repo` | ✅ | Port defaults to `443` |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`scheme: http` | `https://ghcr.io/repo` | ❌ | `http` ≠ `https` |
| `type: OCIRepository`<br>`hostname: ghcr.io`<br>`port: 5000` | `https://ghcr.io:443/repo` | ❌ | `5000` ≠ `443` |

{{< callout context="note" >}}
`*` matches exactly one path segment. It does **not** match across `/` separators. Use `my-org/*/*` to match two-level paths like `my-org/team/repo`.
{{< /callout >}}

### Multi-Identity Credentials

A consumer can list multiple credential sources. When it does, they are **merged in order** — later entries override earlier ones for the same key:

```yaml
consumers:
  - identities:
      - type: OCIRepository
        hostname: docker.io
    credentials:
      - type: Credentials/v1
        properties:
          username: my-user
      - type: Credentials/v1
        properties:
          password: my-token
```

This produces a single merged credential map: `{ username: my-user, password: my-token }`. If both entries defined `username`, the second one would win.

When a consumer has **multiple identities**, each identity is registered as a separate node in the credential graph with the same credentials. This means:

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

is functionally identical to defining two separate consumer entries with the same credentials. Both `ghcr.io` and `docker.io` resolve independently to `shared-user` / `shared-token`.

## Putting It All Together

Suppose you work with multiple registries:

- You have a personal access token for pushing components to `ghcr.io/my-org/production`
- You use your regular Docker credentials for pulling from `docker.io` and other `ghcr.io` paths

Instead of passing credentials to every `ocm` command, you configure them once in `~/.ocm/config`:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identities:
          - type: OCIRepository
            hostname: ghcr.io
            path: my-org/production
        credentials:
          - type: Credentials/v1
            properties:
              username: my-user
              password: ghp_personal_access_token
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
```

Now when you run OCM commands, credentials are resolved automatically:

- **`ocm get cv ghcr.io/my-org/production//example.com/my-component:1.0.0`** → OCM finds the explicit consumer entry matching `ghcr.io` with path `my-org/production` → authenticates as `my-user`
- **`ocm get cv ghcr.io/my-org/staging//example.com/my-component:1.0.0`** → no consumer entry matches this path → OCM falls back to your Docker config. If you ran `docker login ghcr.io` previously, those credentials are used
- **`ocm get cv docker.io/my-org/repo//example.com/my-component:1.0.0`** → no consumer entry for `docker.io` → falls back to Docker config

You never have to think about which credentials to use — OCM picks the most appropriate ones based on what you configured. Explicit consumer entries give you precise control where you need it, while the Docker config acts as a catch-all for everything else.

## What's Next?

- [Credentials for OCM Controllers]({{< relref "configure-credentials-for-controllers.md" >}}) — how to provide credentials in Kubernetes environments
