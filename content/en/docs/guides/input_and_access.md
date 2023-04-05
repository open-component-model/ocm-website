---
title: "Input and Access Types"
description: ""
lead: ""
date: 2023-04-05T08:24:35+02:00
lastmod: 2023-04-05T08:24:35+02:00
draft: false
images: []
menu:
  docs:
    parent: ""
    identifier: "input_and_access-2fd9b49dc5eda4c0921ef431ba3660d5"
weight: 103
toc: true
---

- [Input and Access Types](#input-and-access-types)
  - [Usage:](#usage)
    - [Input Types](#input-types)
      - [binary](#binary)
      - [dir](#dir)
      - [docker](#docker)
      - [dockermulti](#dockermulti)
      - [file](#file)
      - [helm](#helm)
      - [ociImage](#ociimage)
      - [spiff](#spiff)
      - [utf-8](#utf-8)
    - [Access Types](#access-types)
      - [git](#git)
      - [localBlob](#localblob)
      - [ociArtifact](#ociartifact)
      - [ociBlob](#ociblob)
      - [s3](#s3)

# Input and Access Types

The Open Component Model spec supports multiple methods how to add resources to a component version. There are two different ways how to add content: Input Type and Access Type

An **Input type** adds content along with the component descriptor and stores it in the same target repository where the component is store. After pusing the content this always resolves to a

```
relation: local
```

in a component descriptor.

An **Access Type** adds content as reference to a location somewhere else. It is a kind of pointer in a component descriptor. It resolves to a

```
relation: external
```

in a component descriptor.

The following input types are supported:

* binary
* dir
* docker
* dockermulti
* file
* helm
* ociImage
* spiff
* utf-8

The following list of access types is supported:

* git
* localBlob
* ociArtifact
* ociBlob
* s3

Not all access and input types can be combined in useful way with all artifact-types. But the OCM specification defines no restrictions on possible combinations.

## Usage:

This section gives an overview and typical usages examples. Ist describes not the full list of fields and their meaning. Please see the [command reference](https://ocm.software/docs/cli/add/resources/) for this. The examples below are used in a component

```yaml
- name: github.com/open-component-model/megacomponent
  version: 0.1.0
```

### Input Types

#### binary

Allows to define resources with binary content being base64 encoded. Should only be used for smaller blobs.

```yaml
  resources:
  - name: noticeencoded
    type : blob
    input:
      data: VGhpcyBpcyBzb21lIGJhc2U2NCBlbmNvZGVkIGRhdGEK
      mediaType: text/plain
      compress: false
      type: binary
```

#### dir

Defines a resource from content of a directory in the file system. It is packed with `tar` and optionally compressed.

```yaml
  resources:
  - name: megadir
    type : fileSystem
    input:
      type: dir
      path: ./logos
```

#### docker

Takes an image from the local docker registry and adds it as a resource. Requires a running docker daemon.

```yaml
  resources:
  - name: megaimage
    type : ociImage
    input:
      type: docker
      repository: images/mega
      path: megacomp:${VERSION}
```
if VERSION is set to 0.1.0 the following image is imported:

```
docker image ls
REPOSITORY                         TAG                       IMAGE ID       CREATED         SIZE
megacomp                           0.1.0                     9aab9cbca56e   5 days ago      7.46MB
```

The target location of the image can be set with the `repository` field. Here the resulting image will be stored at `<REPO_URL>/github.com/open-component-model/megacomponent/images/mega:1.10` and contain a field in the component descriptor:

```yaml
   - access:
        ...
        referenceName: github.com/open-component-model/megacomponent/images/mega:0.1.0
      name: megaimage
      version: 0.1.0
      ...
```

#### dockermulti

Takes multiple image from the local docker registry and adds them as single multiarch image. Requires a running docker daemon. The images have to be built for different architectures/os and need a unique tag identifying them. As docker does not support multiarch images at the time of writing this is a workaround.

```yaml
  resources:
  - name: megaimagemulti
    type : ociImage
    input:
      type: dockermulti
      repository: images/megamulti
      variants:
        - megacomp:${VERSION}-linux-amd64
        - megacomp:${VERSION}-linux-arm64
```
if VERSION is set to 0.1.0 the following image is imported:

```
docker image ls
REPOSITORY                         TAG                       IMAGE ID       CREATED         SIZE
megacomp                           0.1.0-linux-amd64         96659c4f7a35   5 days ago      7.05MB
megacomp                           0.1.0-linux-arm64         64f209acb814   5 days ago      7.46MB
```

The target location of the image can be set with the `repository` field. Here the resulting image will be stored at `<REPO_URL>/github.com/open-component-model/megacomponent/images/megamulti:1.10` and contain a field in the component descriptor:

```yaml
   - access:
        ...
        referenceName: github.com/open-component-model/megacomponent/images/megamulti:0.1.0
      name: megaimage
      version: 0.1.0
      ...
```

#### file

Imports a file from the local file system and adds it as a resource.

```yaml
  resources:
  - name: mega-file
    type: blob
    input:
      type: file
      path: ./logos/logo-image.png
```

#### helm

Imports a helm chart from the local file system and adds it as a resource.

```yaml
  resources:
  - name: mega-chart
    type: helmChart
    input:
      type: helm
      path: ./megachart
```

#### ociImage

Takes an image that is located in an OCI registry and adds it as a resource

```yaml
  resources:
  - name: mega-image
    type: ociImage
    input:
      type: ociImage
      path: gcr.io/google_containers/echoserver:1.10
      repository: images/echo
```
The target location of the image can be set with the `repository` field. Here the resulting image will be stored at `github.com/open-component-model/megacomponent/images/echo:1.10` and contain a field in the component descriptor:

```yaml
   - access:
        ...
        referenceName: github.com/open-component-model/megacomponent/images/echo:1.10
      name: mega-image
      version: 0.1.0
      ...
```

#### spiff

Processes a resource using the spiff templater and can provide values for variables

```yaml
  resources:
  - name: mega-package
    type: toiPackage
    input:
      type: spiff
      mediaType: application/vnd.toi.ocm.software.package.v1+yaml
      path: packagespec.yaml
      values:
        RELEASE_NAME: megacomp
```

#### utf-8

Adds a resource from inline text.

```yaml
  resources:
  - name: noticeplain
    type : blob
    input:
      text: "Here is some text"
      mediaType: text/plain
      compress: false
      type: utf8
```

### Access Types

#### git

Refers to Git repository at certain commit or tag

```yaml
  resources:
  - name: git-ocm
    type: blob
    version: ${VERSION}
    access:
      type: gitHub
      repoUrl: https://github.com/open-component-model/ocm
      commit: 42cc249aec77aa64984b2b91eb0f3b96dd63aacd
```

#### localBlob

*To be done.*

#### ociArtifact

Refers to an image in an (external) OCI registry

```yaml
  resources:
  - name: echo-image
    version: "1.10"
    type: ociImage
    access:
      type: ociArtifact
      imageReference: gcr.io/google_containers/echoserver:1.10
```

#### ociBlob
*To be done.*

#### s3

Refers to an object in an AWS S3 store

```yaml
  resources:
  - name: gardenlinux-meta
    type: blob
    version: ${VERSION}
    access:
      type: s3
      bucket: gardenlinux
      key: meta/singles/gcp-cloud-gardener-_prod-890.0-53b732
```
