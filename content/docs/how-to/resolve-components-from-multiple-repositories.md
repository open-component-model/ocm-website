---
title: "How to Resolve Components from Multiple Repositories"
description: "Configure resolvers to recursively resolve component references distributed across multiple registries."
weight: 10
toc: true
---

## Goal

Configure OCM resolvers so the CLI can recursively resolve component references that are stored in separate OCI
repositories.
For background on how resolvers work, see the [Resolvers concept page]({{< relref "docs/concepts/resolvers.md" >}}).

{{< callout type="note" >}}
**You will end up with**

- An `.ocmconfig` file with resolver entries pointing to different repositories
- A working `ocm get cv --recursive` command that resolves components across repositories
  {{< /callout >}}

**Estimated time:** ~5 minutes

## Prerequisites

- [Getting Started]({{< relref "docs/getting-started/_index.md" >}}) completed
- [OCM CLI]({{< relref "docs/getting-started/ocm-cli-installation.md" >}}) installed
- Access to at least one OCI registry (e.g., `ghcr.io`)
- Components with references already pushed to separate repositories (if you need to set these up first, follow
  the [Configure Resolvers tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}))

This guide assumes you have the following components already pushed:

| Component                                                      | Repository                                                      |
|----------------------------------------------------------------|-----------------------------------------------------------------|
| `ocm.software/tutorials/backend`                               | `ghcr.io/<your-github-username>/ocm-resolver-tutorial-backend`  |
| `ocm.software/tutorials/frontend`                              | `ghcr.io/<your-github-username>/ocm-resolver-tutorial-frontend` |
| `ocm.software/tutorials/app` (references backend and frontend) | `ghcr.io/<your-github-username>/ocm-resolver-tutorial-app`      |

## Steps

{{< steps >}}

{{< step >}}
**Create an `.ocmconfig` with per-component resolvers**

Each resolver entry points to the repository where a specific component is stored:

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
          subPath: <your-github-username>/ocm-resolver-tutorial-frontend
        componentNamePattern: "ocm.software/tutorials/frontend"
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: <your-github-username>/ocm-resolver-tutorial-backend
        componentNamePattern: "ocm.software/tutorials/backend"
```

{{< /step >}}

{{< callout type="tip" >}}
If multiple components share a repository, use glob patterns (e.g., `ocm.software/tutorials/*`) to match them with a
single resolver entry instead of listing each one individually. See
[Component Name Patterns]({{< relref "docs/concepts/resolvers.md#component-name-patterns" >}})
for the full pattern syntax.
{{< /callout >}}

{{< step >}}
**Resolve the app recursively**

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-resolver-tutorial-app//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

You should see all three components listed in the output. This confirms that the CLI resolved the backend and frontend
references from their respective repositories.

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

{{< /steps >}}

This pattern scales to any number of repositories — simply add a resolver entry for each component or use glob patterns
to match groups of components from the same repository.

## Next steps

- **Learn resolver concepts and patterns**: See the
[Resolvers concept page]({{< relref "docs/concepts/resolvers.md" >}}) for configuration options, pattern syntax, and
  schema reference.
- **Build components with references from scratch**: Follow the
[Configure Resolvers tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) for a full walkthrough.
- **Explore credential configuration**: See [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}})
  for authentication options when working with registries.

## Related documentation

- [Resolvers]({{< relref "docs/concepts/resolvers.md" >}}) — Resolver concepts, configuration options, pattern syntax,
  and schema reference
- [Configure Resolvers Tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) — Full tutorial covering
  hands-on resolver setup
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries
