---
title: "Resolvers"
description: "Learn how OCM resolvers map component name patterns to repositories for recursive resolution."
icon: "🔍"
weight: 44
toc: true
---

## Why Resolvers?

In OCM, a component can **reference** other components. For example, an `app` component might reference a `backend` and
a `frontend` component. These referenced components don't have to live in the same repository as the app — and in
practice, they often don't. Teams publish components independently, to different registries or repository paths.

This creates a problem: when you ask the CLI to recursively resolve a component graph, it needs to know **where** to
find each referenced component. The repository you pass on the command line only tells the CLI where to find the
**root** component. For everything else, the CLI needs a mapping from component names to repositories.

That's what resolvers provide.

## What Are Resolvers?

A resolver maps a **component name pattern** (glob) to an
**[OCM repository](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/01-model.md#component-repositories)**.
When the CLI encounters a component reference during recursive operations, it walks the list of configured resolvers,
finds the first pattern that matches the referenced component name, and queries the associated repository.

## Configuration

Resolvers are configured in the OCM configuration file (by default `$HOME/.ocmconfig`). Each resolver entry maps a
component name pattern to a repository:

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
`ghcr.io/my-org/components`." Resolvers are evaluated in order — the first matching entry wins.

The `repository` field supports different repository types, including OCI registries and file-based CTF archives.
Component name patterns use common glob syntax (e.g., `*` for single-level, `**` for multi-level matching).

{{<callout context="tip">}}
For the full configuration schema, supported repository types, and pattern syntax details, see the
[Resolver Configuration Reference]({{< relref "docs/reference/resolver-configuration.md" >}}).
{{</callout>}}

## Recursive Resolution

When a component version has references to other component versions (via `componentReferences`), the CLI can follow
these references recursively using the `--recursive` flag. The CLI uses resolvers to locate each referenced component
in its respective repository — without them, recursive resolution across multiple repositories is not possible.

## OCM Transfer

The `transfer cv` command supports resolvers, allowing you to move component versions (e.g., an OCI image) from one OCI repository to another.
Combined with `--recursive` and a resolver configuration, the CLI can transfer entire component graphs across registries.
If you want to copy all referenced resources, use the `--copy-resources` flag to transfer resources linked in those component versions.
For more information about OCM transfer, see the [Transfer and Transport]({{< relref "docs/concepts/transfer-concept.md" >}})

```bash
ocm transfer cv ghcr.io/my-org/components//example.com/services/app:1.0.0 \
  ghcr.io/my-org/target-repo --recursive \
  --copy-resources \
  --config .ocmconfig
```

{{<callout context="tip">}}
For more information about the `transfer` command, see the
[OCM CLI Transfer reference](https://ocm.software/docs/reference/ocm-cli/transfer/).
{{</callout>}}

## Related Documentation

- [Resolver Configuration Reference]({{< relref "docs/reference/resolver-configuration.md" >}}) — Full schema, repository types, and pattern syntax
- [Components]({{< relref "components.md" >}}) — Core concepts behind component versions, identities, and references
- [Working with Resolvers Tutorial]({{< relref "docs/tutorials/configure-resolvers.md" >}}) — Hands-on walkthrough for setting up resolvers
- [How to Resolve Components Across Multiple Registries]({{< relref "docs/how-to/resolve-components-from-multiple-repositories.md" >}}) — Recipe for
  multi-registry resolution
- [Credentials in an .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) — Configure credentials for OCI registries
- [How to Transfer Components Across an Air Gap]({{< relref "docs/how-to/air-gap-transfer.md" >}}) — Use OCM Transfer to move components between
  air-gapped environments
