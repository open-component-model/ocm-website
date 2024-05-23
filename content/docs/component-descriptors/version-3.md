---
title: "Version 3"
description: ""
lead: ""
date: 2023-01-17T10:22:23Z
lastmod: 2023-01-17T10:22:23Z
draft: false
images: []
weight: 2
toc: true
---

The following is an example of a signed component descriptor containing a resource, source and one component reference. It uses the `v3alpha1` schema.

This component is publicly available and can be inspected using the following command:

```shell
ocm componentversion get --repo ghcr.io/open-component-model/ocm ocm.software/ocmcli --scheme v3alpha1 -oyaml
```

## Component Descriptor

```yaml
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.1.0-alpha.2
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:a7bc6c3b208be9c1997d44be65380220ee35128dcd3cc02a66f2993004d6ecdb
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 47575040
        type: ociBlob
      localReference: sha256:a7bc6c3b208be9c1997d44be65380220ee35128dcd3cc02a66f2993004d6ecdb
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-alpha.2
  - access:
      globalAccess:
        digest: sha256:c4b7ccedaf5f78a8cd1b90a396f00b552829cf487a0e285a9c04f882848a8e58
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 45613056
        type: ociBlob
      localReference: sha256:c4b7ccedaf5f78a8cd1b90a396f00b552829cf487a0e285a9c04f882848a8e58
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-alpha.2
  - access:
      globalAccess:
        digest: sha256:027761033cca41639149f2ed66c37ab7f853c99d3d12630cbe092abed7bfa9e2
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 52842546
        type: ociBlob
      localReference: sha256:027761033cca41639149f2ed66c37ab7f853c99d3d12630cbe092abed7bfa9e2
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-alpha.2
  - access:
      globalAccess:
        digest: sha256:fcdce4d88b3368e5eddcd7d1cc9af85238160a4d956c7301b51d6dace6838321
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 53875232
        type: ociBlob
      localReference: sha256:fcdce4d88b3368e5eddcd7d1cc9af85238160a4d956c7301b51d6dace6838321
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-alpha.2
  - access:
      globalAccess:
        digest: sha256:ae5a086cf89ef58f6aa5cc0d216cf76316725de2d4724dd307eeca540cc43e9a
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 48273920
        type: ociBlob
      localReference: sha256:ae5a086cf89ef58f6aa5cc0d216cf76316725de2d4724dd307eeca540cc43e9a
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: windows
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-alpha.2
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.1.0-dev
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:3e11ac7f30c3069e24337885afce04ee168761a2fe7c78afcda97ee1c2cac4f3
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 47575040
        type: ociBlob
      localReference: sha256:3e11ac7f30c3069e24337885afce04ee168761a2fe7c78afcda97ee1c2cac4f3
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-dev
  - access:
      globalAccess:
        digest: sha256:79ca2d5f6a7c821d065aa78e6b153578803c5769c3de8c0e00e91cc1b7d8fb99
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 45613056
        type: ociBlob
      localReference: sha256:79ca2d5f6a7c821d065aa78e6b153578803c5769c3de8c0e00e91cc1b7d8fb99
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-dev
  - access:
      globalAccess:
        digest: sha256:62c15e210f230058514b9ef15a818b4472fbfa8add81a6371a0023b6a43639ef
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 52842546
        type: ociBlob
      localReference: sha256:62c15e210f230058514b9ef15a818b4472fbfa8add81a6371a0023b6a43639ef
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-dev
  - access:
      globalAccess:
        digest: sha256:cfac47a5ca86e82bb5fded0b14b1595a9a3f1878be6154ba7a31568b203fab26
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 53875232
        type: ociBlob
      localReference: sha256:cfac47a5ca86e82bb5fded0b14b1595a9a3f1878be6154ba7a31568b203fab26
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-dev
  - access:
      globalAccess:
        digest: sha256:25e544cc47d1ec6645726d09460c2cca7f7d54c46b8c33e456234ee1545d1b83
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 48273920
        type: ociBlob
      localReference: sha256:25e544cc47d1ec6645726d09460c2cca7f7d54c46b8c33e456234ee1545d1b83
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: windows
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.1.0-dev
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  creationTime: "2024-05-17T13:58:21Z"
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.10.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:e2d8f578083e9317bd199b3f374b7ea60e7f28cf989e8d39ae0ea54ac4fa8847
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: e2d8f578083e9317bd199b3f374b7ea60e7f28cf989e8d39ae0ea54ac4fa8847
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.10.0
  - access:
      localReference: sha256:2acef3da732a6674fb047f3d60f0dabcbb60ffeb8dd362a169df97c4dc4489a8
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 2acef3da732a6674fb047f3d60f0dabcbb60ffeb8dd362a169df97c4dc4489a8
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.10.0
  - access:
      localReference: sha256:b05fbc5e8aaa3622e2ecc39ead7f066030fd183c625b0dc202dbac8131f06d1d
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: b05fbc5e8aaa3622e2ecc39ead7f066030fd183c625b0dc202dbac8131f06d1d
    extraIdentity:
      architecture: arm64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.10.0
  - access:
      localReference: sha256:aec88249f7e5a395eaa18ac6017831b275c7de90d3c10f0cd9e572027ad6c6e9
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: aec88249f7e5a395eaa18ac6017831b275c7de90d3c10f0cd9e572027ad6c6e9
    extraIdentity:
      architecture: amd64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.10.0
  - access:
      localReference: sha256:cdbac49bd004aa2a8b89fafb9e845f45bfcfaab2df402296f55b403b9b1035a2
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: cdbac49bd004aa2a8b89fafb9e845f45bfcfaab2df402296f55b403b9b1035a2
    extraIdentity:
      architecture: amd64
      os: windows
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.10.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.10.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: b575b3cfbd05eac75edb3331761849fd3d7fb63020ff4356ea6bb86945fc8e64
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.10.0
  sources:
  - access:
      commit: b8fea7247d035920a237c4a9d3c4f3606bcef7f7
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.10.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.3.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:069d778bc7e9e8ac062b5938a429c133288026511dbb754cd8bcb1951f066e4d
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 73187328
        type: ociBlob
      localReference: sha256:069d778bc7e9e8ac062b5938a429c133288026511dbb754cd8bcb1951f066e4d
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0
  - access:
      globalAccess:
        digest: sha256:2b62f6685bc85cb105118cca1a69e577dfa4ee6e2cd9259478cc7163b14aab50
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 70189056
        type: ociBlob
      localReference: sha256:2b62f6685bc85cb105118cca1a69e577dfa4ee6e2cd9259478cc7163b14aab50
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.3.0
      type: ociArtifact
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.3.0
  sources:
  - access:
      commit: 4737c160700630a776914476d2f7a2eb25902326
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.3.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.3.0-dev
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:536b3ad387d2e688945c2115b5b90326bbe049659ede1d0b7367f84a96fdb8fd
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 73179136
        type: ociBlob
      localReference: sha256:536b3ad387d2e688945c2115b5b90326bbe049659ede1d0b7367f84a96fdb8fd
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-dev
  - access:
      globalAccess:
        digest: sha256:68867bfa488907039aeb30882bfbd2364f63abe791933595968d527eb26857af
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 70189056
        type: ociBlob
      localReference: sha256:68867bfa488907039aeb30882bfbd2364f63abe791933595968d527eb26857af
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-dev
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.3.0-dev
      type: ociArtifact
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.3.0-dev
  sources:
  - access:
      commit: a4f7d535b6ddff6bc319af71fed31b5b99879797
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.3.0-dev
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.3.0-rc.2
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:6722337627ae8e7ad010528501321dd8644ccab593311591d1ac9f67ad6636f8
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 75476568
        type: ociBlob
      localReference: sha256:6722337627ae8e7ad010528501321dd8644ccab593311591d1ac9f67ad6636f8
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.2
  - access:
      globalAccess:
        digest: sha256:679187c8ec7e7bd4c7d0904b455d2425dd28f693e975d8129c48dcbb1f0dc8d4
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 55246848
        type: ociBlob
      localReference: sha256:679187c8ec7e7bd4c7d0904b455d2425dd28f693e975d8129c48dcbb1f0dc8d4
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.2
  - access:
      globalAccess:
        digest: sha256:d0a0ece6444bd4c4fd7ab900862d85a056b439070aeec8a92e0168d08af3b5e8
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 64282866
        type: ociBlob
      localReference: sha256:d0a0ece6444bd4c4fd7ab900862d85a056b439070aeec8a92e0168d08af3b5e8
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.2
  - access:
      globalAccess:
        digest: sha256:80a30ab705e39ec8ae2aafbafe86ad97255f3982c75a483835c0a0b8fa27fad0
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 65363600
        type: ociBlob
      localReference: sha256:80a30ab705e39ec8ae2aafbafe86ad97255f3982c75a483835c0a0b8fa27fad0
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.2
  - access:
      globalAccess:
        digest: sha256:b4c351a5e9e3690f52f09f247736e3156df3acc460a8b7839c373e46f1a93f5d
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 58501632
        type: ociBlob
      localReference: sha256:b4c351a5e9e3690f52f09f247736e3156df3acc460a8b7839c373e46f1a93f5d
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: windows
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.2
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.3.0-rc.3
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:f9a3fd877108fd62dd9928b921a61329dc31dc5725bce4014f447ef8cfaf36ca
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 73179136
        type: ociBlob
      localReference: sha256:f9a3fd877108fd62dd9928b921a61329dc31dc5725bce4014f447ef8cfaf36ca
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.3
  - access:
      globalAccess:
        digest: sha256:a647f3e8f09684e14635b5a35175d6e806d69d6b88b23787cf3c2258f0525d79
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 70189056
        type: ociBlob
      localReference: sha256:a647f3e8f09684e14635b5a35175d6e806d69d6b88b23787cf3c2258f0525d79
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.3.0-rc.3
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.3.0-rc.3
      type: ociArtifact
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.3.0-rc.3
  sources:
  - access:
      commit: bc535aab7014c2c50ee27a8e3c7c40406286c77e
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.3.0-rc.3
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.4.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:f9c8d254dd9972151c675121af53b9351a2f4e014492009292b77e7c639f8a4f
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 73670656
        type: ociBlob
      localReference: sha256:f9c8d254dd9972151c675121af53b9351a2f4e014492009292b77e7c639f8a4f
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.0
  - access:
      globalAccess:
        digest: sha256:b901eba49a0ae4e427bbe2aa8c17d1c5996abd39b6ca36ccd92844736b93ee31
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 70713344
        type: ociBlob
      localReference: sha256:b901eba49a0ae4e427bbe2aa8c17d1c5996abd39b6ca36ccd92844736b93ee31
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.4.0
      type: ociArtifact
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.4.0
  sources:
  - access:
      commit: 992e32b150519707263d53e3122140fd7989b3e1
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.4.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.4.0-dev
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:f57181a7a317e98eccb28b49f3d6ce2a7a6dc5155f29379b7be0bff925a4c1ec
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 73547776
        type: ociBlob
      localReference: sha256:f57181a7a317e98eccb28b49f3d6ce2a7a6dc5155f29379b7be0bff925a4c1ec
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.0-dev
  - access:
      globalAccess:
        digest: sha256:5be121f48d420e072cd59aa038e93c2b997aa973ec2e92931527fda5ab2be73c
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 70516736
        type: ociBlob
      localReference: sha256:5be121f48d420e072cd59aa038e93c2b997aa973ec2e92931527fda5ab2be73c
      mediaType: application/octet-stream
      type: localBlob
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.0-dev
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.4.0-dev
      type: ociArtifact
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.4.0-dev
  sources:
  - access:
      commit: 101df6e33e1efb1ec7279c8714de625b5d44430d
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.4.0-dev
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.4.1
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:51899e79b6968bc69b3a9c7421449dbf1adc7eb103f50ecd08f26c79f0da9388
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 74727424
        type: ociBlob
      localReference: sha256:51899e79b6968bc69b3a9c7421449dbf1adc7eb103f50ecd08f26c79f0da9388
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 51899e79b6968bc69b3a9c7421449dbf1adc7eb103f50ecd08f26c79f0da9388
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.1
  - access:
      globalAccess:
        digest: sha256:f3588a2a568a00aed74c0bc559c4567966c329a7ada4ac7d9abc22ac1e7e1ee5
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 71761920
        type: ociBlob
      localReference: sha256:f3588a2a568a00aed74c0bc559c4567966c329a7ada4ac7d9abc22ac1e7e1ee5
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: f3588a2a568a00aed74c0bc559c4567966c329a7ada4ac7d9abc22ac1e7e1ee5
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.1
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.4.1
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: e82e5e62232b36175a6e7b0981ece51b4346475415b7fd128fa5efa084e74ab6
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.4.1
  sources:
  - access:
      commit: ff9b7fa53ecd6d564c29b9249ceab1100abb9ff2
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.4.1
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.4.2
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:9ef5505b8c907fb0fec7f4cfc5cf106bf0e0d3de4ca270e007ed713e2a25e110
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 74727424
        type: ociBlob
      localReference: sha256:9ef5505b8c907fb0fec7f4cfc5cf106bf0e0d3de4ca270e007ed713e2a25e110
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 9ef5505b8c907fb0fec7f4cfc5cf106bf0e0d3de4ca270e007ed713e2a25e110
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.2
  - access:
      globalAccess:
        digest: sha256:6473587f47359ac7bef79f9b6c605b06cbb1158472fa0619322b0e12b7775964
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 71761920
        type: ociBlob
      localReference: sha256:6473587f47359ac7bef79f9b6c605b06cbb1158472fa0619322b0e12b7775964
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 6473587f47359ac7bef79f9b6c605b06cbb1158472fa0619322b0e12b7775964
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.2
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.4.2
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 1d13eaa8fa7d6cc23fa0097ea97a00751279ff9c9e1323df7a5648bab2cf0ed7
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.4.2
  sources:
  - access:
      commit: c0c1b3ea9d8ec7232bbfe5ddb215602ff846ca46
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.4.2
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.4.3
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:a9369323ae33ae8451d08541b77f4958a152d8666b3467eabd6c9d8745f8aa00
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 74727424
        type: ociBlob
      localReference: sha256:a9369323ae33ae8451d08541b77f4958a152d8666b3467eabd6c9d8745f8aa00
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: a9369323ae33ae8451d08541b77f4958a152d8666b3467eabd6c9d8745f8aa00
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.3
  - access:
      globalAccess:
        digest: sha256:10fa59e8604cd4fd347a5f0e8974a02e5edfb71511f62362de0ac9ff3ba11e7f
        mediaType: application/octet-stream
        ref: ghcr.io/open-component-model/ocm/component-descriptors/ocm.software/ocmcli
        size: 71761920
        type: ociBlob
      localReference: sha256:10fa59e8604cd4fd347a5f0e8974a02e5edfb71511f62362de0ac9ff3ba11e7f
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 10fa59e8604cd4fd347a5f0e8974a02e5edfb71511f62362de0ac9ff3ba11e7f
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.4.3
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.4.3
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 42f722b6f8c2a88f1fa163708a84dfdbb300df2ee41e59441957329f0bd08c90
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.4.3
  sources:
  - access:
      commit: 12ed2c62ffaedf033453cfec2b77b07298ccf72e
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.4.3
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.5.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:6c1b3c6d0ff1919460555ddedc14e9ba9c70c7ddc07ac72f465d357899902c73
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 6c1b3c6d0ff1919460555ddedc14e9ba9c70c7ddc07ac72f465d357899902c73
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.5.0
  - access:
      localReference: sha256:8c9bd1a573cf544ab9f1403e827213b973dc1f28962f9df686bec8124aca062d
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 8c9bd1a573cf544ab9f1403e827213b973dc1f28962f9df686bec8124aca062d
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.5.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.5.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 00f966b56331366c5692482aceff9cd692b256f105010f4e178519c573494139
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.5.0
  sources:
  - access:
      commit: 65ac4c27b5fa5eb935ab62bd53bd63ba379203ec
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.5.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.6.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:6672528b57fd77cefa4c5a3395431b6a5aa14dc3ddad3ffe52343a7a518c2cd3
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 6672528b57fd77cefa4c5a3395431b6a5aa14dc3ddad3ffe52343a7a518c2cd3
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.6.0
  - access:
      localReference: sha256:9088cb8bbef1593b905d6bd3af6652165ff82cebd0d86540a7be9637324d036b
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 9088cb8bbef1593b905d6bd3af6652165ff82cebd0d86540a7be9637324d036b
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.6.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.6.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: d9e2a53172952d87a6b4b71bf8a7f5823bf31102387ab2823ee81892b8908b85
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.6.0
  sources:
  - access:
      commit: dfcf27e5f22d83feac7869e0f303c6e6e66f1e8d
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.6.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.7.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:f9e1e3d5e4f1ac06f8c73429268da4442f5a6df0132481af1cf0fc51cfa5b9dc
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: f9e1e3d5e4f1ac06f8c73429268da4442f5a6df0132481af1cf0fc51cfa5b9dc
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.7.0
  - access:
      localReference: sha256:69c019e05351d1b190319c11e3b8ae10312acadaba2471f0f81886c0bbbb315c
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 69c019e05351d1b190319c11e3b8ae10312acadaba2471f0f81886c0bbbb315c
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.7.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.7.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 7b3399da19561d3c54bab9d694126174c334a4a080176cb99186ea4075aff3db
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.7.0
  sources:
  - access:
      commit: a2b9f7464074572632c40feb4db19c65b5cedd94
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.7.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  creationTime: "2024-03-08T16:00:35Z"
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.8.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:37558aea3631eb7b89d6b88cff62b5576a38c14ebc79ae5bfe30ed48d0ddf0bb
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 37558aea3631eb7b89d6b88cff62b5576a38c14ebc79ae5bfe30ed48d0ddf0bb
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.8.0
  - access:
      localReference: sha256:4aa7f4e17065be6bcebab371615d1456df6cd836cfa669b75475cd2ccf4b29fc
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 4aa7f4e17065be6bcebab371615d1456df6cd836cfa669b75475cd2ccf4b29fc
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.8.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.8.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: aeec43cfd4050be329d47a21e3fb6ac6f68c22acdba6b6c896b24a5690482485
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.8.0
  sources:
  - access:
      commit: 21dacd0b9c02596252ba533fa75d819d3d184cbb
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.8.0
---
apiVersion: ocm.software/v3alpha1
kind: ComponentVersion
metadata:
  creationTime: "2024-04-26T14:25:23Z"
  name: ocm.software/ocmcli
  provider:
    name: ocm.software
  version: 0.9.0
repositoryContexts:
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: open-component-model/ocm
  type: OCIRegistry
spec:
  resources:
  - access:
      localReference: sha256:1de1c90f23d0a3dbb8d8646f09380f1da257f9d10796b42dc4ef85e8df93a135
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 1de1c90f23d0a3dbb8d8646f09380f1da257f9d10796b42dc4ef85e8df93a135
    extraIdentity:
      architecture: amd64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.9.0
  - access:
      localReference: sha256:ca049bb09399020ce0822fd18c0a534ae0d02c3e0180f05dd4faccf61176a267
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: ca049bb09399020ce0822fd18c0a534ae0d02c3e0180f05dd4faccf61176a267
    extraIdentity:
      architecture: arm64
      os: linux
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.9.0
  - access:
      localReference: sha256:1e32b3f1a08c72e3187b247f8931ea9d0554240fd452a4df129d6036c62b0476
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 1e32b3f1a08c72e3187b247f8931ea9d0554240fd452a4df129d6036c62b0476
    extraIdentity:
      architecture: arm64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.9.0
  - access:
      localReference: sha256:04708d2f9845dd6d52f2b8f94e930f3a74a1a098b7ee401e001307d4b4fcc703
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: 04708d2f9845dd6d52f2b8f94e930f3a74a1a098b7ee401e001307d4b4fcc703
    extraIdentity:
      architecture: amd64
      os: darwin
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.9.0
  - access:
      localReference: sha256:e8cf5dfd1ab02ab982e6f1a425d426fc1f7dc83e6385d26d0477525a4a66c629
      mediaType: application/octet-stream
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: genericBlobDigest/v1
      value: e8cf5dfd1ab02ab982e6f1a425d426fc1f7dc83e6385d26d0477525a4a66c629
    extraIdentity:
      architecture: amd64
      os: windows
    labels:
    - name: downloadName
      value: ocm
    name: ocmcli
    relation: local
    type: executable
    version: 0.9.0
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/ocmcli/ocmcli-image:0.9.0
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 750746a11b154406e6bbc13ff90c4c1f27b3906e10f925908895aa4c8c83dff8
    name: ocmcli-image
    relation: local
    type: ociImage
    version: 0.9.0
  sources:
  - access:
      commit: 548f7a55b87efd776ba72e8621f31cabb7310243
      repoUrl: github.com/open-component-model/ocm
      type: github
    name: source
    type: filesytem
    version: 0.9.0
```
