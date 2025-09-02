---
title: "Create a Component Version"
url: "/docs/getting-started/create-component-version/"
description: "Learn how to create and store component versions using the OCM CLI."
icon: "📦"
weight: 23
toc: true
---

## Creating and Storing Component Versions

Component Versions are created using a `component-constructor.yaml` file, which is a description file that contains one or multiple components. The file describes the components and their artifacts - resources and sources, metadata in form of labels and references to other components.

Component Versions are locally stored in archives using the [Common Transfer Format (CTF)](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/03-storage-backends/ctf.md). A CTF archive may contain any number of component versions and is used to transfer components to and between component repositories.

Note that a CTF archive itself is also an OCM repository, so it can be used as source or target for component transfer operations using the OCM CLI.

The command [`ocm add component-version`](/docs/reference/ocm-cli/ocm-add-component-version/) directly creates a component version from a `component-constructor.yaml` file and stores it in a local CTF archive.

### Create a Component Version

In this example we will use the the `ocm` CLI tool to create a very basic component version that contains a local resource and a resource that is accessed from a remote location. The local resource is an arbitrary file that we will create from scratch the remote resource is a Docker image stored in an OCI registry.

OCM components can contain any kind of resource, including Helm charts, Docker images, any content from local file systems, and more. Take a look at the tutorial about [Input and Access Types](/docs/tutorials/input-and-access-types/) to see how to define and use different resource types.

Start by creating a test folder where we execute all required steps for this example and navigating into it:

```shell
mkdir /tmp/helloworld
cd /tmp/helloworld
```

Quickly create a simple test file with some content in:

```shell
echo "My first local Resource for an OCM component" > my-local-resource.txt
```

Now create a file `component-constructor.yaml`, which describes all elements of the component. You can use our public configuration schema to validate the configuration. The schema is available at `https://ocm.software/schemas/configuration-schema.yaml` and can be used in your editor to validate the configuration (e.g., in Visual Studio Code).

Component versions need to have at least a `name`, `version` and `provider` attribute. All other attributes are optional. Check out an [example component descriptor](/docs/getting-started/component-descriptor-example/) or the [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) to see all available attributes.

As mentioned before our example component will just contain a local file and a remote Docker image as resources:

```yaml
# specify a schema to validate the configuration and get auto-completion in your editor
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: github.com/acme.org/helloworld
  # version needs to follow "relaxed" SemVer
  version: 1.0.0
  provider:
    name: acme.org
  resources:
    # local file resource
    - name: mylocalfile
      type: blob
      input:
        type: file
        path: ./my-local-resource.txt
    # remote image resource
    - name: image
      type: ociImage
      version: 1.0.0
      access:
        type: ociArtifact
        imageReference: ghcr.io/stefanprodan/podinfo:6.9.1
```

A resource is described either by its access information to a remote repository or by locally provided resources.

For remote access, the field `access` is used to describe the
[access method](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/02-access-types/README.md).
The type field is used to specify the kind of access.

If the resource content is taken from local resources, the field `input` is used to specify the access to the local resources. Similarly to the `access` attribute, the kind of the input source is described by the field `type`.

Available access and input types are described in the tutorial about [Input and Access Types](/docs/tutorials/input-and-access-types/).

### Add Component Version to CTF archive

To store our component version locally and to make it transportable, now add it to a CTF archive using the following command.

```shell
ocm add component-version
```

or the short form (which we will use from now on)

```shell
ocm add cv
```

This is the most basic command form, where we use the `cv` alias and the OCM CLI defaults both the constructor file name and the CTF archive name. If you want to specify different names, you can use the `--repository` and `-c` flags.

```shell
ocm add cv --repository /path/to/my-own-ctf -c /path/to/my-component-constructor.yaml
```

```shell
...
component github.com/acme.org/helloworld/1.0.0 constructed ... done! [1 component version in 482ms]
```

<details><summary>What happened?</summary>

The command created a CTF archive and added the listed components with the described resources.

```shell
tree transport-archive

transport-archive
├── artifact-index.json
└── blobs
    ├── sha256.096322a7affa6a26a4549e347399f835b2350454946b4967ffdc570dbed78066
    ├── sha256.70a2577d7b649574cbbba99a2f2ebdf27904a4abf80c9729923ee67ea8d2d9d8
    ├── sha256.74db132670ec370396ec10160c4e761591d0e9e6c5960c72d2e26c0f9d6f6a76
    └── sha256.c8359dfaa6353b1b3166449f7ff3a8ef6f1d3a6c6f837cca9cd2ad7e8ef8546e

2 directories, 5 files
```

The transport archive's contents can be found in `artifact-index.json`. This file
contains the list of component version artifacts to be transported.

```shell
jq . transport-archive/artifact-index.json
```

```json
{
  "schemaVersion": 1,
  "artifacts": [
    {
      "repository": "component-descriptors/github.com/acme.org/helloworld",
      "tag": "1.0.0",
      "digest": "sha256:c8359dfaa6353b1b3166449f7ff3a8ef6f1d3a6c6f837cca9cd2ad7e8ef8546e",
      "mediaType": "application/vnd.oci.image.manifest.v1+json"
    }
  ]
}
```

The content of the transport archive is stored as OCI artifacts. Notice that the repository name of component version artifacts (found at `artifacts.respository`) are prefixed by `component-descriptors/`.

The component version is described as an OCI manifest, including OCM specific annotations.

```shell
jq . transport-archive/blobs/sha256.c8359dfaa6353b1b3166449f7ff3a8ef6f1d3a6c6f837cca9cd2ad7e8ef8546e
```

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "artifactType": "application/vnd.ocm.software.component-descriptor.v2",
  "config": {
    "mediaType": "application/vnd.ocm.software/ocm.component.config.v1+json",
    "digest": "sha256:096322a7affa6a26a4549e347399f835b2350454946b4967ffdc570dbed78066",
    "size": 201
  },
  "layers": [
    {
      "mediaType": "application/vnd.ocm.software.component-descriptor.v2+yaml+tar",
      "digest": "sha256:74db132670ec370396ec10160c4e761591d0e9e6c5960c72d2e26c0f9d6f6a76",
      "size": 3072
    },
    {
      "mediaType": "text/plain; charset=utf-8",
      "digest": "sha256:70a2577d7b649574cbbba99a2f2ebdf27904a4abf80c9729923ee67ea8d2d9d8",
      "size": 45,
      "annotations": {
        "software.ocm.artifact": "[{\"identity\":{\"name\":\"mylocalfile\",\"version\":\"1.0.0\"},\"kind\":\"resource\"}]"
      }
    }
  ],
  "annotations": {
    "org.opencontainers.image.authors": "CTF Repository",
    "org.opencontainers.image.description": "\nThis is an OCM OCI Artifact Manifest that contains the component descriptor for the component github.com/acme.org/helloworld.\nIt is used to store the component descriptor in an OCI registry and can be referrenced by the official OCM Binding Library.\n",
    "org.opencontainers.image.documentation": "https://ocm.software",
    "org.opencontainers.image.source": "https://github.com/open-component-model/open-component-model",
    "org.opencontainers.image.title": "OCM Component Descriptor OCI Artifact Manifest for github.com/acme.org/helloworld in version 1.0.0",
    "org.opencontainers.image.url": "https://ocm.software",
    "org.opencontainers.image.version": "1.0.0",
    "software.ocm.componentversion": "component-descriptors/github.com/acme.org/helloworld:1.0.0",
    "software.ocm.creator": "CTF Repository"
  }
}
```

Notice that the output of the component version above contains the component descriptor as one of the `layers`. It can be identified by its media type, which is `application/vnd.ocm.software.component-descriptor.v2+yaml+tar`. Since it is saved in `tar` format, it can be displayed using the following command:

```shell
tar xvf transport-archive/blobs/sha256.74db132670ec370396ec10160c4e761591d0e9e6c5960c72d2e26c0f9d6f6a76 -O
```

```yaml
component-descriptor.yaml
component:
  componentReferences: null
  name: github.com/acme.org/helloworld
  provider: acme.org
  repositoryContexts: null
  resources:
  - access:
      localReference: sha256:70a2577d7b649574cbbba99a2f2ebdf27904a4abf80c9729923ee67ea8d2d9d8
      mediaType: text/plain; charset=utf-8
      type: localBlob/v1
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 70a2577d7b649574cbbba99a2f2ebdf27904a4abf80c9729923ee67ea8d2d9d8
    name: mylocalfile
    relation: local
    type: blob
    version: 1.0.0
  - access:
      imageReference: ghcr.io/stefanprodan/podinfo:6.9.1@sha256:262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb
    name: image
    relation: external
    type: ociImage
    version: 1.0.0
  sources: null
  version: 1.0.0
meta:
  schemaVersion: v2
```

The other elements listed as `layers` describe the blobs for the local resources stored along with the component version. The digests can be seen in the `localReference` attributes of the component descriptor.

</details>
