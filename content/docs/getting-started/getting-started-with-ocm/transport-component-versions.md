---
title: "Transport OCM Component Versions"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 25
toc: true
---

## Transport OCM Component Versions

The section [Bundle Composed Components](./create-component-version.md#bundle-composed-components) explained how to bundle multiple component version into a transport archive.

During the transfer, it is possible to include component references as local blobs. It is also possible to include references in a recursive way.

Here is an example of a recursive transfer from one OCI registry to another, which includes resources and references:

```shell
ocm transfer componentversion --recursive --copy-resources ${OCM_REPO}//${COMPONENT}:${VERSION} eu.gcr.io/acme/
```

```shell
transferring version "github.com/acme/helloworld:1.0.0"...
...resource 0(github.com/acme/helloworld/echoserver:0.1.0)...
...adding component version...
1 versions transferred
```

The OCM CLI's `transfer` command can be used to transfer component versions, component archives, transport archives, and artifacts. See `ocm transfer -h` for more information.

More examples on the transport archive can be found in [appendix A](https://github.com/open-component-model/ocm-spec/blob/main/doc/appendix/A/CTF/README.md).
