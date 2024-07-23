---
title: "Create a Component Version"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 24
toc: true
---

## Setting Up Environment Variables

For convenience, we will define the following environment variables:

```shell
PROVIDER="acme.org"
ORG="acme"
COMPONENT="github.com/${ORG}/helloworld"
VERSION="1.0.0"
CA_ARCHIVE="ca-hello-world"
OCM_REPO="ghcr.io/<github-org>/ocm"

CTF_ARCHIVE=ctf-hello-world
```

If you specify values for your setup, you can directly use the commands shown in the next steps.
The variable `OCM_REPO` is set to a location of an OCI registry where artifacts and component
descriptors are stored (omitting the `https://` prefix). For example,
[GitHub Packages](https://github.com/features/packages) can be used as an OCI registry. Many other
options exist.

Let's assume that we are creating a component based on a GitHub source repository.

## Create a Component Archive

The first step when creating a new component version is to create a component archive. A component archive contains references, resources, and sources. The `ocm` CLI tool can help with this.

We begin by creating an empty component archive using the command [`ocm create componentarchive`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_create_componentarchive.md):

```shell
ocm create componentarchive ${COMPONENT} ${VERSION} --provider ${PROVIDER} --file $CA_ARCHIVE
```

<details><summary>What happened?</summary>

This command creates the following file structure:

```
  ca-hello-world
  ├── blobs
  └── component-descriptor.yaml
```

The [component descriptor](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/01-model.md#components-and-component-versions)
is stored as a yaml file named `component-descriptor.yaml`. It describes the content of a component version.

It contains the following configuration:

```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  resources: []
  sources: []
  componentReferences: []
```

By default, the command creates a directory structure. The option `--type` can be used to select other target formats, such as `tar` or `tgz`.

</details>

## Add a Local Resource

The next step is [`ocm add resources`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_add_resources.md).
In this example, we want to add the Helm Chart `podinfo` to the component archive.
If you do not have a Helm Chart available locally, you can follow these steps:

```shell
helm repo add podinfo https://stefanprodan.github.io/podinfo
helm pull --untar podinfo/podinfo
```

```shell
ocm add resource $CA_ARCHIVE --type helmChart --name mychart --version ${VERSION} --inputType helm --inputPath ./podinfo
```
```
  processing resource (by options)...
    processing document 1...
      processing index 1
  found 1 resources
  adding resource helmChart: "name"="mychart","version"="1.0.0"...
```

<details><summary>What happened?</summary>

The generated file structure is:

```
  ca-hello-world
  ├── blobs
  │   └── sha256.2545c7686796c0fbe3f30db26585c61ad51c359cd12d432b5751b7d3be80f1a3
  └── component-descriptor.yaml
```

The added blob contains the packaged Helm Chart. The blob is referenced in the component descriptor
in `component.resources.access.localreference`:

```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  componentReferences: []
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256.2545c7686796c0fbe3f30db26585c61ad51c359cd12d432b5751b7d3be80f1a3
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/podinfo:6.7.0
      type: localBlob
    digest:
      ...
    name: mychart
    relation: local
    type: helmChart
    version: 1.0.0
  sources: []
```

Because we use content from the local environment, it is directly packaged into the component archive
using the [access method](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/02-access-types/README.md) of type
[`localBlob`](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/02-access-types/localblob.md).
</details>

## Add an Image

Next, we will add an image. This can be done in one of two ways:

### Add an Image Reference (Option 1)

If the image is already stored in an image registry (e.g., by a previous Docker build/push), you can simply add a reference to it.

```shell
ocm add resource $CA_ARCHIVE --type ociArtifact --name image --version ${VERSION} --accessType ociArtifact --reference gcr.io/google_containers/echoserver:1.10
```
```
  processing resource (by options)...
    processing document 1...
      processing index 1
  found 1 resources
  adding resource ociArtifact: "name"="image","version"="1.0.0"...
```

<details><summary>What happened?</summary>

The component descriptor now has the following content, with an additional `access` under
`component.resources`, where `access` is of type `external`:

```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  componentReferences: []
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256.2545c7686796c0fbe3f30db26585c61ad51c359cd12d432b5751b7d3be80f1a3
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/podinfo:6.7.0
      type: localBlob
    digest:
      ...
    name: mychart
    relation: local
    type: helmChart
    version: 1.0.0
  - access:
      imageReference: gcr.io/google_containers/echoserver:1.10
      type: ociArtifact
    digest:
      ...
    name: image
    relation: external
    type: ociArtifact
    version: 1.0.0
  sources: []
```

</details>

### Add an Image Resource (Option 2)

Alternatively, you can add an image as a resource built locally using Docker before. It will be picked up from the local Docker file system and added to the component archive.

```shell
docker pull gcr.io/google_containers/echoserver:1.10
docker image ls
```
```
  REPOSITORY                                        TAG            IMAGE ID       CREATED         SIZE
  gcr.io/google_containers/echoserver               1.10           365ec60129c5   6 years ago     95.4MB
```

```shell
ocm add resource ${CA_ARCHIVE} --name image --version ${VERSION} --type ociArtifact --inputType docker --inputPath=gcr.io/google_containers/echoserver:1.10
```
```
  processing resource (by options)...
    processing document 1...
      processing index 1
  found 1 resources
  adding resource ociArtifact: "name"="image","version"="1.0.0"...
    image gcr.io/google_containers/echoserver:1.10
```

<details><summary>What happened?</summary>

The Docker image is downloaded from the Docker daemon, converted to an OCI artifact,
and added as local artifact to the component version.
The component descriptor now has the content:

```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  componentReferences: []
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256.55d2bcf1cbf0384175deaa33c8cfc5e5a7cbf23315e6d6643ee2e29cf0973b8c
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/podinfo:6.7.0
      type: localBlob
    digest:
      ...
    name: mychart
    relation: local
    type: helmChart
    version: 1.0.0
  - access:
      localReference: sha256.d3c2d72fd4e9e04c58f4c420e594afbf7c62b541f5d570460a28e4f3473351a0
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/gcr.io/google_containers/echoserver:1.10
      type: localBlob
    digest:
      ...
    name: image
    relation: local
    type: ociArtifact
    version: 1.0.0
  sources: []
```

The generated blob `sha256.d3c2d...` is an archive describing the image according to the
[OCI Image Layout Specification](https://github.com/opencontainers/image-spec/blob/v1.0.1/image-layout.md).

</details>

## Using a Resources File

You could simplify the previous two steps (adding helm chart and image as resources) by using a text file as input. For that, you could create a file `resources.yaml`, which looks like this:

```yaml
---
name: mychart
type: helmChart
input:
  type: helm
  path: ./podinfo
---
name: image
type: ociArtifact
version: "1.0.0"
access:
  type: ociArtifact
  imageReference: gcr.io/google_containers/echoserver:1.10
```

A resource is described either by its access information to a remote repository or by locally
provided resources. For remote access, the field `access` is used to describe the
[access method](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/02-access-types/README.md). The type field is used to specify the kind of access.

If the resource content should be taken from local resources, the field `input` is used to specify
the access to local resources. In this case, the resource content is directly put into the component
archive. Similarly to the `access` attribute, the kind of the input source is described by the field `type`.
The input types are not part of the input specification but are provided locally by the OCM command
line client. For available input types, see [`ocm add resources`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_add_resources.md).

For more complex scenarios, the description files might use variable substitution (templating), see [Best Practices](/docs/tutorials/best-practices#templating-the-resources).

Add the resources using the following command:

```shell
ocm add resources $CA_ARCHIVE resources.yaml
```
```
  processing resources.yaml...
    processing document 1...
      processing index 1
    processing document 2...
      processing index 1
  found 2 resources
  adding resource helmChart: "name"="mychart","version"="<componentversion>"...
  adding resource ociArtifact: "name"="image","version"="1.0.0"...
```

For a local image built with Docker use this file:

```shell
---
name: mychart
type: helmChart
input:
  type: helm
  path: ./podinfo
---
name: image
type: ociArtifact
version: "1.0.0"
input:
  type: docker
  path: gcr.io/google_containers/echoserver:1.10
```
(Note: If this file is used, the output of the following instructions will differ since another local resource was added.)


## Upload the Component Versions

To upload the component version to an OCI registry, you can transfer the component archive using the command [`ocm transfer componentarchive`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_transfer_componentarchive.md):

```shell
ocm transfer componentarchive ./ca-hello-world ${OCM_REPO}
```
```
  transferring version "github.com/acme/helloworld:1.0.0"...
  ...resource 0 mychart[helmChart](github.com/acme/helloworld/podinfo:6.7.0)...
  ...adding component version...
```

## Bundle Composed Components

If you have created multiple components according to the instructions above, you can bundle
them into a single archive entity. This can be done by creating a transport archive using the common transfer format ([CTF](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/03-storage-backends/ctf.md)).

The transport archive is the entity that does the transfer between
component repositories. It is used to transfer entire deployments between
locations.

A transport archive may contain any number of component versions. It may also be pushed to an OCM repository.

Note that a transport archive is also an OCM repository, so it can also be used as source or as a target
for transport operations.

```shell
ocm transfer componentversion ${CA_ARCHIVE} ${CTF_ARCHIVE}
```
```
  transferring version "github.com/acme/helloworld:1.0.0"...
  ...resource 0 mychart[helmChart](github.com/acme/helloworld/podinfo:6.7.0)...
  ...adding component version...
  1 versions transferred
```

<details><summary>What happened?</summary>

The resulting transport archive has the following file structure:

```
  ctf-hello-world/
  ├── artifact-index.json
  └── blobs
      ├── sha256.0dd94de11c17f995648c8e817971581bce4b016f53d4d2bf2fff9fcda37d7b95
      ├── sha256.4ab29c8acb0c8b002a5037e6d9edf2d657222da76fee2a10f38d65ecd981d0c6
      ├── sha256.b2dc5088f005d27ea39b427c2e67e91e2b6b80d3e85eca2476a019003c402904
      └── sha256.d3cf4858f5387eaea194b7e40b7f6eb23460a658ad4005c5745361978897e043
```

The transport archive's contents can be found in `artifact-index.json`. This file
contains the list of component version artifacts to be transported.

```shell
jq . ${CTF_ARCHIVE}/artifact-index.json
```
```json
{
  "schemaVersion": 1,
  "artifacts": [
    {
      "repository": "component-descriptors/github.com/acme/helloworld",
      "tag": "1.0.0",
      "digest": "sha256:d3cf4858f5387eaea194b7e40b7f6eb23460a658ad4005c5745361978897e043"
    }
  ]
}
```

The content of the transport archive is stored as OCI artifacts. Notice that the repository names of Component Version artifacts (found at `artifacts.respository`) are prefixed by `component-descriptors/`.

The component version is described as an OCI manifest:

```shell
jq . ${CTF_ARCHIVE}/blobs/sha256.d3cf4858f5387eaea194b7e40b7f6eb23460a658ad4005c5745361978897e043
```
```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.ocm.software.component.config.v1+json",
    "digest": "sha256:0dd94de11c17f995648c8e817971581bce4b016f53d4d2bf2fff9fcda37d7b95",
    "size": 201
  },
  "layers": [
    {
      "mediaType": "application/vnd.ocm.software.component-descriptor.v2+yaml+tar",
      "digest": "sha256:4ab29c8acb0c8b002a5037e6d9edf2d657222da76fee2a10f38d65ecd981d0c6",
      "size": 3072
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+tar+gzip",
      "digest": "sha256:b2dc5088f005d27ea39b427c2e67e91e2b6b80d3e85eca2476a019003c402904",
      "size": 16122
    }
  ]
}
```

Notice that the output of the component version above contains the component descriptor as one of the `layers`. It can be identified by its content type, which is `application/vnd.ocm.software.component-descriptor.v2+yaml+tar`. In this case, the component descriptor can be displayed with the following command:

```shell
tar xvf ${CTF_ARCHIVE}/blobs/sha256.4ab29c8acb0c8b002a5037e6d9edf2d657222da76fee2a10f38d65ecd981d0c6 -O - component-descriptor.yaml
```
```yaml
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  componentReferences: []
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256:b2dc5088f005d27ea39b427c2e67e91e2b6b80d3e85eca2476a019003c402904
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/podinfo:6.7.0
      type: localBlob
    digest:
      ...
    name: mychart
    relation: local
    type: helmChart
    version: 1.0.0
  - access:
      imageReference: gcr.io/google_containers/echoserver:1.10
      type: ociArtifact
    digest:
      ...
    name: image
    relation: external
    type: ociArtifact
    version: 1.0.0
  sources: []
```

The other elements listed as `layers` describe the blobs for the local resources stored along with the component version. The digests can be seen in the `localReference` attributes of the component descriptor.

</details>

## All in One

The previous steps can be combined into a single operation working on a single description file that can contain multiple components:

- Creating a Common Transport Archive
- Adding one or more components
- With resources, sources, and references

The command [`ocm add componentversions`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_add_componentversions.md)
directly creates or extends a common transport archive without the need for creating dedicated component archives.

Create a yaml configuration file `component-constructor.yaml`, which contains information about the components
to create and the elements added to those components. You can use our public configuration schema to validate the configuration. The schema is available at `https://ocm.software/schemas/configuration-schema.yaml` and can be used in your editor to validate the configuration (e.g., in Visual Studio Code).

```yaml
# specify a schema to validate the configuration and get auto-completion in your editor
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: github.com/acme.org/helloworld
  version: "1.0.0"
  provider:
    name: acme.org
  resources:
    - name: mychart
      type: helmChart
      input:
        type: helm
        path: ./podinfo
    - name: image
      type: ociArtifact
      version: "1.0.0"
      access:
        type: ociArtifact
        imageReference: gcr.io/google_containers/echoserver:1.10
```

```shell
ocm add componentversions --create --file ${CTF_ARCHIVE} component-constructor.yaml
```
```
  processing component-constructor.yaml...
    processing document 1...
      processing index 1
  found 1 component
  adding component github.com/acme.org/helloworld:1.0.0...
    adding resource helmChart: "name"="mychart","version"="<componentversion>"...
    adding resource ociArtifact: "name"="image","version"="1.0.0"...
```

<details><summary>What happened?</summary>

The command creates the common-transport-archive (option `--create`) and adds the listed components
with the described resources.

```
  ctf-hello-world/
  ├── artifact-index.json
  └── blobs
      ├── sha256.125cf912d0f67b2b49e4170e684638a05a12f2fcfbdf3571e38a016273620b54
      ├── sha256.1cb2098e31e319df7243490464b48a8af138389abe9522c481ebc27dede4277b
      ├── sha256.974e652250ffaba57b820c462ce603fc1028a608b0fa09caef227f9e0167ce09
      └── sha256.d442bdf33825bace6bf08529b6f00cf0aacc943f3be6130325e1eb4a5dfae3a5
```

</details>
