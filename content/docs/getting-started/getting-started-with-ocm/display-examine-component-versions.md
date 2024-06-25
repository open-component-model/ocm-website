---
title: "Display and Examine Component Versions"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 25
toc: true
---

## Display and Examine Component Versions

### List Component Versions

To show the component stored in a component archive (without looking at the file system structure), the [`ocm get componentversion`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_get_componentversions.md) command can be used:

```shell
ocm get componentversion ${CA_ARCHIVE}
```

```shell
COMPONENT                  VERSION PROVIDER
github.com/acme/helloworld 1.0.0   acme.org
```

To see the component descriptor of the displayed component version, use the output format option `-o yaml`:

```shell
ocm get componentversion ${CA_ARCHIVE} -o yaml
```

```shell
---
context: []
element:
  component:
    componentReferences: []
    name: github.com/acme/helloworld
    provider:
      name: acme.org
    repositoryContexts: []
    resources: []
    sources: []
    version: 1.0.0
  meta:
    configuredSchemaVersion: v2
```

Display the component versions of any OCM repository with this command:

```shell
ocm get cv ghcr.io/mandelsoft/cnudie//github.com/mandelsoft/ocmhelmdemo
```

```shell
COMPONENT                         VERSION   PROVIDER
github.com/mandelsoft/ocmhelmdemo 0.1.0-dev mandelsoft
```

To refer to the content of a component repository, the component name can be appended to the repository specification separated by `//`.

In the example above, `ghcr.io/mandelsoft/cnudie` is the OCM repository, whereas `github.com/mandelsoft/ocmhelmdemo` is the component stored in this component repository.

Optionally, a specific version can be appended, separated by a colon (`:`). If no version is specified, all component versions will be displayed.

With the option `--recursive`, it is possible to show the complete component version, including the component versions it references.

```shell
ocm get cv ghcr.io/mandelsoft/cnudie//github.com/mandelsoft/ocmhelmdemo --recursive
```

```shell
REFERENCEPATH                               COMPONENT                              VERSION   PROVIDER   IDENTITY
                                            github.com/mandelsoft/ocmhelmdemo      0.1.0-dev mandelsoft
github.com/mandelsoft/ocmhelmdemo:0.1.0-dev github.com/mandelsoft/ocmhelminstaller 0.1.0-dev mandelsoft "name"="installer"
```

To get a tree view, add the option `-o tree`:

```shell
ocm get componentversion ghcr.io/mandelsoft/cnudie//github.com/mandelsoft/ocmhelmdemo --recursive -o tree
```

```shell
NESTING    COMPONENT                              VERSION   PROVIDER   IDENTITY
└─ ⊗       github.com/mandelsoft/ocmhelmdemo      0.1.0-dev mandelsoft
   └─      github.com/mandelsoft/ocmhelminstaller 0.1.0-dev mandelsoft "name"="installer"
```

### List the Resources of a Component Version

To list the resources found in a component version tree, the command [`ocm get resources`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_get_resources.md) can be used:

```shell
ocm get resources ghcr.io/mandelsoft/cnudie//github.com/mandelsoft/ocmhelmdemo:0.1.0-dev --recursive -o tree
```

```shell
COMPONENT                                    NAME        VERSION   IDENTITY TYPE        RELATION
└─ github.com/mandelsoft/ocmhelmdemo                     0.1.0-dev
   ├─                                        chart       0.1.0-dev          helmChart   local
   ├─                                        image       1.0                ociImage    external
   ├─                                        package     0.1.0-dev          toiPackage  local
   └─ github.com/mandelsoft/ocmhelminstaller installer   0.1.0-dev
      ├─                                     toiexecutor 0.1.0-dev          toiExecutor local
      └─                                     toiimage    0.1.0-dev          ociImage    local
```

### Download the Resources of a Component Version

Use the [`ocm download`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_download_resources.md) command to download resources such as component versions, individual resources or artifacts:

```shell
ocm download resource ghcr.io/jensh007//github.com/acme/helloworld:1.0.0 chart -O helmchart.tgz
```

```shell
helmchart.tgz: 4747 byte(s) written
```

Because it is stored as OCI artifact in an OCI registry, the filesystem format used for OCI artifacts is the blob format.

<details><summary>What happened?</summary>

The file `helmchart.tgz` was downloaded.

```shell
tar xvf helmchart.tgz
```

```shell
x index.json
x oci-layout
x blobs
x blobs/sha256.1c1af427d477202d102c141f27d3be0f5b6595e2948a82ec58987560c1915fea
x blobs/sha256.47eacca4cbed4b63c17e044d3c87a33d9bd1f88a9e76fa0ab051e48b0a3cd7ec
x blobs/sha256.ea8e5b44cd1aff1f3d9377d169ad795be20fbfcd58475a62341ed8fb74d4788c
```

```shell
$ jq . index.json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:47eacca4cbed4b63c17e044d3c87a33d9bd1f88a9e76fa0ab051e48b0a3cd7ec",
      "size": 410,
      "annotations": {
        "cloud.gardener.ocm/tags": "0.1.0",
        "org.opencontainers.image.ref.name": "0.1.0",
        "software.ocm/tags": "0.1.0"
      }
    }
  ],
  "annotations": {
    "cloud.gardener.ocm/main": "sha256:47eacca4cbed4b63c17e044d3c87a33d9bd1f88a9e76fa0ab051e48b0a3cd7ec",
    "software.ocm/main": "sha256:47eacca4cbed4b63c17e044d3c87a33d9bd1f88a9e76fa0ab051e48b0a3cd7ec"
  }
}

```

</details>

#### Download with Download Handlers

To use a format more suitable for the content technology, enable the usage
of download handlers.

If a download handler is available for the artifact type and the
blob media type used to store the blob in the OCM repository, it will convert the blob format
into a more suitable format:

```shell
ocm download resource -d ghcr.io/jensh007//github.com/acme/helloworld:1.0.0 chart -O helmchart.tgz
```

```shell
helmchart.tgz: 4747 byte(s) written
```

<details><summary>What happened?</summary>

The downloaded archive is now a regular Helm Chart archive:

```shell
tar tvf echoserver-0.1.0.tgz
```

```shell
-rw-r--r--  0 0      0         136 Nov 30 13:19 echoserver/Chart.yaml
-rw-r--r--  0 0      0        1842 Nov 30 13:19 echoserver/values.yaml
-rw-r--r--  0 0      0        1755 Nov 30 13:19 echoserver/templates/NOTES.txt
-rw-r--r--  0 0      0        1802 Nov 30 13:19 echoserver/templates/_helpers.tpl
-rw-r--r--  0 0      0        1848 Nov 30 13:19 echoserver/templates/deployment.yaml
-rw-r--r--  0 0      0         922 Nov 30 13:19 echoserver/templates/hpa.yaml
-rw-r--r--  0 0      0        2083 Nov 30 13:19 echoserver/templates/ingress.yaml
-rw-r--r--  0 0      0         367 Nov 30 13:19 echoserver/templates/service.yaml
-rw-r--r--  0 0      0         324 Nov 30 13:19 echoserver/templates/serviceaccount.yaml
-rw-r--r--  0 0      0         385 Nov 30 13:19 echoserver/templates/tests/test-connection.yaml
-rw-r--r--  0 0      0         349 Nov 30 13:19 echoserver/.helmignore
```

</details>

#### Download an Image

For example, for OCI images, the OCI format is more suitable:

```shell
ocm download resource ghcr.io/jensh007//github.com/acme/helloworld:1.0.0 image -O echoserver.tgz
```

```shell
echoserver.tgz: 46148828 byte(s) written
```

<details><summary>What happened?</summary>

The file `echoserver.tgz` was downloaded.

```shell
tar xvf echoserver.tgz
```

```shell
x index.json
x oci-layout
x blobs
x blobs/sha256.06679f57dba70a6875e4ae5843ba2483ecab6ec48182ca8720ddc5b1863bad52
x blobs/sha256.28c6282d04f63710146ace6c7be14a40c7ee6a71a2f91316928469e4aafe0d92
x blobs/sha256.2d3e25b9e93ad26878862abee5ed02683206f6f6d57e311cdd1dedf3662b61c8
x blobs/sha256.365ec60129c5426b4cf160257c06f6ad062c709e0576c8b3d9a5dcc488f5252d
x blobs/sha256.4b12f3ef8e65aaf1fd77201670deb98728a8925236d8f1f0473afa5abe9de119
x blobs/sha256.76d46396145f805d716dcd1607832e6a1257aa17c0c2646a2a4916e47059dd54
x blobs/sha256.7fd34bf149707ca78b3bb90e4ba68fe9a013465e5d03179fb8d3a3b1cac8be27
x blobs/sha256.b0e3c31807a2330c86f07d45a6d80923d947a8a66745a2fd68eb3994be879db6
x blobs/sha256.bc391bffe5907b0eaa04e96fd638784f77d39f1feb7fbe438a1dae0af2675205
x blobs/sha256.cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229
x blobs/sha256.d5157969118932d522396fe278eb722551751c7aa7473e6d3f03e821a74ee8ec
x blobs/sha256.e0962580d8254d0b1ef35006d7e2319eb4870e63dc1f9573d2406c7c47d442d2
```

```shell

jq . index.json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "manifests": [
    {
      "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
      "digest": "sha256:cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229",
      "size": 2400,
      "annotations": {
        "cloud.gardener.ocm/tags": "1.10",
        "org.opencontainers.image.ref.name": "1.10",
        "software.ocm/tags": "1.10"
      }
    }
  ],
  "annotations": {
    "cloud.gardener.ocm/main": "sha256:cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229",
    "software.ocm/main": "sha256:cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229"
  }
}
```

</details>

#### Download an Executable

The Open Component Model allows to publish platform-specific executables. In this case, the platform
specification is used by convention as extra identity for the artifacts that are contained in the component
version.

Example:

```shell
ocm get componentversion ghcr.io/open-component-model/ocm//ocm.software/ocmcli:0.1.0-dev -o yaml
```

```shell
...
    resources:
    - name: ocmcli
      extraIdentity:
        architecture: amd64
        os: linux
      relation: local
      type: executable
      version: 0.1.0-dev
      access:
        localReference: sha256:1a8827761f0aaa897d1d4330c845121c157e905d1ff300ba5488f8c423bc7cd9
        mediaType: application/octet-stream
        type: localBlob
    - name: ocmcli
      extraIdentity:
        architecture: arm64
        os: darwin
      relation: local
      type: executable
      version: 0.1.0-dev
      access:
        localReference: sha256:9976b18dc16ae2b2b3fc56686f18f4896d44859f1ea6221f70e83517f697e289
        mediaType: application/octet-stream
        type: localBlob
...
```

Note that the resources shown above have the same name and type `executable` but a different extra-identity. If a
component version complies to this convention, executables can directly be downloaded for the specified
platform with the use of the `-x` option. If only one executable is contained in the component version, the
resource name can be omitted. Example:

```shell
ocm download resource -x --latest ghcr.io/open-component-model/ocm//ocm.software/ocmcli
```

```shell
ocm: 52613730 byte(s) written
```

<details><summary>What happened?</summary>

```shell
ls -l
```

```shell
total 51M
-rwxr-xr-x  1 me staff  51M Nov 30 13:49 ocm
```

```shell
file ocm
```

```shell
ocm: Mach-O 64-bit executable arm64
```

With the option `--latest`, the latest matching component version is used for download. With the
option `--constraints`, version constraints can be configured. For example: `--constraints 0.1.x`
will select all patch versions of `0.1`. Together with `--latest`, the latest patch version is
selected.

The option `-x` enables the executable download handler, which provides the x-bit of the downloaded
files. Additionally, it filters all matching resources for executables and the correct platform.

</details>

#### Download a Full Component Version

Download entire component versions using the [`ocm download componentversion`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_download_componentversions.md) command:

```shell
ocm download componentversions ${OCM_REPO}//${COMPONENT}:${VERSION} -O helloworld
```

```shell
helloworld: downloaded
```

The result is a component archive. This can then be modified using the `ocm add ...` commands shown earlier.

<details><summary>What happened?</summary>

The component version was downloaded.

```shell
tree helloworld2
```

```shell
├── blobs
└── component-descriptor.yaml
```

The `blobs` directory is empty because, during the upload to the OCI registry, the local helmchart blob was transformed to a regular OCI artifact. The access method in the component descriptor has been modified to `ociArtifact`.

</details>

### Download OCI Artifacts

Download OCI artifacts from an OCI registry, such as OCI images, with the [`ocm download artifacts`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_download_artifacts.md) command:

```shell
ocm download artifact ${OCM_REPO}/${COMPONENT}:${VERSION} -O echoserver
```

```shell
echoserver: downloaded
```

<details><summary>What happened?</summary>

The OCI image `echoserver` was downloaded.

```shell
tree echoserver
```

```shell
echoserver
├── blobs
│   ├── sha256.1c1af427d477202d102c141f27d3be0f5b6595e2948a82ec58987560c1915fea
│   ├── sha256.47eacca4cbed4b63c17e044d3c87a33d9bd1f88a9e76fa0ab051e48b0a3cd7ec
│   └── sha256.ea8e5b44cd1aff1f3d9377d169ad795be20fbfcd58475a62341ed8fb74d4788c
├── index.json
└── oci-layout
```

</details>
