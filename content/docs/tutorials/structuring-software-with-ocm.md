---
title: "Structuring Software Products with OCM"
description: ""
lead: ""
date: 2022-08-12T10:36:48+01:00
lastmod: 2022-08-12T10:36:48+01:00
draft: false
images: []
weight: 69
toc: true
---

- [Introduction](#introduction)
- [Example](#example)
  - [Helm Charts](#helm-charts)
  - [Input Specification](#input-specification)
  - [Building the Common Transport Archive](#building-the-common-transport-archive)
- [Deploying Software](#deploying-software)
  - [Localization](#localization)
  - [Example](#example-1)
- [Updating Components](#updating-components)

## Introduction

In this specification software products are comprised of logical units called
[**components**](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#components-and-component-versions). A component version
consists of a set of technical [artifacts](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/01-artifact-types/README.md),
e.g. Docker images, Helm charts, binaries, configuration data etc.
Such artifacts are called **resources** in this specification. Resources are usually built
from something, e.g. code in a git repo. Those are named **sources** in this specification.

OCM introduces a **Component Descriptor** for every component version, that
describes the resources, sources and other component versions belonging to a particular
component version and how to access them.

Usually however real-life applications are composed of multiple components. For
example an application might consist of a frontend, a backend, a database and a web server.
During the software development process new
[**component versions**](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#components-and-component-versions)
are created and third-party components might be consumed from a public registry and
updated from time to time.

Not all component version combinations of frontend, backend, database etc.are
compatible and form a valid product version. In order to define reasonable
version combinations for the software product, we could use another feature of
the *Component Descriptor*, called component reference (or reference in short) which allows
the aggregation of component versions.

For each component and each version in use there is a *Component Descriptor*. For the
entire application we introduce a new component that describes the overall software
product referencing all components. This describes the entire application.

A particular version of this application is again described by a *Component Descriptor*,
which contains references to *Component Descriptors* of its components in their version in
use. You are not restricted to this approach. It is e.g. possible to create multi-level
hierarchies or you could just maintain a list of component version combinations which build
a valid product release.

In a nutshell OCM provides a simple approach to specify what belongs to a product version.
Starting with the *Component Descriptor* for a product version and following the component
references, you could collect all artifacts, belonging to this product version.

## Example

Let's illustrate this idea by an example. As base we use the 'microblog' application. This
application was created for a programming tutorial and is documented in detail
[here](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world).
The source code can be found [here](https://github.com/miguelgrinberg/microblog/).

At the end of the tutorial this application consists of the following components:

* Microblog application written in Python
* A database MySQL or MariaDB
* A full-text search engine elasticsearch
* Redis to support task queues for background processing
* For a Kubernetes deployment and nginx ingress controller is needed in addition.

![Example Application Architecture](/images/example-app.png)

Following the guideline above we will end-up with six component versions: Five are created
for the components in this list. And one component is created describing the application
deployment and referencing all the sub-components. Looking closer at the components we can encounter three different flavors:

* The deployment component describing a product release and referencing all used components
* The main application component consisting of source code and  to a container image.
* Third party components consumed as binaries located in a public repository.

For building composed components the ["All-in-one"](https://github.com/open-component-model/ocm-website/blob/main/content/docs/getting-started/getting-started-with-ocm/create-component-version.md#all-in-one)
mechanism becomes handy.

### Helm Charts

Kubernetes deployments often use helm charts. The OCM specification supports helm charts as
an artifact type. For the microblog application we will create out own helm chart. For the
third-party components we will use readily available helm charts from public helm chart
repostories.

The OCM CLI supports referencing helm charts being stored in an OCI registry. However most
publicly available helm charts currently are available from helm chart repositories and
not from OCI registries. Therefore the helm charts are embedded in the component archive.
This can easily be achieved with the helm CLI:

```
helm repo add <repo-name> <helm-chart-repo-url>
helm pull --destination <target-dir> <repo-name/chart-name>
```

Example:
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm pull --destination . bitnami/mariadb
```
The helm chart for mariadb is then stored in the current working directory as `mariadb:11.4.5.tgz` and can be referenced as path from there in the `component-constructor.yaml` file (see below).

The helm chart for the microblog application is our own and part of the source code. It is
not downloaded from a public repository.


### Input Specification

The corresponding input file for building the component version (`component-constructor.yaml`) will then look like this:

```yaml
components:
# Deployable component: microblog-deployment
# - contains application and references all runtime dependencies
# - used as root component to deploy the complete application
# - version numbering scheme follows the main application
- name: ${COMPONENT_NAME_PREFIX}/microblog-deployment
  version: ${VERSION}
  provider:
    name: ${PROVIDER}
  componentReferences:
  - name: microblog
    componentName: ocm.software/microblog/microblog
    version: ${VERSION}
  - name: nginx-controller
    componentName: ocm.software/microblog/nginx-controller
    version: ${NGINX_VERSION}
  - name: mariadb
    componentName: ocm.software/microblog/mariadb
    version: ${MARIADB_VERSION}
  - name: elasticsearch
    componentName: ocm.software/microblog/elasticsearch
    version: ${ELASTIC_VERSION}
#
# Main application component: microblog
# - has a source repository and compiles its own images
- name: ${COMPONENT_NAME_PREFIX}/microblog
  version: ${VERSION}
  provider:
    name: ${PROVIDER}
  sources:
  - name: source
    type: filesytem
    access:
      type: github
      repoUrl: github.com/acme.org^/microblog
      commit: ${COMMIT}
    version: ${VERSION}
  resources:
  - name: microblog-chart
    type: helmChart
    input:
      type: helm
      path: ../microblog-helmchart
  - name: microblog-image
    type: ociImage
    version: ${VERSION}
    input:
      type: dockermulti
      repository: microblog
      variants:
      - microblog:${VERSION}-linux-amd64
      - microblog:${VERSION}-linux-arm64
#
# Nginx-Controller Component
# - runtime dependency, use pre-built images, embeds helm chart
- name: ${COMPONENT_NAME_PREFIX}/nginx-controller
  version: ${NGINX_VERSION}
  provider:
    name: ${PROVIDER}
  resources:
  - name: nginx-controller-chart
    type: helmChart
    input:
      type: helm
      path: nginx/ingress-nginx-${NGINX_CHART_VERSION}.tgz
  - name: nginx-controller-image
    type: ociImage
    version: ${NGINX_VERSION}
    access:
      type: ociArtifact
      imageReference: registry.k8s.io/ingress-nginx/controller:v${NGINX_VERSION}
#
# Maria-DB Component
# - runtime dependency, use pre-built images, embeds helm chart
- name: ${COMPONENT_NAME_PREFIX}/mariadb
  version: ${MARIADB_VERSION}
  provider:
    name: ${PROVIDER}
  resources:
  - name: mariadb-chart
    type: helmChart
    input:
      type: helm
      path: mariadb/mariadb-${MARIADB_CHART_VERSION}.tgz
  - name: mariadb-image
    type: ociImage
    version: ${MARIADB_VERSION}
    access:
      type: ociArtifact
      imageReference: bitnami/mariadb:${MARIADB_VERSION}-debian-11-r12
#
# Elasticsearch Component:
# - runtime dependency, use pre-built images, embeds helm chart
- name: ${COMPONENT_NAME_PREFIX}/elasticsearch
  version: ${ELASTIC_VERSION}
  provider:
    name: ${PROVIDER}
  resources:
  - name: elasticsearch-chart
    type: helmChart
    input:
      type: helm
      path: elastic/elasticsearch-${ELASTIC_VERSION}.tgz
  - name: elasticsearch-image
    type: ociImage
    version: ${ELASTIC_VERSION}
    access:
      type: ociArtifact
      imageReference: docker.elastic.co/elasticsearch/elasticsearch:${ELASTIC_VERSION}

```

Some frequently changing parameters have been extracted as variables. The OCM CLI uses
templating to fill them with values. The templating mechanism is described
[here](https://github.com/open-component-model/ocm-website/blob/main/content/docs/tutorials/best-practices-with-ocm.md#templating-the-resources). For this example
we use the simple (default) template engine type `subst`.

Note the differences between the various components:

* The microblog-deployment is the root and contains only references to other components
* The microblog application is the main application, built from sources. It has `sources`.
* The microblog application consists of an image and a helm chart. The image is built in
  previous build step (not described here) and taken from the local docker registry. The
  two images for different architectures are converted to a multi-arch image.
* All other components are third-party components and referenced from public registries.

### Building the Common Transport Archive

From the input file `component-constructor.yaml` the common transport archive can be created with the
OCM CLI. For all variables we need to provide values. Variable values can be passed in the
command line or stored in a file. For many variable having a values file is more convenient.
The corresponding file `settings.yaml` may look like this:

```yaml
VERSION: 0.23.1
COMMIT: 5f03021059c7dbe760ac820a014a8a84166ef8b4
NAME: microblog
COMPONENT_NAME_PREFIX: github.com/acme.org/microblog
PROVIDER: acme.org
ELASTIC_VERSION: 8.5.1
MARIADB_VERSION: 10.6.11
MARIADB_CHART_VERSION: 11.4.2
NGINX_VERSION: 1.5.1
NGINX_CHART_VERSION: 4.4.2
```

Create the transport archive then with:

```shell
ocm add componentversions --create --file <ctf-target-dir> --settings settings.yaml component-constructor.yaml
```

You can view the generated component descriptor using the command:

```shell
ocm get component -o yaml <ctf-target-dir>
```

You can store the transport archive in an OCI registry (this step needs a proper
configuration of credentials for the OCM CLI):

```shell
ocm transfer ctf -f <ctf-target-dir> <oci-repo-url>
```

{{<callout context="danger" title="-f replaces existing component">}}Be careful with the `-f` or `--overwrite` flag. This will replace existing component
versions in the OCI registry. During development it is useful being able to overwrite
existing component versions until something is ready for release. **For released versions
you should never use this flag**! Released component versions should be immutable and
should never be overwritten. They serve as source of truth for what the release is made of
und should never be changed.{{</callout>}}

## Deploying Software

Up to now we have created a transport archive containig all required parts (images, helm charts) for
installing the application. This archive is self-contained and can be transferred with a single
command from the OCM tooling. After pushing this archive to an OCI-registry we have a shared location
that can be used as a source of deployment without any external references. As an alternative you can
transport the archive using offline mechanisms (file transfer, USB-stick) and push it on a target
location to an OCI registry.

To actually deploy the application we need to get access to the helm charts contained in the archive.
We can use the ocm CLI to retrieve their location. See the [example](#example-1) below.

### Localization

The deployments in a Kubernetes cluster require an image for instantiating a container. With each
transport of the archive the image location changes. The image location can be set as a helm value
for a helm based installation. The actual value for the current deployment has to be extracted from
the component-descriptor and inserted into a helm values file for a helm based installation. In the
example below we will do the necessary steps. For real deplyoments you will usually use tools to
automate this. The [toi installation toolkit](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_toi-bootstrapping.md)
is one tool supporting this. The [Flux OCM controllers](https://github.com/open-component-model/ocm-website/blob/main/content/docs/controller/overview.md)
offer this functionality too.

### Example
Let's assume that we have pushed the transport archive to an OCI registry. We need the identity of the
component version and the location of the component-descriptors in the OCI registry:

ComponentVersion:
name: `github.com/jensh007/microblog-deployment`
version: `0.23.1`

URL of OCI registry: `ghcr.io/acme.org/microblogapp`

It is convenient to put this into an environment variable:

```yaml
OCM_REPO=github.com/acme.org/microblog
```

Getting all component-versions of the application with the ocm cli:

```yaml
ocm get component ${OCM_REPO}//github.com/jensh007/microblog-deployment:0.23.1 -o yaml

---
context: []
element:
  component:
    componentReferences:
    - componentName: github.com/jensh007/microblog
      name: microblog
      version: 0.23.1
    - componentName: github.com/jensh007/nginx-controller
      name: nginx-controller
      version: 1.5.1
    - componentName: github.com/jensh007/mariadb
      name: mariadb
      version: 10.11.2
    - componentName: github.com/jensh007/elasticsearch
      name: elasticsearch
      version: 8.5.1
    - componentName: github.com/jensh007/redis
      name: redis
      version: 7.0.9
    name: github.com/jensh007/microblog-deployment
    provider:
      name: ocm.software
    repositoryContexts:
    ...
    resources: []
    sources: []
    version: 0.23.1
  meta:
    ...
```

With this we can drill down to the installable helm charts and the container images:

```shell
ocm get resource ${OCM_REPO}//github.com/jensh007/microblog:0.23.1 -o wide

NAME            VERSION IDENTITY TYPE      RELATION ACCESSTYPE  ACCESSSPEC
microblog-chart 0.23.1           helmChart local    ociArtifact {"imageReference":"ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/microblog:0.23.1"}
microblog-image 0.23.1           ociImage  local    ociArtifact {"imageReference":"ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/images/microblog:0.23.1"}
```

With this information we can create  a helm values file with the updated image reference:

`microblog_values_localized.yaml`:

```yaml
image:
    repository: ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/images/microblog
    tag: "0.23.1"
imagePullSecrets:
  - name: gcr-secret
```

For a private registry you may also need to specify an image pull secret. This secret has to be present on the target cluster before calling helm commands.

```yaml
image:
    ...
imagePullSecrets:
  - name: gcr-secret
```

Note: For a real application deployment there will be more localized settings. Number of replicas, domain names in Ingress specs are typical examples.

The following steps will act on a target cluster. For this we assume that your `KUBECONFIG` enviroment variable is set correctly (or append `--kubeconfig` option).
We will need a namespace in the target cluster. We use the namespace `dev`for this example:

```
kubectl create namespace dev
```

With the localized values we can instruct `helm` to perform an installation:

```shell
helm install -n dev microblog oci://ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/microblog --version 0.23.1  --values microblog_values_localized.yaml

Pulled: ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/microblog:0.23.1
Digest: sha256:2841665cf3f669ed0a45e70c77bbe27a91ae4dde2d119117ae1e7c1f486ce510
NAME: microblog
LAST DEPLOYED: Fri Mar 10 09:28:04 2023
NAMESPACE: dev
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands:
  https://microblog.ocm2.hubforplay.shoot.canary.k8s-hana.ondemand.com/

```

This command instructs helm to create a helm release named `microblog` and use the
helm chart from our OCI-registry. The location was grabbed from the command above.

If the command succeeds you can retrieve the status with:

```shell
helm list
NAME     	NAMESPACE	REVISION	UPDATED                             	STATUS  	CHART              	APP VERSION
microblog	dev      	1       	2023-03-10 09:28:04.658464 +0100 CET	deployed	microblog-0.23.1   	0.23.1
```

You can also check the created pod:

```shell
kubectl get pods
NAME                                              READY   STATUS             RESTARTS      AGE
microblog-7c65dc4d9d-tvr97                        0/2     CrashLoopBackOff   10 (5s ago)   6m5s

k describe pod microblog-7c65dc4d9d-tvr97

...
Containers:
  microblog:
    ...
    Image:         ghcr.io/acme.org/microblogapp/github.com/jensh007/microblog/images/microblog:0.23.1
...

```

The pod is not in the status running yet because it is missing the required dependencies. We need to perform the additional steps to install them. The steps are the same so we do not repeat them in detail again:

```shell
ocm get resource ${OCM_REPO}//github.com/jensh007/nginx-controller:1.5.1 -o wide
ocm get resource ${OCM_REPO}//github.com/jensh007/mariadb:10.11.2 -o wide
ocm get resource ${OCM_REPO}//github.com/jensh007/elasticsearch:8.5.1 -o wide
ocm get resource ${OCM_REPO}//github.com/jensh007/redis:7.09 -o wide
```

Create files:

* nginx_values_localized.yaml
* mariadb_values_localized.yaml
* elasticsearch_values_localized.yaml
* redis_values_localized.yaml

and install with:

```
helm install -n dev nginx oci://ghcr.io/acme.org/microblogapp/github.com/jensh007/nginx-controller/ingress-nginx --version 4.4.2 --values nginx_values_localized.yaml
helm install -n dev mariadb oci://ghcr.io/acme.org/microblogapp/github.com/jensh007/mariadb/mariadb --version 11.4.2 --values mariadb_values_localized.yaml
helm install -n dev elasticsearch oci://ghcr.io/acme.org/microblogapp/github.com/jensh007/elasticsearch/elasticsearch --version 8.5.1 --values elasticsearch_values_localized.yaml
helm install -n dev redis oci://ghcr.io/acme.org/microblogapp/github.com/jensh007/redis/redis --version 17.6.0 --values redis_values_localized.yaml
```

## Updating Components

Updating components requires two steps:

* Updating the component version of the used sub-component
* Updating the root component version to change the reference to the sub-component.

Given the example from above let us assume we will update mariadb from 10.11.2 to 10.11.3 and the microblog application component from 0.23.1 to 0.24.0.

We would create a new root component version:

```yaml
  component:
    componentReferences:
    - componentName: github.com/jensh007/microblog
      name: microblog
      version: 0.24.0
    - componentName: github.com/jensh007/nginx-controller
      name: nginx-controller
      version: 1.5.1
    - componentName: github.com/jensh007/mariadb
      name: mariadb
      version: 10.11.3
    - componentName: github.com/jensh007/elasticsearch
      name: elasticsearch
      version: 8.5.1
    - componentName: github.com/jensh007/redis
      name: redis
      version: 7.0.9
    name: github.com/jensh007/microblog-deployment
    provider:
      name: ocm.software
    repositoryContexts:
    ...
    resources: []
    sources: []
    version: 0.24.0
  meta:
    ...
```

For each of the two updated sub-components mariadb and microblog we would also create a new component version.

You should never change versions of sub-components without increasing the version of the root component. Otherwise you will lose the history of your bill-of-delivery.

