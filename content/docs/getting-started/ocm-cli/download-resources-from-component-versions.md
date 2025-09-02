---
title: "Download Resources from Component Versions"
description: "Learn how to download resources from component versions in OCM."
icon: "📥 "
weight: 25
toc: true
---

## Download Resources of a Component Version

Use the [`ocm download resources`]({{< relref "ocm_download_resource.md" >}}) command to download specific resources from a component version. In this example we download the resource with name `chart` from the [example component used in the last chapter]({{< relref "display-examine-component-versions.md#get-and-examine-component-versions" >}}) and save it as local file:

```shell
ocm download resource ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.21.0 --identity name=chart --output helmchart.tgz
```

```shell
...
time=2025-08-14T13:03:54.372+02:00 level=INFO msg="resource downloaded successfully" output=helmchart.tgz
```

Because it is stored as OCI artifact in an OCI registry, the filesystem format used for OCI artifacts is the blob format.

<details><summary>What happened?</summary>

The file `helmchart.tgz` was downloaded.

```shell
tar xvf helmchart.tgz
```

```shell
blobs/sha256/ea8e5b44cd1aff1f3d9377d169ad795be20fbfcd58475a62341ed8fb74d4788c
blobs/sha256/8702d8d550075e410f3aae545d1191df9e5ab8747e5c5a8eda5ed834fd135366
blobs/sha256/8ab41f82c9a28535f1add8ffbcd6d625a19ece63c4e921f9c8358820019d1ec2
index.json
oci-layout
```

{{<callout context="caution" title="Under Construction">}}The file permissions and ownership may not be preserved when extracting the archive. This needs to be fixed. Currently you have to add at least read permissions to continue: `chmod +r index.json`{{</callout>}}

```shell
jq . index.json
```

```json
{
  "schemaVersion": 2,
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:8ab41f82c9a28535f1add8ffbcd6d625a19ece63c4e921f9c8358820019d1ec2",
      "size": 410,
      "annotations": {
        "org.opencontainers.image.ref.name": "ghcr.io/open-component-model/ocm/ocm.software/toi/demo/helmdemo/echoserver:0.1.0@sha256:8ab41f82c9a28535f1add8ffbcd6d625a19ece63c4e921f9c8358820019d1ec2"
      }
    }
  ]
}
```

</details>

### Download using Transformers

{{<callout context="caution" title="Under Construction">}}Transformers are currently in development. We'll extend the below section once they are ready to be used. Until then you can check out the [Transformer ADR](https://github.com/open-component-model/open-component-model/blob/main/docs/adr/0005_transformation.md){{</callout>}}

To use a format more suitable for the content technology, you can use the `--transformer` to specify a transformer. The transformer will take care that the file will be saved using its correct media type, e.g. a Helm charts will be saved as `.tgz` file which on extraction will show the complete chart.

```shell
ocm download resource ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 chart --identity name=chart --output helmchart.tgz --transformer helm
```

```shell
  helmchart.tgz: 3763 byte(s) written^
```

<details><summary>What happened?</summary>

The downloaded archive is now a regular Helm Chart archive:

```shell
tar tvf helmchart.tgz
```

```shell
  -rw-r--r--  0 0      0         136 Jul 19 16:32 echoserver/Chart.yaml
  -rw-r--r--  0 0      0        1842 Jul 19 16:32 echoserver/values.yaml
  -rw-r--r--  0 0      0        1755 Jul 19 16:32 echoserver/templates/NOTES.txt
  -rw-r--r--  0 0      0        1802 Jul 19 16:32 echoserver/templates/_helpers.tpl
  -rw-r--r--  0 0      0        1848 Jul 19 16:32 echoserver/templates/deployment.yaml
  -rw-r--r--  0 0      0         922 Jul 19 16:32 echoserver/templates/hpa.yaml
  -rw-r--r--  0 0      0        2083 Jul 19 16:32 echoserver/templates/ingress.yaml
  -rw-r--r--  0 0      0         367 Jul 19 16:32 echoserver/templates/service.yaml
  -rw-r--r--  0 0      0         324 Jul 19 16:32 echoserver/templates/serviceaccount.yaml
  -rw-r--r--  0 0      0         385 Jul 19 16:32 echoserver/templates/tests/test-connection.yaml
  -rw-r--r--  0 0      0         349 Jul 19 16:32 echoserver/.helmignore
```

</details>
