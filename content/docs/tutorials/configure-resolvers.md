---
title: "Configure Resolvers in OCM CLI"
description: "Configure resolvers to recursively resolve component references from a shared repository."
icon: "🔍"
weight: 80
toc: true
---

## Overview

When a component has **references** to other components stored in different repositories, the CLI needs to know where to
find them. **Resolvers** map component name patterns to repositories so the CLI can automatically locate referenced
components during recursive operations. For a detailed explanation of resolver concepts, configuration options, and
pattern syntax, see the [Resolvers concept page]({{< relref "docs/concepts/resolvers.md" >}}).

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

## Walkthrough

This tutorial walks through a hands-on example with three components — a **backend**, a **frontend**, and an **app**
that references both. The app lives in its own repository, while its component references (backend and frontend
component) are stored in
a shared repository. When you recursively resolve the app, the CLI needs resolvers to locate the referenced
components in their repositories.

{{< steps >}}

{{< step >}}
**Set up your environment**

Before starting, set an environment variable for your GitHub username to simplify command inputs:

```bash
export GITHUB_USERNAME=<your-github-username>
```

This variable will be used in repository paths throughout the tutorial.

{{< /step >}}

{{<callout context="note">}}
For more information on creating a personal access token,
see [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

⚠️ The token must have the `write:packages` scope to allow pushing component versions
to [GitHub Container Registry](https://ghcr.io).
{{</callout>}}

{{< step >}}
**Authenticate with the Registry**

Log in to `ghcr.io` using a GitHub personal access token:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

Your token needs to have write permissions for packages in order to push component versions to the registry.
{{< /step >}}

{{<callout context="tip">}}
If you are re-running this tutorial and the component versions already exist, add
`--component-version-conflict-policy replace` to the `ocm add cv` commands to overwrite existing versions.
{{</callout>}}

{{< step >}}
**Create and Push the Backend Component**

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
ocm add cv --repository ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial-deps \
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
ocm add cv --repository ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial-deps \
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
**Create the App Component**

Create `app-constructor.yaml`. Notice the `componentReferences` section — it declares dependencies on both the backend
and frontend components:

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

{{< /step >}}

{{<callout context="note">}}
⚠️ Do not call `add cv` yet — we need to set up resolvers first so the CLI can find the referenced components during
recursive resolution.
If you'd try to push your app-component now, the CLI would reject it because it can't find the referenced backend and
frontend components in the app repository.
{{</callout>}}

{{< step >}}

**Recursively Resolve the App with Resolvers**

Before we can push the app-component that references the backend and frontend components,
we need to set up resolvers so the CLI can find the referenced components during recursive resolution.
Create an `.ocmconfig` file with credentials and resolvers that map the component references to their repository:

```bash
cat <<EOF > .ocmconfig
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
          subPath: $GITHUB_USERNAME/ocm-resolver-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/frontend"
      - repository:
          type: OCIRepository/v1
          baseUrl: ghcr.io
          subPath: $GITHUB_USERNAME/ocm-resolver-tutorial-deps
        componentNamePattern: "ocm.software/tutorials/backend"
EOF
```

{{< /step >}}

{{< step >}}
**Push the App Component**

After declaring the resolvers pointing to backend and frontend, you can not push the **app component** to the **app
repository** —
a separate repository from where the component references are stored:

```bash
ocm add cv --repository ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial \
  --constructor app-constructor.yaml --config .ocmconfig
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

The CLI:

1. Finds `ocm.software/tutorials/app:1.0.0` in the specified app repository
2. Discovers the references to `ocm.software/tutorials/backend:1.0.0` and `ocm.software/tutorials/frontend:1.0.0`
3. Consults the resolvers — each component name matches a configured pattern
4. Looks up backend and frontend in `ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial-deps`

{{< /step >}}

{{< step >}}
**Verify the Components**

Check that all three components exist in their respective repositories:

```bash
ocm get cv ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial-deps//ocm.software/tutorials/backend:1.0.0
ocm get cv ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial-deps//ocm.software/tutorials/frontend:1.0.0
ocm get cv ghcr.io/$GITHUB_USERNAME/ocm-resolver-tutorial//ocm.software/tutorials/app:1.0.0
```

The outputs of each command should show the respective component version with its provider.
{{< /step >}}

{{< /steps >}}

{{<callout context="tip" title="Resolving from Multiple Repositories">}}
In the tutorial above, both component references share a single repository. In practice, components often live in *
*separate repositories**. See the how-to guide
[How to Resolve Components from Multiple Repositories]
({{< relref "docs/how-to/resolve-components-from-multiple-repositories.md" >}})
for a step-by-step recipe.
{{</callout>}}

## What you've learned

- How to push components with references to separate repositories
- How to configure resolvers in an `.ocmconfig` file
- How to use `--recursive` to resolve a component graph across repositories

## What Comes Next

Now that you know how to configure resolvers, you can:

- Learn more about component
  references: [Referencing Components](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/01-references.md).
- Explore credential configuration: See [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) for
  authentication options when working with registries.
- Set up air-gapped environments: Use CTF archives with resolvers for offline component resolution. Learn about the
  Common Transport Format in [Creating a Component Version]
  ({{< relref "docs/getting-started/create-component-version.md" >}}).

## Related Documentation

- [Resolvers]({{< relref "docs/concepts/resolvers.md" >}}) — Resolver concepts, configuration options, pattern syntax,
  and schema reference
- [Components]({{< relref "docs/concepts/components.md" >}}) — Core concepts behind component versions, identities, and
  references
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI
  registries, Helm repositories, and more
- [Creating a Component Version]({{< relref "docs/getting-started/create-component-version.md" >}}) — Build component
  versions and work with CTF archives
- [Input and Access Types]({{< relref "input-and-access-types.md" >}}) — Reference for resource input types (by value)
  and access types (by reference)
- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) — Sign and verify component versions with
  cryptographic keys
