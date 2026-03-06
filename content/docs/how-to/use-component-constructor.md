---
title: "Use the Component Constructor"
description: "Define components, resources, sources, and references using the component-constructor.yaml file."
icon: "📦"
weight: 47
toc: true
---

This guide shows you how to write a `component-constructor.yaml` file and build component versions using the OCM CLI.

## You'll end up with

- A `component-constructor.yaml` declaring your component version
- A CTF (Common Transport Format) archive ready for transfer or signing

## Estimated time

~10 minutes

## How it works

The `ocm add cv` command reads your `component-constructor.yaml`, resolves all declared resources and sources (embedding local files, recording remote references), and writes the resulting component version to a CTF transport archive or directly to an OCI registry.

## Prerequisites

- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed

## Build a Component Version

{{< steps >}}
{{< step >}}

### Define the component

Create a `component-constructor.yaml` with the three required fields — `name`, `version`, and `provider`:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: github.com/acme.org/myapp
  version: 1.0.0
  provider:
    name: acme.org
```

| Field | Rules | Example |
| --- | --- | --- |
| `name` | DNS-style path starting with a domain you control. Lowercase, max 255 chars. | `github.com/acme.org/backend` |
| `version` | [Semantic version](https://semver.org). Optional `v` prefix, pre-release, and build metadata are accepted. | `1.0.0`, `v2.1.0-rc.1` |
| `provider` | Organization or entity that maintains this component. Object with a required `name` field. | `{ name: acme.org }` |

> **Tip:** The `#yaml-language-server` comment enables auto-completion and inline validation in editors that support the [YAML Language Server](https://github.com/redhat-developer/yaml-language-server). The schema is available at [ocm.software/schemas/configuration-schema.yaml](https://ocm.software/schemas/configuration-schema.yaml).

{{< /step >}}
{{< step >}}

### Add local resources

Add resources with `input` to embed local content directly into the archive. Each resource needs a `name`, `type`, and an `input` block.

**Embed a file:**

```yaml
components:
- name: github.com/acme.org/myapp
  version: 1.0.0
  provider:
    name: acme.org
  resources:
    - name: readme
      type: blob
      input:
        type: file/v1
        path: ./README.md
```

**Embed a directory:**

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
    - name: manifests
      type: fileSystem
      input:
        type: dir/v1
        path: ./deploy
        compress: true
```

Set `reproducible: true` if you plan to sign the component — without it, the same directory produces different digests on different machines.

**Embed inline text:**

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
    - name: config
      type: blob
      input:
        type: utf8/v1
        json:
          replicas: 3
          debug: false
```

The `utf8/v1` type accepts one of: `text`, `json`, `formattedJson`, or `yaml`.

**Embed a Helm chart:**

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
    - name: chart
      type: helmChart
      input:
        type: helm/v1
        path: ./charts/myapp
```

> **Note:** Run `ocm describe types input` to see all input types available in your installation. The set is extensible via plugins.

{{< /step >}}
{{< step >}}

### Reference remote resources

Add resources with `access` to record a pointer to content in a remote registry. Access resources require a `version` field.

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
    - name: app-image
      type: ociImage
      version: 1.0.0
      access:
        type: OCIImage/v1
        imageReference: ghcr.io/acme/myapp:1.0.0
```

To embed the remote resource into the archive instead of keeping a reference, add `copyPolicy: byValue`:

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
    - name: app-image
      type: ociImage
      version: 1.0.0
      copyPolicy: byValue
      access:
        type: OCIImage/v1
        imageReference: ghcr.io/acme/myapp:1.0.0
```

Run `ocm describe types ocm-resource-repository` to see all available access types.

{{< /step >}}
{{< step >}}

### Add sources (optional)

Record where the component's code originates. Sources use the same `input` mechanism as resources:

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  resources:
    # ...
  sources:
    - name: source
      type: filesystem
      version: 1.0.0
      input:
        type: dir/v1
        path: ./src
```

Sources are not deployed — they record provenance for audit trails.

{{< /step >}}
{{< step >}}

### Add labels (optional)

Attach metadata to components, resources, sources, or references:

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  labels:
    - name: org
      value: acme.org
    - name: purpose
      value: demo
      signing: true
  resources:
    # ...
```

Set `signing: true` on labels that should be included in component signatures.

{{< /step >}}
{{< step >}}

### Add component references (optional)

Compose a product from independently versioned sub-components:

```yaml
components:
- name: github.com/acme.org/myapp
  # ...
  componentReferences:
    - name: frontend
      componentName: github.com/acme.org/frontend
      version: 1.5.0
    - name: backend
      componentName: github.com/acme.org/backend
      version: 3.1.0
  resources:
    # ...
```

Include referenced components in the same constructor file or ensure they already exist in the target repository.

For multi-component modeling patterns, see [Model Software Products]({{< relref "model-products.md" >}}).

{{< /step >}}
{{< step >}}

### Complete constructor

Here is the full `component-constructor.yaml` combining all the sections above:

<details>
<summary>Show complete constructor</summary>

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: github.com/acme.org/myapp
  version: 1.0.0
  provider:
    name: acme.org
  labels:
    - name: org
      value: acme.org
    - name: purpose
      value: demo
      signing: true
  componentReferences:
    - name: frontend
      componentName: github.com/acme.org/frontend
      version: 1.5.0
  resources:
    - name: readme
      type: blob
      input:
        type: file/v1
        path: ./README.md
    - name: manifests
      type: fileSystem
      input:
        type: dir/v1
        path: ./deploy
        compress: true
        reproducible: true
    - name: config
      type: blob
      input:
        type: utf8/v1
        json:
          replicas: 3
          debug: false
    - name: chart
      type: helmChart
      input:
        type: helm/v1
        path: ./charts/myapp
    - name: app-image
      type: ociImage
      version: 1.0.0
      access:
        type: OCIImage/v1
        imageReference: ghcr.io/acme/myapp:1.0.0
  sources:
    - name: source
      type: filesystem
      version: 1.0.0
      input:
        type: dir/v1
        path: ./src
```

</details>

{{< /step >}}
{{< step >}}

### Build the component version

Run from the directory containing your `component-constructor.yaml`:

```shell
ocm add cv --repository ./transport-archive
```

The `--repository` flag sets where the component version is written — a local directory path creates a CTF archive, an OCI URL pushes directly to a registry.

{{< /step >}}
{{< step >}}

### Verify the result

Inspect the built component version:

```shell
ocm get cv ./transport-archive -o yaml
```

{{< /step >}}
{{< /steps >}}

## Using Environment Variables

Use `${VARIABLE}` or `$VARIABLE` syntax to substitute environment variables anywhere in the constructor file:

```yaml
  version: ${VERSION}
  resources:
    - name: image
      type: ociImage
      version: ${IMAGE_VERSION}
      access:
        type: OCIImage/v1
        imageReference: ghcr.io/acme/myapp:${IMAGE_VERSION}
```

```shell
VERSION=1.2.3 IMAGE_VERSION=6.9.4 ocm add cv
```

Undefined variables expand to empty strings, which will likely fail schema validation.

## Troubleshooting

| Error | Cause |
| --- | --- |
| "component constructor validation failed" | YAML doesn't match the schema. Check field names, nesting, and component name format. |
| "either access or input must be set" | Every resource needs either `input` or `access`. |
| "only one of access or input must be set" | A resource has both — remove one. |
| "error resolving external component" | A reference points to a component not in the constructor file or target repository. |
| "path does not exist" | A `file/v1` or `dir/v1` path doesn't exist relative to the working directory. |
| "invalid copy policy" | `copyPolicy` was set on a resource with `input` — it only applies to `access` resources. |

## CLI Reference

| Command | Description |
| --- | --- |
| `ocm add cv` | Build component versions from a constructor file |
| `ocm describe types input` | List available input types |
| `ocm describe types ocm-resource-repository` | List available access types |
| `ocm get cv` | Inspect component versions |

## Related Documentation

- [Model Software Products]({{< relref "model-products.md" >}}) — compose multi-component products with references
- [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) — formal specification of the component model
