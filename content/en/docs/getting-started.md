---
title: "Getting Started"
description: ""
lead: ""
date: 2022-08-12T10:38:04+01:00
lastmod: 2022-08-12T10:38:04+01:00
draft: true
images: []
menu:
  docs:
    parent: ""
    identifier: "getting-started-6c1e2cb370fed0c83bb76aae7581d869"
weight: 102
toc: true
---

This tutorial will demonstrate how get started with the Open Component Model.

We shall build a component to deliver the `podinfo` application which we will then deploy using OCM's Flux integration.

### Requirements

- [ocm command line tool]()
- [git]()

## Building the component

### The shape of things to come

Our component will consist of three resources:
- podinfo OCI image
- Kubernetes manifest to create a podinfo deployment
- configuration to enable updating our deployment using information from the OCM component descriptor

Don't worry if some of the terminology is unfamiliar at this point, we will introduce concepts and terminology as we go.

### Setting up our project

Let's configure a workspace for developing our component:

`mkdir podinfo-component && cd $_`

OCM will store local artifacts and metadata in a **component archive**. We can use the `ocm` CLI to create the component archive:
`ocm create componentarchive github.com/acme/podinfo v1.0.0 --provider acme`

As we can see above the command `ocm create componentarchive` takes three parameters: the name of our component, it's version and the name of the component provider.

If we now examine the contents of our working directory we can see that a new sub-directory has been created for the component archive:

```shell
$ tree .
.
└── component-archive
    ├── blobs
    └── component-descriptor.yaml

2 directories, 1 files
```

This archive contains a directory for the blobs of local artifacts that we add to our component and a `component-descriptor.yaml` file. The component descriptor is a metadata file that holds information describing the entire surface of our component.

If we examine the file now we will see that it is empty apart from the basic metadata about our component; let's fix that.

### Adding resources

Resources are an OCM concept that define artifacts which are necessary to deploy our software. These artifacts can be things like OCI images, binaries, Helm charts local files or directries, and so on.

To add our podinfo OCI image which need to create a resource file describing the resource and how to access it:

```shell
cat > image_resource.yaml << EOF
name: image
version: v6.2.0
type: ociImage
relation: external
access:
  type: ociArtefact
  imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
EOF
```

With this file to hand we can use the ocm CLI to write this store this resource information in our component archive:

`ocm add resource ./component-archive image_resource.yaml`

Let's use the ocm CLI to verify that the resource has been successfully added:

```shell
$ ocm get resources ./component-archive

NAME  VERSION IDENTITY TYPE     RELATION
image v6.2.0           ociImage external
```

Now that we've successfully added an external resource it's time to add something from the local filesystem.

The following command will generate a simple deployment file that for podinfo:
```shell
cat > deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: podinfo
  labels:
    app: podinfo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: podinfo
  template:
    metadata:
      labels:
        app: podinfo
    spec:
      containers:
      - image: ghcr.io/stefanprodan/podinfo:v6.2.0
        name: podinfo
        ports:
        - containerPort: 9898
          name: http
```


```shell
cat > deployment_resource.yaml << EOF
name: deployment
version: v1.0.0
type: localBlob
input:
  type: file
  path: ./deployment.yaml
  compress: true
EOF
```

Now if we inspect the resources associated with our component we can see the file resource is present:

```shell
$ ocm get resources ./component-archive

NAME       VERSION IDENTITY TYPE     RELATION
deployment v1.0.0           file     local
image      v6.2.0           ociImage external
```

However if we examine the blobs directory we can see that our local file is now present here also:

```shell
tree .
.
├── component-archive
│   ├── blobs
│   │   └── sha256.9d0f28a66f76a31d5d21ac96eb8d0ce34544e8804eaf5288cd43624467a25fef
│   └── component-descriptor.yaml
├── deployment.yaml
├── deployment_resource.yaml
└── image_resource.yaml

2 directories, 5 files
```

And if we examine the blob itself further we can see that it in fact contains our content:

```
$ cat ./component-archive/blobs/sha256.9d0f28a66f76a31d5d21ac96eb8d0ce34544e8804eaf5288cd43624467a25fef | gzip -d

apiVersion: apps/v1
kind: Deployment
metadata:
  name: podinfo
  labels:
    app: podinfo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: podinfo
  template:
    metadata:
      labels:
        app: podinfo
    spec:
      containers:
      - image: ghcr.io/stefanprodan/podinfo:v6.2.0
        name: podinfo
        ports:
        - containerPort: 9898
          name: http
```

Finally we will add a configuration item that will be used when we deploy our application in Kubernetes:

Create the config file:
```
cat > config.yaml << EOF
apiVersion: config.ocm.software/v1alpha1
kind: ConfigData
metadata:
  name: ocm-config
localization:
- resource:
    name: image
  file: deployment.yaml
  image: spec.template.spec.containers[0].image
EOF
```

Create the resource file:
```shell
cat > config_resource.yaml << EOF
name: config
version: v1.0.0
type: localBlob
input:
  type: file
  path: ./config.yaml
  compress: true
EOF
```

Add the resource to the component archive:
`ocm add resource ./component-archive config_resource.yaml`


Examine our component:

```shell
$ ocm get resources ./component-archive

NAME       VERSION IDENTITY TYPE     RELATION
config     v1.0.0           file     local
deployment v1.0.0           file     local
image      v6.2.0           ociImage external
```

Now our component is ready to ship. In the next section we shall examine how to securely transfer our component to a remote repository.

## Shipping the component

## Deploying the component

