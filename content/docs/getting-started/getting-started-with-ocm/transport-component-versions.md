---
title: "Transport OCM Component Versions"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 26
toc: true
---

The section [Bundle Composed Components](/docs/getting-started/getting-started-with-ocm/create-a-component-version#bundle-composed-components) explained how to bundle multiple component version into a transport archive.

During the transfer, it is possible to include component references as local blobs. It is also possible to include references in a recursive way.

Here is an example of a recursive transfer from one OCI registry to another, which includes resources and references:

```shell
ocm transfer componentversion --recursive --copy-resources ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 another-registry/
```
```
  transferring version "ocm.software/toi/demo/helmdemo:0.12.0"...
    transferring version "ocm.software/toi/installers/helminstaller:0.12.0"...
    ...resource 0 toiimage[ociImage](ocm.software/toi/installers/helminstaller/helminstaller:0.12.0)...
    ...resource 1 toiexecutor[toiExecutor]...
    ...adding component version...
  ...resource 0 package[toiPackage]...
  ...resource 1 chart[helmChart](ocm.software/toi/demo/helmdemo/echoserver:0.1.0)...
  ...resource 2 image[ociImage](google-containers/echoserver:1.10)...
  ...resource 3 config-example[yaml]...
  ...resource 4 creds-example[yaml]...
  ...adding component version...
  2 versions transferred
```

The OCM CLI's `transfer` command can be used to transfer component versions, component archives, transport archives, and artifacts. See `ocm transfer -h` for more information.

More examples on the transport archive and the common transfer format (CTF) can be found in the [ocm-spec](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/03-storage-backends/ctf.md).
