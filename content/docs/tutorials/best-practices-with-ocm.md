---
title: "Best Practices"
description: ""
lead: ""
draft: false
images: []
weight: 63
toc: true
---

This chapter contains guidelines for common scenarios how to work with the Open Component Model, focusing on using CI/CD, build and publishing processes.

- [Use Public Schema for Validation and Auto-Completion of Component Descriptors](#use-public-schema-for-validation-and-auto-completion-of-component-descriptors)
- [Separation Between Build and Publish Processes](#separation-between-build-and-publish-processes)
- [DockerMulti Input Type](#dockermulti-input-type)
- [Using Makefiles](#using-makefiles)
  - [Prerequisites](#prerequisites)
  - [Templating the Resources](#templating-the-resources)
- [Pipeline Integration](#pipeline-integration)
- [Static and Dynamic Variable Substitution](#static-and-dynamic-variable-substitution)
  - [Example](#example)
- [Debugging: Explain the Blobs Directory](#debugging-explain-the-blobs-directory)
- [Self-Contained Transport Archives](#self-contained-transport-archives)
- [CICD Integration](#cicd-integration)

## Use Public Schema for Validation and Auto-Completion of Component Descriptors

The Open Component Model (OCM) provides a public schema to validate and offer auto-completion of component constructor files
used to create component descriptors.
This schema is available at [https://ocm.software/schemas/configuration-schema.yaml](/schemas/configuration-schema.yaml).

To use this schema in your IDE, you can add the following line to your component constructor file:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
```

This line tells the YAML language server to use the OCM schema for validation and auto-completion.


## Separation Between Build and Publish Processes

Automated builds with unrestricted internet access introduce several critical challenges in enterprise environments:

- Limited control over downloaded artifacts
- Potential unavailability of required resources
- Security risks associated with write permissions to external repositories

These challenges stem from typical build processes that involve both downloading content (e.g., `go mod tidy`) and uploading build results to repositories (e.g., OCI image registries).

The first challenge of artifact control may be partially mitigated by subsequent scanning processes. However, the resource availability issue can be addressed by mirroring required artifacts locally, which also provides a target for various scanning tools.

The most severe concern is the security risk associated with repository write permissions. Build procedures and downloaded artifacts could potentially:

- Compromise registry credentials
- Corrupt repository contents
- Introduce unexpected security vulnerabilities

Mitigation involves establishing a clear contract between the build procedure and the build system. This approach separates concerns by:

- Generating build results as a local file or file structure
- Allowing the build system to handle repository interactions separately
- Preventing the build procedure from requiring direct write permissions to any repository

By decoupling the build and publish processes, organizations can:

- Improve security controls
- Provide more granular oversight of artifact generation
- Reduce the attack surface of build infrastructure

To enhance process integrity, a *certified build system* can cryptographically sign build artifacts using a trusted build system certificate, enabling downstream verification that component versions originate from authorized and validated build processes.

## DockerMulti Input Type

The `dockermulti` input type enables on-the-fly composition of multi-architecture images from the local Docker daemon. Unlike the standard `docker` input type, `dockermulti` allows:

- Listing multiple images created for different OS platforms
- Generating an OCI index manifest to describe the multi-arch image
- Packaging the complete set of image blobs as a single artifact set archive
- Adding the multi-arch image as a single resource to the component version

Key differences from the standard `docker` input type:

- Supports multiple platform-specific images in a single operation
- Creates a comprehensive OCI index manifest
- Simplifies the process of bundling multi-arch images into a component version

Example workflow:

1. Build platform-specific images using Docker and buildx
2. Use `dockermulti` to collect and package these images
3. Create a component version with the multi-arch image as a single resource

The resulting component descriptor of the component version in the CTF archive is:

```shell
$ ocm get cv ctf//github.com/acme/simpleserver:0.1.0 -o yaml
---
component:
  componentReferences: []
  creationTime: "2024-12-20T15:05:53Z"
  name: github.com/acme/simpleserver
  provider: acme
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256:0bdc2c06017a5906534163e965f1fe2594fbb3d524eb3425e5636f4c8fa6d256
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/simpleserver/hello-world:0.1.0
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 6bccb4d53f03bf6980785b0b2ae80369f768461bf50183fcd194d50ba5edce54
    name: chart
    relation: local
    type: helmChart
    version: 0.1.0
  - access:
      localReference: sha256:345815e6bda8bc0688fecae102250a170974739761ad18763276b92481522dc6
      mediaType: application/vnd.oci.image.index.v1+tar+gzip
      referenceName: github.com/acme/simpleserver/eu.gcr.io/acme/simpleserver:0.1.0
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: e140bef7c38a505a5f5f76437a6948fe1b98ea6efde654d803b6cbf2019861a3
    name: image
    relation: local
    type: ociImage
    version: 0.1.0
  sources: []
  version: 0.1.0
meta:
  schemaVersion: v2
```

Note that there is only one resource of type `image` with media-type `application/vnd.oci.image.index.v1+tar+gzip`
which is the standard media type for multi-arch images.

```shell
$ ls -l ctf/blobs
total 3048
-rw-r----- 1 D032990    3313 Dez 20 16:05 sha256.0bdc2c06017a5906534163e965f1fe2594fbb3d524eb3425e5636f4c8fa6d256
-rw-r----- 1 D032990 3103600 Dez 20 16:05 sha256.345815e6bda8bc0688fecae102250a170974739761ad18763276b92481522dc6
-rw-r----- 1 D032990     201 Dez 20 16:05 sha256.4d685a2e53c4255452a44b47fea4bc94f859af740e102817db8925865093aac4
-rw-r----- 1 D032990    1085 Dez 20 16:05 sha256.b5168610761d5f95281b8eb90e67afe1ceedb602f65e8e2b9f9171d9997ef459
-rw-r----- 1 D032990    3072 Dez 20 16:05 sha256.c1a1dd0a12b2188627af22e83e5719f4895ab24a2fbd3740573c45aa9bffc604
```

The file sha256.c1a1... contains the component-descriptor.yaml, the serialized form of a component version
(the same result you would get using `ocm get ctf//github.com/acme/simpleserver:0.1.0 -o yaml`):

```shell
$ tar xvf ctf/blobs/sha256.c1a1dd0a12b2188627af22e83e5719f4895ab24a2fbd3740573c45aa9bffc604
component-descriptor.yaml

$ tar xvf ctf/blobs/sha256.c1a1dd0a12b2188627af22e83e5719f4895ab24a2fbd3740573c45aa9bffc604 -O component-descriptor.yaml
component-descriptor.yaml
component:
  componentReferences: []
  creationTime: "2024-12-20T15:05:53Z"
  name: github.com/acme/simpleserver
  provider: acme
  repositoryContexts: []
  resources:
  - access:
      localReference: sha256:0bdc2c06017a5906534163e965f1fe2594fbb3d524eb3425e5636f4c8fa6d256
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/simpleserver/hello-world:0.1.0
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 6bccb4d53f03bf6980785b0b2ae80369f768461bf50183fcd194d50ba5edce54
    name: chart
    relation: local
    type: helmChart
    version: 0.1.0
  - access:
      localReference: sha256:345815e6bda8bc0688fecae102250a170974739761ad18763276b92481522dc6
      mediaType: application/vnd.oci.image.index.v1+tar+gzip
      referenceName: github.com/acme/simpleserver/eu.gcr.io/acme/simpleserver:0.1.0
      type: localBlob
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: e140bef7c38a505a5f5f76437a6948fe1b98ea6efde654d803b6cbf2019861a3
    name: image
    relation: local
    type: ociImage
    version: 0.1.0
  sources: []
  version: 0.1.0
meta:
  schemaVersion: v2
```

The file sha256.4e26... contains the multi-arch image packaged as *OCI artifact set*:

```shell
$ tar tvf gen/ca/blobs/sha256.4e26c7dd46e13c9b1672e4b28a138bdcb086e9b9857b96c21e12839827b48c0c
-rw-r--r--  0 0      0         741 Jan  1  2022 index.json
-rw-r--r--  0 0      0          38 Jan  1  2022 oci-layout
drwxr-xr-x  0 0      0           0 Jan  1  2022 blobs
-rw-r--r--  0 0      0     3051520 Jan  1  2022 blobs/sha256.05ef21d763159987b9ec5cfb3377a61c677809552dcac3301c0bde4e9fd41bbb
-rw-r--r--  0 0      0         723 Jan  1  2022 blobs/sha256.117f12f0012875471168250f265af9872d7de23e19f0d4ef05fbe99a1c9a6eb3
-rw-r--r--  0 0      0     6264832 Jan  1  2022 blobs/sha256.1496e46acd50a8a67ce65bac7e7287440071ad8d69caa80bcf144892331a95d3
-rw-r--r--  0 0      0     6507520 Jan  1  2022 blobs/sha256.66817c8096ad97c6039297dc984ebc17c5ac9325200bfa9ddb555821912adbe4
-rw-r--r--  0 0      0         491 Jan  1  2022 blobs/sha256.75a096351fe96e8be1847a8321bd66535769c16b2cf47ac03191338323349355
-rw-r--r--  0 0      0     3051520 Jan  1  2022 blobs/sha256.77192cf194ddc77d69087b86b763c47c7f2b0f215d0e4bf4752565cae5ce728d
-rw-r--r--  0 0      0        1138 Jan  1  2022 blobs/sha256.91018e67a671bbbd7ab875c71ca6917484ce76cde6a656351187c0e0e19fe139
-rw-r--r--  0 0      0    17807360 Jan  1  2022 blobs/sha256.91f7bcfdfda81b6c6e51b8e1da58b48759351fa4fae9e6841dd6031528f63b4a
-rw-r--r--  0 0      0        1138 Jan  1  2022 blobs/sha256.992b3b72df9922293c05f156f0e460a220bf601fa46158269ce6b7d61714a084
-rw-r--r--  0 0      0    14755840 Jan  1  2022 blobs/sha256.a83c9b56bbe0f6c26c4b1d86e6de3a4862755d208c9dfae764f64b210eafa58c
-rw-r--r--  0 0      0         723 Jan  1  2022 blobs/sha256.e624040295fb78a81f4b4b08b43b4de419f31f21074007df8feafc10dfb654e6

$ tar xvf ctf/blobs/sha256.345815e6bda8bc0688fecae102250a170974739761ad18763276b92481522dc6 -O index.json | jq .
index.json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.index.v1+json",
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:4a6732e78b2392fc101b7eb268a61b100e1b67f213b07e0d383903dc4b776d02",
      "size": 2206
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:11b507758759da7a3b1ee1daf8679c126422e9c92ab2d3dbeae43edf2efedfe5",
      "size": 2206
    },
    {
      "mediaType": "application/vnd.oci.image.index.v1+json",
      "digest": "sha256:e140bef7c38a505a5f5f76437a6948fe1b98ea6efde654d803b6cbf2019861a3",
      "size": 579,
      "annotations": {
        "org.opencontainers.image.ref.name": "0.1.0",
        "software.ocm/tags": "0.1.0"
      }
    }
  ],
  "annotations": {
    "software.ocm/main": "sha256:e140bef7c38a505a5f5f76437a6948fe1b98ea6efde654d803b6cbf2019861a3"
  }
}
```

</details>

Now you can push the component version located inside the CTF archive to an OCM repository.
Replace the `OCM_REPO` with a target OCM repository you have write access to and which you configured
in the [.ocmconfig file](https://ocm.software/docs/examples/credentials-in-an-.ocmconfig-file/)
to enable the OCM CLI to access the repository.

```shell
$ OCMREPO=...
$ ocm transfer ctf ./ctf $OCM_REPO
transferring component "github.com/acme/simpleserver"...
  transferring version "github.com/acme/simpleserver:0.1.0"...
  ...resource 0 chart[helmChart](github.com/acme/simpleserver/hello-world:0.1.0)...
  ...resource 1 image[ociImage](github.com/acme/simpleserver/eu.gcr.io/acme/simpleserver:0.1.0)...
  ...adding component version...
```

The repository should contain three additional artifacts. Depending on the OCI registry and
the corresponding UI you may see that the uploaded OCI image is a multi-arch-image. For example on
GitHub packages under the attribute `OS/Arch` you can see two platforms, `linux/amd64` and
`linux/arm64`

For automation and reuse purposes you may consider templating resource files and Makefiles (see below).

## Using Makefiles

Developing applications and services using the Open Component Model usually is an iterative process
of building artifacts, generating OCM component versions and finally publishing them.
To simplify this process it should be automated and integrated into your build process.
One option is to use a `Makefile`.

The following example can be used as a starting point and can be modified according to your needs.
In this example we will use the same example as in the sections before:

- Creating a multi-arch image from Go sources from a Git repository using the Docker CLI
- Packaging the Docker image and a Helm chart into a CTF archive
- Signing and publishing the build result

### Prerequisites

- The OCM CLI must be installed and be available in your PATH
- The Makefile is located in the top-level folder of a Git project
- Operating system is Unix/Linux
- A sub-directory `local` can be used for local settings e.g. environment varibles, RSA keys, ...
- A sub-directory `gen` will be used for generated artifacts from the `make build` command
- It is recommended to add `local/` and `gen/` to the `.gitignore` file

We use the following file system layout for the example:

```shell
$ tree .
.
├── Dockerfile
├── LICENSE
├── Makefile
├── README.md
├── go.mod
├── helmchart
│   ├── Chart.yaml
│   ├── templates
│   │   ├── NOTES.txt
│   │   ├── _helpers.tpl
│   │   ├── deployment.yaml
│   │   ├── hpa.yaml
│   │   ├── ingress.yaml
│   │   ├── service.yaml
│   │   ├── serviceaccount.yaml
│   │   └── tests
│   │       └── test-connection.yaml
│   └── values.yaml
├── local
│   └── env.sh
├── main.go
├── resources.yaml
└── VERSION
```

<details><summary>Makefile to be used</summary>

```Makefile
NAME      ?= simpleserver
PROVIDER  ?= acme.org
GITHUBORG ?= acme
IMAGE     = ghcr.io/$(GITHUBORG)/demo/$(NAME)
COMPONENT = $(PROVIDER)/demo/$(NAME)
OCMREPO   ?= ghcr.io/$(GITHUBORG)/ocm
MULTI     ?= true
PLATFORMS ?= linux/amd64 linux/arm64
REPO_ROOT           = .
VERSION             = $(shell git describe --tags --exact-match 2>/dev/null|| echo "$$(cat $(REPO_ROOT)/VERSION)")
COMMIT              = $(shell git rev-parse HEAD)
EFFECTIVE_VERSION   = $(VERSION)-$(COMMIT)
GIT_TREE_STATE      := $(shell [ -z "$(git status --porcelain 2>/dev/null)" ] && echo clean || echo dirty)
GEN = ./gen
OCM = ocm

CHART_SRCS=$(shell find helmchart -type f)
GO_SRCS=$(shell find . -name \*.go -type f)

ifeq ($(MULTI),true)
FLAGSUF     = .multi
endif

.PHONY: build
build: $(GEN)/build

.PHONY: version
version:
	@echo $(VERSION)

.PHONY: ca
ca: $(GEN)/ca

$(GEN)/ca: $(GEN)/.exists $(GEN)/image.$(NAME)$(FLAGSUF) resources.yaml $(CHART_SRCS)
	$(OCM) create ca -f $(COMPONENT) "$(VERSION)" --provider $(PROVIDER) --file $(GEN)/ca
	$(OCM) add resources --templater spiff $(GEN)/ca COMMIT="$(COMMIT)" VERSION="$(VERSION)" \
		IMAGE="$(IMAGE):$(VERSION)" PLATFORMS="$(PLATFORMS)" MULTI=$(MULTI) resources.yaml
	@touch $(GEN)/ca

$(GEN)/build: $(GO_SRCS)
	go build .
	@touch $(GEN)/build

.PHONY: image
image: $(GEN)/image.$(NAME)

$(GEN)/image.$(NAME): $(GEN)/.exists Dockerfile $(OCMSRCS)
	docker build -t $(IMAGE):$(VERSION) --file Dockerfile $(COMPONENT_ROOT) .;
	@touch $(GEN)/image.$(NAME)

.PHONY: multi
multi: $(GEN)/image.$(NAME).multi

$(GEN)/image.$(NAME).multi: $(GEN)/.exists Dockerfile $(GO_SRCS)
	echo "Building Multi $(PLATFORMS)"
	for i in $(PLATFORMS); do \
	tag=$$(echo $$i | sed -e s:/:-:g); \
	echo "Building platform $$i with tag: $$tag"; \
	docker buildx build --load -t $(IMAGE):$(VERSION)-$$tag --platform $$i .; \
	done
	@touch $(GEN)/image.$(NAME).multi

.PHONY: ctf
ctf: $(GEN)/ctf

$(GEN)/ctf: $(GEN)/ca
	@rm -rf $(GEN)/ctf
	$(OCM) transfer ca $(GEN)/ca $(GEN)/ctf
	touch $(GEN)/ctf

.PHONY: push
push: $(GEN)/ctf $(GEN)/push.$(NAME)

$(GEN)/push.$(NAME): $(GEN)/ctf
	$(OCM) transfer ctf -f $(GEN)/ctf $(OCMREPO)
	@touch $(GEN)/push.$(NAME)

.PHONY: transport
transport:
ifneq ($(TARGETREPO),)
	$(OCM) transfer component -Vc  $(OCMREPO)//$(COMPONENT):$(VERSION) $(TARGETREPO)
else
	@echo "Cannot transport no TARGETREPO defined as destination" && exit 1
endif

$(GEN)/.exists:
	@mkdir -p $(GEN)
	@touch $@

.PHONY: info
info:
	@echo "VERSION:  $(VERSION)"
	@echo "COMMIT:   $(COMMIT)"
	@echo "TREESTATE:   $(GIT_TREE_STATE)"

.PHONY: describe
describe: $(GEN)/ctf
	ocm get resources --lookup $(OCMREPO) -r -o treewide $(GEN)/ctf

.PHONY: descriptor
descriptor: $(GEN)/ctf
	ocm get component -S v3alpha1 -o yaml $(GEN)/ctf

.PHONY: clean
clean:
	rm -rf $(GEN)
```

</details>

The Makefile supports the following targets:

- `build` (default) simple Go build
- `version` show current VERSION of Github repository
- `image` build a local Docker image
- `multi` build multi-arch images with Docker's buildx command
- `ca` execute build and create a component archive
- `ctf` create a common transport format archive
- `push` push the common transport archive to an OCI registry
- `info` show variables used in Makefile (version, commit, etc.)
- `describe` display the component version in a tree-form
- `descriptor` show the component descriptor of the component version
- `transport` transport the component from the upload repository into another OCM repository
- `clean` delete all generated files (but does not delete Docker images)

The variables assigned with `?=` at the beginning can be set from outside and override the default
declared in the Makefile. Use either an environment variable or an argument when calling `make`.

Example:

```shell
PROVIDER=foo make ca
```

### Templating the Resources

The Makefile uses a dynamic list of generated platforms for the images. You can just set the `PLATFORMS` variable:

```Makefile
MULTI     ?= true
PLATFORMS ?= linux/amd64 linux/arm64
```

If `MULTI` is set to `true`, the variable `PLATFORMS` will be evaluated to decide which image variants
will be built. This has to be reflected in the `resources.yaml`. It has to use the input type
`dockermulti` and list all the variants which should be packaged into a multi-arch image. This list
depends on the content of the Make variable.

The OCM CLI supports this by enabling templating mechanisms for the content by selecting a templater
using the option `--templater ...`. The example uses the [Spiff templater](https://github.com/mandelsoft/spiff).

```Makefile
$(GEN)/ca: $(GEN)/.exists $(GEN)/image.$(NAME)$(FLAGSUF) resources.yaml $(CHART_SRCS)
	$(OCM) create ca -f $(COMPONENT) "$(VERSION)" --provider $(PROVIDER) --file $(GEN)/ca
	$(OCM) add resources --templater spiff $(GEN)/ca COMMIT="$(COMMIT)" VERSION="$(VERSION)" \
		IMAGE="$(IMAGE):$(VERSION)" PLATFORMS="$(PLATFORMS)" MULTI=$(MULTI) resources.yaml
	@touch $(GEN)/ca
```

The variables given to the `add resources` command are passed to the templater. The template looks
like:

```yaml
name: image
type: ociImage
version: (( values.VERSION ))
input:
  type: (( bool(values.MULTI) ? "dockermulti" :"docker" ))
  repository:  (( index(values.IMAGE, ":") >= 0 ? substr(values.IMAGE,0,index(values.IMAGE,":")) :values.IMAGE ))
  variants: (( bool(values.MULTI) ? map[split(" ", values.PLATFORMS)|v|-> values.IMAGE "-" replace(v,"/","-")] :~~ ))
  path: (( bool(values.MULTI) ? ~~ :values.IMAGE ))
```

By using a variable `values.MULTI`, the command distinguishes between a single Docker image and a multi-arch image.
With `map[]`, the platform list from the Makefile is mapped to a list of tags created by the
`docker buildx` command used in the Makefile. The value `~~` is used to undefine the yaml fields not
required for the selected case (the template can be used for multi- and single-arch builds).

```Makefile
$(GEN)/image.$(NAME).multi: $(GEN)/.exists Dockerfile $(GO_SRCS)
	echo "Building Multi $(PLATFORMS)"
	for i in $(PLATFORMS); do \
	tag=$$(echo $$i | sed -e s:/:-:g); \
	echo "Building platform $$i with tag: $$tag"; \
	docker buildx build --load -t $(IMAGE):$(VERSION)-$$tag --platform $$i .; \
	done
	@touch $(GEN)/image.$(NAME).multi
```

## Pipeline Integration

Pipeline infrastructures are heterogenous, so there is no universal answer how to
integrate a build pipeline with OCM. Usually, the simplest way is using the OCM command line interface.
Following you will find an example using GitHub actions.

There are two repositories dealing with GitHub actions:
The [first one](https://github.com/open-component-model/ocm-action) provides various actions that can be
called from a workflow. The [second one](https://github.com/open-component-model/ocm-setup-action)
provides the required installation of the OCM CLI into the container.

An typical workflow for a build step will create a component version and a transport archive:

```yaml
jobs:
  create-ocm:
    runs-on: ubuntu-latest
    steps:
      ...
      - name: setup OCM
        uses: open-component-model/ocm-setup-action@main
      ...
      - name: create OCM component version
        uses: open-component-model/ocm-action@main
        with:
          action: create_component
          component: acme.org/demo/simpleserver
          provider: ${{ env.PROVIDER }}
          version: github.com/jensh007
      ...
```

This creates a component version for the current build. Additionally, a CTF archive
can be created or the component version along with the built container images can be uploaded to an
OCI registry, etc.

More documentation is available [here](https://github.com/open-component-model/ocm-action). A full
example can be found in the sample Github repository.

## Static and Dynamic Variable Substitution

Looking at the [settings file](/docs/tutorials/build-deploy-infrastructure-via-helm-charts-with-ocm/#building-the-common-transport-archive-ctf) shows that
some variables like the `version` or the `commit` change with every build
or release. In many cases, these variables will be auto-generated during the build.

Other variables like the version of 3rd-party components will just change from time to
time and are often set manually by an engineer or release manager. It is useful to separate
between static and dynamic variables. Static files can be checked-in into the source control system and
are maintained manually. Dynamic variables can be generated during the build.

### Example

The following example shows how to separate static and dynamic variables.

Static settings, manually maintained:

```yaml
NAME: microblog
COMPONENT_NAME_PREFIX: github.com/acme.org/microblog
PROVIDER: ocm.software
ELASTIC_VERSION: 8.5.1
MARIADB_VERSION: 10.6.11
MARIADB_CHART_VERSION: 11.4.2
NGINX_VERSION: 1.5.1
NGINX_CHART_VERSION: 4.4.2
```

auto-generated from a build script:

```yaml
VERSION: 0.23.1
COMMIT: 5f03021059c7dbe760ac820a014a8a84166ef8b4
```

```shell
ocm add componentversions --create --file ../gen/ctf --settings ../gen/dynamic_settings.yaml --settings static_settings.yaml component-constructor.yaml
```

## Debugging: Explain the Blobs Directory

For analyzing and debugging the content of a CTF archive, there are some supportive commands
to analyze what is contained in the archive and what is stored in which blob:

```shell
tree ../gen/ctf
../gen/ctf
├── artifact-index.json
└── blobs
    ├── ...
    ├── sha256.59ff88331c53a2a94cdd98df58bc6952f056e4b2efc8120095fbc0a870eb0b67
    ├── ...
```

```shell
ocm get resources -r -o wide ../gen/ctf
...
---
REFERENCEPATH: github.com/acme.org/microblog/nginx-controller:1.5.1
NAME         : nginx-controller-chart
VERSION      : 1.5.1
IDENTITY     :
TYPE         : helmChart
RELATION     : local
ACCESSTYPE   : localBlob
ACCESSSPEC   : {"localReference":"sha256:59ff88331c53a2a94cdd98df58bc6952f056e4b2efc8120095fbc0a870eb0b67","mediaType":"application/vnd.oci.image.manifest.v1+tar+gzip","referenceName":"github.com/acme.org/microblog/nginx-controller/ingress-nginx:4.4.2"}
...
```

## Self-Contained Transport Archives

The transport archive created from a component constructor file, using the command `ocm add  componentversions --create ...`, does not automatically resolve image references to external OCI registries and stores them in the archive. If you want to create a self-contained transport archive with all images stored as local artifacts, you need to use the `--copy-resources` option in the `ocm transfer ctf` command. This will copy all external images to the blobs directory of the archive.

```shell
ocm transfer ctf --copy-resources <ctf-dir> <new-ctf-dir-or-oci-repo-url>
```

Note that this archive can become huge, depending on the size of the external images !

## CICD Integration

Configure rarely changing variables in a static file and generate dynamic variables
during the build from the environment. See the [Static and Dynamic Variable Substitution](#static-and-dynamic-variable-substitution) section above.
