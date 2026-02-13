---
title: "Resolve Dependencies from Multiple Repositories"
description: "Configure resolvers to recursively resolve component references when each dependency lives in its own repository."
icon: "🔍"
weight: 100
toc: true
---

## Overview

In [Resolve Dependencies from a Shared Repository]({{< relref "configure_resolvers.md" >}}), all
dependencies were stored in a single repository with one resolver entry. In practice, dependencies often come from
**different repositories** — for example, when each team or project publishes their components independently.

This tutorial extends the previous example by storing the backend and frontend components in their **own dedicated
repositories**, each with a separate resolver entry.

{{<callout context="note" title="What You'll Learn">}}
In this tutorial, you will:
- Push each dependency component to its own dedicated OCI repository
- Write per-component resolver entries that map specific names to specific repositories
- Recursively resolve a component graph where each dependency lives in a different registry path
{{</callout>}}

## Prerequisites

- The [OCM CLI](https://github.com/open-component-model/open-component-model) installed
- Access to at least one OCI registry (e.g., `ghcr.io`, Docker Hub, or a private registry)
- A GitHub account with a personal access token (for the hands-on examples we are using `ghcr.io`)

## Tutorial

### Step 1: Authenticate with the Registry

Log in to `ghcr.io` using a GitHub personal access token:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-github-username> --password-stdin
```

Your token needs to have write permissions for packages in order to push component versions to the registry.
For more information on creating a personal access token, see [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

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

Push it to the **backend repository**:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-backend \
  --constructor backend-constructor.yaml
```

The expected output should look like this:

```
 COMPONENT                      │ VERSION │ PROVIDER
────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/backend │ 1.0.0   │ ocm.software
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

Push it to the **frontend repository**:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-frontend \
  --constructor frontend-constructor.yaml
```

The expected output should look like this:

```
 COMPONENT                       │ VERSION │ PROVIDER
─────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/frontend │ 1.0.0   │ ocm.software
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

Push it to the **app repository**:

```bash
ocm add cv --repository ghcr.io/<your-github-username>/ocm-tutorial-app \
  --constructor app-constructor.yaml
```

The expected output should look like this:

```
  COMPONENT                       │ VERSION │ PROVIDER
─────────────────────────────────┼─────────┼──────────────
 ocm.software/tutorials/app      │ 1.0.0   │ ocm.software
 ocm.software/tutorials/backend  │ 1.0.0   │
 ocm.software/tutorials/frontend │ 1.0.0   │
```

{{<callout context="tip">}}
If you are re-running this tutorial and the component versions already exist, add `--component-version-conflict-policy replace` to the `ocm add cv` commands to overwrite existing versions.
{{</callout>}}

### Step 5: Configure Resolvers for Multiple Repositories

Create an `.ocmconfig` file where each dependency points to its own repository:

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

Each resolver entry maps a specific component to its dedicated repository. Compare this with the shared repository
approach where both entries pointed to the same `subPath`.

### Step 6: Verify the Components

Check that all three components exist in their respective repositories:

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-backend//ocm.software/tutorials/backend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-frontend//ocm.software/tutorials/frontend:1.0.0
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-app//ocm.software/tutorials/app:1.0.0
```

### Step 7: Recursively Resolve the App

```bash
ocm get cv ghcr.io/<your-github-username>/ocm-tutorial-app//ocm.software/tutorials/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

The CLI:

1. Finds `ocm.software/tutorials/app:1.0.0` in the app repository
2. Discovers the references to the backend and frontend components
3. Looks up the backend in `ghcr.io/<your-github-username>/ocm-tutorial-backend`
4. Looks up the frontend in `ghcr.io/<your-github-username>/ocm-tutorial-frontend`

This pattern scales to any number of repositories — simply add a resolver entry for each component or use glob patterns
to match groups of components from the same repository.

## What Comes Next

Now that you know how to configure resolvers for multiple repositories, you can:

- **Start with a shared repository**: If you haven't already, see [Resolve Dependencies from a Shared Repository]({{< relref "configure_resolvers.md" >}}) for the fundamentals of resolver configuration, including glob patterns and repository types.
- **Learn more about component references**: Understand how components link together and how references are structured in a [Complex Component Structure]({{< relref "complex-component-structure-deployment.md" >}}).
- **Explore credential configuration**: See [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) for authentication options when working with registries.
- **Transfer components between registries**: Use resolvers with `ocm transfer cv` to move component graphs across registries.
- **Set up air-gapped environments**: Use CTF archives with resolvers for offline component resolution. Learn about the Common Transport Format in [Creating a Component Version]({{< relref "docs/getting-started/create-component-version.md" >}}).

## Related Documentation

- [Components]({{< relref "docs/concepts/components.md" >}}) — Core concepts behind component versions, identities, and references
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries, Helm repositories, and more
- [Creating a Component Version]({{< relref "docs/getting-started/create-component-version.md" >}}) — Build component versions and work with CTF archives
- [Input and Access Types]({{< relref "input-and-access-types.md" >}}) — Reference for resource input types (by value) and access types (by reference)
- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) — Sign and verify component versions with cryptographic keys
- [Configure Credentials for Controllers]({{< relref "configure-credentials-for-controllers.md" >}}) — Set up credentials for OCM controllers in Kubernetes
