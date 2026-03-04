---
title: "How to Resolve Components Across Multiple Registries"
description: "Configure resolvers to recursively resolve component references distributed across multiple OCI registries."
weight: 10
toc: true
---

## Goal

Configure an `.ocmconfig` file with resolver entries so the OCM CLI can recursively resolve component references stored
in different OCI registries.

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/ocm-cli-installation.md" >}}) installed
- [Components]({{< relref "docs/getting-started/create-component-version.md" >}}) already pushed to separate OCI registries
- An OCM configuration file (see [.ocmconfig documentation](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_configfile.md)

## Steps

{{< steps >}}

{{< step >}}
**Create an `.ocmconfig` with resolver entries**

Add a resolver entry for each registry where referenced components are stored. Replace the placeholder values with your
own registry, paths, and component names:

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
          baseUrl: <registry>                 # e.g. ghcr.io
          subPath: <subpath-a>                # e.g. my-org/team-a
        componentNamePattern: "<pattern-a>"   # e.g. my-org.example/component-a
      - repository:
          type: OCIRepository/v1
          baseUrl: <registry>                 # e.g. ghcr.io
          subPath: <subpath-b>                # e.g. my-org/team-b
        componentNamePattern: "<pattern-b>"   # e.g. my-org.example/component-b
```

{{< /step >}}

{{< step >}}
**Resolve the root component recursively**

Point the CLI at the root component and pass your config file:

```bash
ocm get cv <registry>/<root-subpath>//<root-component>:<version> \
  --recursive=-1 --config .ocmconfig
```

The CLI follows every component reference in the graph and uses the resolver entries to locate each one.

<details>
<summary>Example</summary>

```bash
ocm get cv ghcr.io/my-org/components//example.com/services/app:1.0.0 \
  --recursive=-1 --config .ocmconfig
```

</details>

{{< /step >}}

{{< step >}}
**Verify the output**

The output should list the root component and all transitively referenced components. If a referenced component is
missing, check that there is a matching resolver entry for it.

<details>
<summary>Example output</summary>

```text
COMPONENT          │ VERSION │ PROVIDER
───────────────────┼─────────┼──────────
<root-component>   │ x.y.z   │ <provider>
<component-a>      │ x.y.z   │
<component-b>      │ x.y.z   │
```

</details>

{{< /step >}}

{{< /steps >}}

## Tips

- **If multiple components share a registry path**, use a glob pattern (e.g. `example.com/services/*`) instead of
  listing each component individually. See
  [Component Name Patterns]({{< relref "docs/concepts/resolvers.md#component-name-patterns" >}}) for the full syntax.
- **If you need to transfer components to another registry**, use `ocm transfer cv --recursive --copy-resources` with
  the same config file. See
  [OCM Transfer]({{< relref "docs/concepts/resolvers.md#ocm-transfer" >}}) for details.
- **Resolvers are evaluated in order** — place more specific patterns before broader ones so the right repository is
  matched first.

## Related documentation

- [Resolvers]({{< relref "docs/concepts/resolvers.md" >}}) — Concept page with configuration schema, pattern syntax,
  and transfer details
- [Working with Resolvers Tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) — Hands-on tutorial for
  building and pushing components with resolvers
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure registry credentials
