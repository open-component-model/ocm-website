---
title: "Create an OCM component for a simple application"
description: ""
lead: ""
date: 2024-03-19T10:36:48+01:00
lastmod: 2024-03-19T10:36:48+01:00
draft: false
images: []
weight: 64
toc: true
---

## Introduction

Let's build an OCM component for a simple application, containing a Helm Chart and an OCI Image.
We use the chart and image from Stefan Prodan's [podinfo](https://github.com/stefanprodan/podinfo) as example.

All steps can also be found in the Getting Started ["all-in-one"](../getting-started-with-ocm#all-in-one)
section.

### Requirements

* [OCM command line tool](https://github.com/open-component-model/ocm)

## Building the Application Component using OCM

We use the OCM CLI to build an OCM component which contains the Helm Chart and the Docker image.
As input we create a so-called component-constructor.yaml file, which describes the component.
The component-constructor.yaml file contains the metadata of the component and the resources it consists of.
The resources in our case are the Helm Chart and the Docker image.

### Input Specification

The corresponding `component-constructor.yaml` looks like:

```yaml
components:
- name: my-domain/podinfo
  version: 1.0.0
  provider:
    name: my-company
  resources:
  - name: podinfo-helm-chart
    type: helmChart
    version: 6.6.2
    access:
      type: helm
      helmChart: podinfo:6.6.2
      helmRepository: https://stefanprodan.github.io/podinfo
  - name: podinfo-image
    type: ociArtifact
    version: 6.6.2
    access:
      type: ociArtifact
      imageReference: ghcr.io/stefanprodan/podinfo:6.6.2
```

### Building the Common Transport Archive (CTF)

From the input file `component-constructor.yaml` we create a common transport archive (CTF) with the
OCM CLI. The CTF is a file system representation of the OCM component, which like described in.... is persisted in the OCI format.
A CTF acts a kind of container for all OCM components created locally and is then used later to transfer the components to an OCI registry.

```shell
ocm add componentversion --create --file <ctf-target-dir> component-constructor.yaml
```

```shell
ocm add componentversions --create --file my-ctf component-constructor.yaml
processing component-constructor.yaml...
  processing document 1...
    processing index 1
found 1 component
adding component ocm.software/podinfo:6.6.2...
  adding resource helmChart: "name"="podinfo-helm-chart","version"="6.6.2"...
  adding resource ociArtifact: "name"="podinfo-image","version"="6.6.2"...
```

You can view the generated component descriptor using the command:

```shell
ocm get component -o yaml <ctf-target-dir>
```

```shell
ocm get component ./ocm-hello-world
COMPONENT            VERSION PROVIDER
ocm.software/podinfo 6.6.0   stb1337
```

You can store the transport archive in an OCI registry (this step needs a proper
configuration of credentials for the OCM CLI):

```shell
ocm transfer ctf -f <ctf-target-dir> <oci-repo-url>
```

```shell
ocm transfer commontransportarchive --copy-resources --enforce --overwrite ./ocm-hello-world OCIRegistry::ghcr.io/stb1337/ocm-hello-world-v1
transferring component "ocm.software/podinfo"...
  transferring version "ocm.software/podinfo:6.6.0"...
INFO[0000] trying next host - response was http.StatusNotFound  host=ghcr.io
INFO[0001] trying next host - response was http.StatusNotFound  host=ghcr.io
  ...resource 0 helm-chart-external[helmChart]...
  ...resource 1 helm-chart-local-tgz[helmChart](ocm.software/podinfo/podinfo:6.6.0)...
  ...resource 2 helm-chart-local-folder[helmChart]...
  ...resource 3 image[ociImage](stefanprodan/podinfo:6.6.0)...
  ...adding component version...

```

Note: Be careful with the `-f` or `--overwrite` flag. This will replace existing component
versions in the OCI registry. During development it is useful being able to overwrite
existing component versions until something is ready for release. **For released versions
you should never use this flag**! Released component versions should be immutable and
should never be overwritten. They serve as source of truth for what the release is made of
und should never be changed.
