---
title: "How to Resolve Components from Multiple Repositories"
description: "Configure resolvers to recursively resolve component references distributed across multiple OCI registries."
weight: 10
toc: true
---

## Goal

Configure OCM resolvers so the CLI can recursively resolve component references that are stored in separate OCI repositories.

{{< callout type="note" >}}
**You will end up with**

- An `.ocmconfig` file with resolver entries pointing to different repositories
- A working `ocm get cv --recursive` command that resolves components across repositories
{{< /callout >}}

**Estimated time:** ~10 minutes

## Prerequisites

- [Getting Started]({{< relref "docs/getting-started/_index.md" >}}) completed
- [OCM CLI]({{< relref "docs/getting-started/ocm-cli-installation.md" >}}) installed
- Access to at least one OCI registry (e.g., `ghcr.io`)
- Components with references already created (if you need to set these up first, follow the [Configure Resolvers tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}))

## Steps

1. **Push each component to its own repository**

   If your referenced components need to live in separate repositories (e.g., different teams or access control requirements), push each to a dedicated repository:

   ```bash
   ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-backend \
     --constructor backend-constructor.yaml

   ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-frontend \
     --constructor frontend-constructor.yaml

   ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-app \
     --constructor app-constructor.yaml
   ```

2. **Create an `.ocmconfig` with per-component resolvers**

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
             subPath: <your-github-username>/ocm-tutorial-frontend
           componentNamePattern: "ocm.software/tutorials/frontend"
         - repository:
             type: OCIRepository/v1
             baseUrl: ghcr.io
             subPath: <your-github-username>/ocm-tutorial-backend
           componentNamePattern: "ocm.software/tutorials/backend"
   ```

   {{< callout type="tip" >}}
   If multiple components share a repository, use glob patterns (e.g., `ocm.software/tutorials/*`) to match them with a single resolver entry instead of listing each one individually. See [Component Name Patterns]({{< relref "docs/tutorials/configure-resolvers.md#component-name-patterns" >}}) for the full pattern syntax.
   {{< /callout >}}

3. **Resolve the app recursively**

   ```bash
   ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-app//ocm.software/tutorials/app:1.0.0 \
     --recursive=-1 --config .ocmconfig
   ```

   You should see all three components listed in the output. This confirms that the CLI resolved the backend and frontend references from their respective repositories.

   <details>
     <summary>Expected output</summary>

   ```text
    COMPONENT                       │ VERSION │ PROVIDER
   ─────────────────────────────────┼─────────┼──────────────
    ocm.software/tutorials/app      │ 1.0.0   │ ocm.software
    ocm.software/tutorials/backend  │ 1.0.0   │ ocm.software
    ocm.software/tutorials/frontend │ 1.0.0   │ ocm.software
   ```
   </details>

This pattern scales to any number of repositories — simply add a resolver entry for each component or use glob patterns to match groups of components from the same repository.

## Next steps

- **Learn resolver concepts and patterns**: See the [Configure Resolvers tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) for a full walkthrough of building components with references from scratch.
- **Explore credential configuration**: See [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) for authentication options when working with registries.

## Related documentation

- [Configure Resolvers Tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) — Full tutorial covering resolver concepts, patterns, and hands-on examples
- [Configuration Reference]({{< relref "docs/tutorials/configure-resolvers.md#configuration-reference" >}}) — Resolver and repository schema details
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries
