---
title: "Configuring Resolvers"
description: "How to configure resolvers to map component versions to OCM repositories."
icon: "🔍"
weight: 56
toc: true
---

## Overview

When you retrieve a component version, you typically specify the repository directly:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0
```

This works fine for a single component. But what happens when that component has **references** to other components?
For example, an app component might reference a backend and a frontend component. When you use `--recursive` to follow
those references, the CLI needs to know which repository contains the referenced components.

**Resolvers** solve this problem. They map component names to repositories so the CLI can automatically locate
referenced components during recursive operations.

Resolvers use the configuration type `resolvers.config.ocm.software/v1alpha1` and replace the deprecated priority-based
fallback resolvers from earlier OCM versions with glob-based pattern matching.

**This guide is for users who want to:**

- Understand what resolvers are and when to use them
- Configure resolvers with glob-based component name matching
- Set up multi-registry environments with a single configuration file
- Use resolvers for recursive component resolution across repositories

## Prerequisites

- The [OCM CLI](https://github.com/open-component-model/open-component-model) installed
- Access to at least one OCI registry (e.g., `ghcr.io`, Docker Hub, or a private registry)
- A GitHub account with a personal access token (for the hands-on examples we are using `ghcr.io`)

## What Are Resolvers?

A resolver maps a **component identity** (name + version) to an **OCM repository** where it is stored. When the CLI
encounters a component reference during recursive resolution, it consults the configured resolvers to determine which
repository to query for the referenced component.

This is particularly useful when:

- A component references other components and you need recursive resolution
- Components are distributed across multiple OCI registries

## Configuration

Resolvers are configured in the OCM configuration file. By default, the CLI searches for configuration in the following locations (in order):

1. The path specified by the `OCM_CONFIG` environment variable
2. XDG / Home directories:
   - `$XDG_CONFIG_HOME/ocm/config`
   - `$XDG_CONFIG_HOME/.ocmconfig`
   - `$HOME/.config/ocm/config`
   - `$HOME/.config/.ocmconfig`
   - `$HOME/.ocm/config`
   - `$HOME/.ocmconfig`
3. Current working directory:
   - `$PWD/ocm/config`
   - `$PWD/.ocmconfig`

You can also specify a configuration file explicitly with the `--config` flag.

{{<callout context="tip">}}
For more information about OCM configuration files, see [OCM Configuration Files]("content/docs/tutorials/creds-in-ocmconfig.md").
{{</callout>}}

### Basic Configuration

The resolver configuration uses the type `resolvers.config.ocm.software/v1alpha1` inside a generic OCM configuration file:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      - repository:
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
```

This tells the CLI: "When looking for any component matching `ocm.software/tutorials/*`, check the OCI registry at
`ghcr.io/<your-github-username>/ocm-tutorial`."

### Repository Types

The `repository` field accepts any OCM repository specification. The most common types are:

**OCI Registry** — for OCI-based registries (e.g., ghcr.io, Docker Hub):

```yaml
repository:
  type: OCIRegistry/v1
  baseUrl: ghcr.io
  subPath: <your-github-username>/ocm-tutorial
```

| Field     | Required | Description                                                                                     |
|-----------|----------|-------------------------------------------------------------------------------------------------|
| `type`    | Yes      | Repository type. Accepted values include `OCIRegistry/v1` and the canonical `OCIRepository/v1`. |
| `baseUrl` | Yes      | Registry host and optional port (e.g., `ghcr.io`, `localhost:5000`).                            |
| `subPath` | No       | Repository prefix path within the registry.                                                     |

**Common Transport Format (CTF)** — for file-based archives:

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

### Component Name Patterns

Each resolver entry can include a `componentNamePattern` field that uses **glob patterns** to match component names. Only components matching the pattern will be routed to that repository.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      - repository:
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
```

Supported glob patterns:

| Pattern                      | Matches                                                 |
|------------------------------|---------------------------------------------------------|
| `ocm.software/tutorials/*`  | Any component directly under `ocm.software/tutorials/`  |
| `ocm.software/core/*`       | Any component under `ocm.software/core/`                |
| `*.software/*/test`         | Components named `test` in any `*.software` namespace   |
| `ocm.software/core/[tc]est` | `ocm.software/core/test` or `ocm.software/core/cest`   |
| `*`                         | All components (wildcard catch-all)                     |

{{<callout context="note">}}
Resolvers are evaluated **in the order they are defined**. The first matching resolver wins. Place more specific patterns before broader ones.
{{</callout>}}

## Try It Out

This section walks through a hands-on example with three components — a **backend**, a **frontend**, and an **app**
that references both — all stored in a single repository. When you recursively resolve the app, the CLI needs a
resolver to locate the referenced backend and frontend components.

### Step 1: Authenticate with the Registry

Log in to `ghcr.io` using a GitHub personal access token:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin
```

### Step 2: Create and Push the Backend Component

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

Push it to the repository:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial \
  --constructor backend-constructor.yaml
```

### Step 3: Create and Push the Frontend Component

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
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial \
  --constructor frontend-constructor.yaml
```

### Step 4: Create and Push the App Component

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

Push it to the same repository:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial \
  --constructor app-constructor.yaml
```

### Step 5: Verify the Components

Check that all three components exist:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/backend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/frontend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0
```

### Step 6: Recursively Resolve the App with a Resolver

Create an `.ocmconfig` file with credentials and a resolver that maps all tutorial components to the repository:

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
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
```

Now recursively resolve the app:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

The CLI:

1. Finds `ocm.software/tutorials/app:1.0.0` in the specified repository
2. Discovers the references to `ocm.software/tutorials/backend:1.0.0` and `ocm.software/tutorials/frontend:1.0.0`
3. Consults the resolver — the pattern `ocm.software/tutorials/*` matches both
4. Looks up backend and frontend in `ghcr.io/<your-github-username>/ocm-tutorial`

## Examples

### Multiple Registries

A common scenario is routing referenced components to different registries based on their namespace:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      # Tutorial components on GitHub
      - repository:
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
      # Internal components on a private registry
      - repository:
          type: OCIRegistry/v1
          baseUrl: myregistry.example.com
          subPath: my-org/components
        componentNamePattern: "mycompany.io/*"
```

### Wildcard Fallback

You can add a catch-all resolver at the end to handle any referenced component that does not match a specific pattern:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      # Specific pattern first
      - repository:
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
      # Catch-all fallback
      - repository:
          type: OCIRegistry/v1
          baseUrl: myregistry.example.com
          subPath: components
        componentNamePattern: "*"
```

### Mixed Repository Types

You can combine different repository types in the same configuration. For example, use a local CTF archive for development and an OCI registry for production components:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: resolvers.config.ocm.software/v1alpha1
    resolvers:
      # Local development components from a CTF archive
      - repository:
          type: CommonTransportFormat/v1
          filePath: ./local-components.ctf
        componentNamePattern: "dev.mycompany.io/*"
      # Production components from OCI registry
      - repository:
          type: OCIRegistry/v1
          baseUrl: myregistry.example.com
          subPath: production/components
        componentNamePattern: "mycompany.io/*"
```

### Combining Resolvers with Credentials

Resolver and credential configurations can coexist in the same configuration file. Simply add both configuration types:

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
          type: OCIRegistry/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-tutorial
        componentNamePattern: "ocm.software/tutorials/*"
```

This gives the CLI both the **routing** (which registry to use) and the **authentication** (how to log in) it needs.

For more details on configuring credentials, see [Credentials in an .ocmconfig File]("content/docs/tutorials/creds-in-ocmconfig.md").

## Recursive Resolution

Resolvers are especially valuable when working with components that **reference other components**. The `--recursive`
flag on commands like `ocm get cv` or `ocm transfer cv` follows these references, and resolvers ensure each referenced
component is looked up in the correct repository.

As shown in the hands-on example above, the app component `ocm.software/tutorials/app:1.0.0` references both
`ocm.software/tutorials/backend:1.0.0` and `ocm.software/tutorials/frontend:1.0.0`. With a resolver configured, the
CLI automatically finds the referenced components:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

{{<callout context="note">}}
For `ocm get cv`, the `--recursive` flag accepts a depth value: `0` for no recursion (default), `-1` for unlimited depth. Limiting the recursion depth with a `positive integer` it planned but not supported yet.
{{</callout>}}

## CLI and Resolver Interaction

When you provide both a repository reference on the command line and have resolvers configured, the CLI uses the following priority order:

1. **Command-line reference** (highest priority) — the repository specified directly in the command
2. **Configured resolvers** — resolvers from the configuration file, matched by component name pattern
3. **Command-line repository as fallback** — if no resolver matches, the repository from the command line acts as a catch-all

This means you can always override resolver behavior by specifying a repository explicitly:

```bash
# Uses resolvers from config to find referenced components
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1

# Explicitly targets a specific repository, ignoring resolvers
ocm get cv ghcr.io/my-mirror//ocm.software/tutorials/app:1.0.0
```

## Transferring Components

Resolvers work with transfer commands as well. When transferring component versions recursively, the resolver is used to locate **referenced** components:

```bash
ocm transfer cv ghcr.io/<your-github-username>/ocm-tutorial//ocm.software/tutorials/app:1.0.0 \
  myregistry.example.com/target --recursive --config .ocmconfig
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
