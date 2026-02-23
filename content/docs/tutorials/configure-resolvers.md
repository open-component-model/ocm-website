---
title: "Configure Resolvers in OCM CLI"
description: "Configure resolvers to recursively resolve component references from a shared repository."
icon: "🔍"
weight: 80
toc: true
---

## Overview

When you retrieve a component version, you typically specify the repository where the component is located directly:

```bash
ocm get cv ghcr.io/<your-namespace>/ocm-tutorial//ocm.software/tutorials/app:1.0.0
```

This works fine for a single component. But what happens when that component has **references** to other components?
For example, an app component might reference a backend and a frontend component that reside in different [ocm repositories](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/01-model.md#component-repositories).
When you use the option `--recursive` to follow those references, the CLI needs to know which repository contains the referenced components.

**Resolvers** address this problem. They map component names to repositories so the CLI can automatically locate
referenced components during recursive operations.

Resolvers use the configuration type `resolvers.config.ocm.software/v1alpha1`.
The resolvers use glob-based pattern matching to determine which repository to query for a given component reference.

{{<callout context="note" title="What You'll Learn">}}

- Create components with references and push them to OCI registries
- Write a resolver configuration that maps component name patterns to repositories
- Combine credentials and resolvers in a single `.ocmconfig` file
- Use `--recursive` to resolve a component graph across repositories

{{</callout>}}

## Prerequisites

- The [OCM CLI](https://github.com/open-component-model/open-component-model) installed
- Access to at least one OCI registry (e.g., `ghcr.io`, Docker Hub, or a private registry)
- A GitHub account with a personal access token

## What Are Resolvers?

A resolver maps a **component name pattern** (glob) to an **OCM repository**. When the CLI
encounters a component reference during recursive resolution, it consults the configured resolvers to find the first
pattern that matches the component name and queries the associated repository.

This is particularly useful when:

- A component references other components and you need recursive resolution
- Components are distributed across multiple ocm repositories

## Configuration

Resolvers are configured in the OCM configuration file. By default, the CLI searches for configuration in `$HOME/.ocmconfig`.
You can also specify a configuration file explicitly with the `--config` flag.

{{<callout context="tip">}}
For more information about configuring credentials, see [.ocmconfig documentation](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_configfile.md).
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
          subPath: <your-github-username>/ocm-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/*"
```

This tells the CLI: "When looking for any component matching `ocm.software/tutorials/*`, check the OCI registry at
`ghcr.io/<your-github-username>/ocm-tutorial-deps`."

{{<callout context="note">}}
Resolvers are evaluated **in the order they are defined**. The first matching resolver wins. Place more specific patterns before broader ones.
{{</callout>}}

### Repository Types

The `repository` field accepts any OCM repository specification. The most common types are:

{{< tabs >}}
{{< tab "OCI Registry" >}}

```yaml
repository:
  type: OCIRepository/v1
  baseUrl: ghcr.io
  subPath: <your-github-username>/ocm-tutorial-deps
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

### Component Name Patterns

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
          subPath: <your-github-username>/ocm-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/*"
```

**Excerpt of the supported glob patterns:**

When configuring resolvers, you can use glob patterns to specify which component names should be resolved by which repositories.
Here are some examples of supported patterns:

| Pattern                     | Matches                                                  |
|-----------------------------|----------------------------------------------------------|
| `ocm.software/tutorials/*`  | Any component directly under `ocm.software/tutorials/`   |
| `ocm.software/core/**`      | Any component under `ocm.software/core/` or its subpaths |
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

## Walkthrough

This tutorial walks through a hands-on example with three components — a **backend**, a **frontend**, and an **app**
that references both. The app lives in its own repository, while its component references (backend and frontend component) are stored in
a shared repository. When you recursively resolve the app, the CLI needs resolvers to locate the referenced
components in their repositories.

{{< steps >}}

{{< step >}}
**Authenticate with the Registry**

Log in to `ghcr.io` using a GitHub personal access token:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin
```

Your token needs to have write permissions for packages in order to push component versions to the registry.
{{< /step >}}

{{<callout context="note">}}
For more information on creating a personal access token, see [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

⚠️ The token must have the `write:packages` scope to allow pushing component versions to [GitHub Container Registry](https://ghcr.io).
{{</callout>}}

{{< step >}}
**Create and Push the Backend Component**

{{<callout context="tip">}}
If you are re-running this tutorial and the component versions already exist, add `--component-version-conflict-policy replace` to the `ocm add cv` commands to overwrite existing versions.
{{</callout>}}

Create `backend-constructor.yaml`:

```yaml
components:
  - name: ocm.software/tutorials/backend
    version: "1.0.0"
    provider:
      name: ocm.software
    resources:
      - name: config
        version: "1.0.0"
        type: plainText
        input:
          type: utf8
          text: "backend service configuration"
```

Push it to the repository to store the component in. We will reference this later when we create the app component:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-deps \
  --constructor backend-constructor.yaml
```

<details>
  <summary>Expected output</summary>

```text
 COMPONENT                      │ VERSION │ PROVIDER
────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/backend │ 1.0.0   │ ocm.software
```
</details>
{{< /step >}}

{{< step >}}
**Create and Push the Frontend Component**

Create `frontend-constructor.yaml`:

```yaml
components:
  - name: ocm.software/tutorials/frontend
    version: "1.0.0"
    provider:
      name: ocm.software
    resources:
      - name: config
        version: "1.0.0"
        type: plainText
        input:
          type: utf8
          text: "frontend service configuration"
```

Push it to the same repository:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-deps \
  --constructor frontend-constructor.yaml
```

<details>
  <summary>Expected output</summary>

```text
 COMPONENT                       │ VERSION │ PROVIDER
─────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/frontend │ 1.0.0   │ ocm.software
```
</details>
{{< /step >}}

{{< step >}}
**Create and Push the App Component**

Create `app-constructor.yaml`. Notice the `componentReferences` section — it declares dependencies on both the backend and frontend components:

```yaml
components:
  - name: ocm.software/tutorials/app
    version: "1.0.0"
    provider:
      name: ocm.software
    componentReferences:
      - name: backend-service
        componentName: ocm.software/tutorials/backend
        version: "1.0.0"
      - name: frontend-service
        componentName: ocm.software/tutorials/frontend
        version: "1.0.0"
    resources:
      - name: config
        version: "1.0.0"
        type: plainText
        input:
          type: utf8
          text: "app deployment configuration"
```

Push it to the **app repository** — a separate repository from where the component references are stored:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial \
  --constructor app-constructor.yaml
```

<details>
  <summary>Expected output</summary>

```text
  COMPONENT                       │ VERSION │ PROVIDER
─────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/app      │ 1.0.0   │ ocm.software
 ocm.software/tutorials/backend  │ 1.0.0   │
 ocm.software/tutorials/frontend │ 1.0.0   │
```
</details>
{{< /step >}}

{{< step >}}
**Verify the Components**

Check that all three components exist in their respective repositories:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-deps//ocm.software/tutorials/backend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-deps//ocm.software/tutorials/frontend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0
```

The outputs of each command should show the respective component version with its provider.
{{< /step >}}

{{< step >}}
**Recursively Resolve the App with Resolvers**

Create an `.ocmconfig` file with credentials and resolvers that map the component references to their repository:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/frontend"
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/backend"
```

Now recursively resolve the app:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

The CLI:

1. Finds `ocm.software/tutorials/app:1.0.0` in the specified app repository
2. Discovers the references to `ocm.software/tutorials/backend:1.0.0` and `ocm.software/tutorials/frontend:1.0.0`
3. Consults the resolvers — each component name matches a configured pattern
4. Looks up backend and frontend in `ghcr.io/<your-github-username>/ocm-tutorial-deps`
{{< /step >}}

{{< /steps >}}

{{<callout context="tip" title="Resolving from Multiple Repositories">}}
In the tutorial above, both component references share a single repository. In practice, components often live in **separate repositories**. See the how-to guide [How to Resolve Components from Multiple Repositories]({{< relref "docs/how-to/resolve-components-from-multiple-repositories.md" >}}) for a step-by-step recipe.
{{</callout>}}

## Recursive Resolution

As shown in the tutorial above, the app component `ocm.software/tutorials/app:1.0.0` references both
`ocm.software/tutorials/backend:1.0.0` and `ocm.software/tutorials/frontend:1.0.0`. These component references live in a
separate repository. With resolvers configured, the CLI automatically finds the referenced components.

{{<callout context="note">}}
For the `transfer cv` command, resolvers are currently not taking into account.
{{</callout>}}

## CLI and Resolver Interaction

When you provide both a repository reference on the command line and have resolvers configured, the CLI uses the following priority order:

1. **Command-line reference** (highest priority) — the repository specified directly in the command
2. **Configured resolvers** — resolvers from the configuration file, matched by component name pattern

This means you can always override resolver behavior by specifying a repository explicitly:

```bash
# Uses resolvers from config to find referenced components
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1
```

With the resolver configured, the CLI discovers the references to the backend and frontend components and automatically locates them before transferring everything to the target.

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

## What you've learned

- How resolvers map component name patterns to OCI repositories
- How to configure `resolvers.config.ocm.software/v1alpha1` in an `.ocmconfig` file
- How to push components with references to separate repositories
- How to use `--recursive` to resolve a component graph across repositories
- How to combine credentials and resolvers in a single `.ocmconfig` file

## What Comes Next

Now that you know how to configure resolvers, you can:

- Learn more about component references: [Referencing Components](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/01-references.md).
- Explore credential configuration: See [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) for authentication options when working with registries.
- Set up air-gapped environments: Use CTF archives with resolvers for offline component resolution. Learn about the Common Transport Format in [Creating a Component Version]({{< relref "docs/getting-started/create-component-version.md" >}}).

## Related Documentation

- [Components]({{< relref "docs/concepts/components.md" >}}) — Core concepts behind component versions, identities, and references
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries, Helm repositories, and more
- [Creating a Component Version]({{< relref "docs/getting-started/create-component-version.md" >}}) — Build component versions and work with CTF archives
- [Input and Access Types]({{< relref "input-and-access-types.md" >}}) — Reference for resource input types (by value) and access types (by reference)
- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) — Sign and verify component versions with cryptographic keys
