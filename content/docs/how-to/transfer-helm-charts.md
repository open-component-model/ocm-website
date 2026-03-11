---
title: "Transfer Helm Charts with OCM"
description: "Transfer component versions containing Helm chart resources between OCI registries using the OCM CLI."
weight: 110
toc: true
---

## Goal

Transfer a component version that contains a Helm chart resource (type `helmChart` with `helm/v1` access) to an OCI registry, 
controlling how the chart is stored in the target.

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/ocm-cli-installation.md" >}}) installed
- Write access to a target OCI registry with [credentials configured]({{< relref "docs/how-to/configure-multiple-credentials.md" >}})
- A component version containing a Helm chart resource (stored in a CTF archive or OCI registry)

## Steps

{{< steps >}}
{{< step >}}

### Create a component version with a Helm chart resource

If you already have a component version containing a Helm chart, skip to the next step.

Create a `constructor.yaml` that references a chart from a Helm repository:

```yaml
components:
- name: example.com/my-app
  version: 1.0.0
  provider:
    name: example.com
  resources:
  - name: my-chart
    version: 1.0.0
    type: helmChart
    access:
      type: helm/v1
      helmRepository: https://charts.example.com
      helmChart: my-chart-1.0.0.tgz
```

Add the component version to a CTF archive:

```bash
ocm add cv --repository ctf::<path/to/archive> \
  --constructor constructor.yaml \
  --skip-reference-digest-processing
```

{{< /step >}}

{{<callout context="caution" title="Why --skip-reference-digest-processing?" icon="outline/alert-triangle">}}
The `--skip-reference-digest-processing` flag is required because the `helm/v1` access type currently cannot be fully resolved during `add cv`.
The chart is not downloaded at this stage, so digest calculation is not possible. The digests are computed later during transfer when the chart is actually fetched.
Full Helm support is being tracked as a future feature in [ocm-project#911](https://github.com/open-component-model/ocm-project/issues/911).
{{< /callout >}}

{{< step >}}

### Transfer the component version

Transfer the component version to the target registry with `--copy-resources` so the Helm chart artifact is included:

```bash
ocm transfer cv \
  --copy-resources \
  ctf::<path/to/archive>//<component-name>:<version> \
  <target-registry>
```

By default, the chart is stored as a local blob in the component version.

{{< /step >}}
{{< step >}}

### Choose how the chart is stored in the target

Use the `--upload-as` flag to control the storage format of the Helm chart in the target registry:

**As a local blob** (default behavior with `--copy-resources`):

```bash
ocm transfer cv \
  --copy-resources \
  --upload-as localBlob \
  ctf::<path/to/archive>//<component-name>:<version> \
  <target-registry>
```

The chart data is embedded directly inside the component version as a blob layer. The resource access type in the component descriptor becomes `localBlob`. This keeps everything self-contained and transfers atomically, but the chart is not independently pullable from the registry.

**As a standalone OCI artifact**:

```bash
ocm transfer cv \
  --copy-resources \
  --upload-as ociArtifact \
  ctf::<path/to/archive>//<component-name>:<version> \
  <target-registry>
```

The chart is converted to an OCI artifact and uploaded as a separate image in the target registry. The component descriptor references it via an `imageReference` (e.g., `<registry>/<repo>:<tag>`). Use this when you need the chart to be independently addressable and pullable from the registry, for example by tools like `helm pull` or container runtimes.

{{< /step >}}
{{< step >}}

### Verify the transfer

Confirm the component version is available in the target registry:

```bash
ocm get cv <target-registry>//<component-name>:<version>
```

Download the chart resource to verify it was transferred correctly:

```bash
ocm download resource \
  <target-registry>//<component-name>:<version> \
  --identity name=my-chart \
  --output ./downloaded
```

{{< /step >}}
{{< /steps >}}

## Transfer between registries

To transfer a Helm chart component version from one OCI registry to another, use the source registry reference directly:

```bash
ocm transfer cv \
  --copy-resources \
  --upload-as ociArtifact \
  <source-registry>//<component-name>:<version> \
  <target-registry>
```

## Tips

- **If provenance files (`.prov`) are present** in the Helm repository, they are automatically included in the transfer.
- **If you need to transfer recursively**, add `--recursive` to include all transitively referenced component versions.
- **For air-gapped environments**, first transfer to a CTF archive, move it across the boundary, then import into the target registry. See [Transfer Components Across an Air Gap]({{< relref "docs/how-to/air-gap-transfer.md" >}}).

## Related documentation

- [Transfer and Transport]({{< relref "docs/concepts/transfer-concept.md" >}}) -- Understand the transfer model and resource handling
- [Transfer Components Across an Air Gap]({{< relref "docs/how-to/air-gap-transfer.md" >}}) -- Air-gapped transfer workflows
- [Download Resources from Component Versions]({{< relref "docs/how-to/download-resources-from-component-versions.md" >}}) -- Download individual resources
