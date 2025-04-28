---
title: "Installation"
description: "OCM Controller Installation"
draft: false
images: []
weight: 42
toc: true
---

To install the `ocm-controller` you can use the provided Helm chart from the `ocm-controller` GitHub project's `./deploy` folder.
The Helm chart has also been uploaded to the GitHub container registry as [OCI artifact](https://github.com/open-component-model/ocm-controller/pkgs/container/helm%2Focm-controller) and this is also the preferred way to install the `ocm-controller`.

To install the `ocm-controller` Helm chart use the following command (replace `v0.26.0` with the desired version):

```bash
helm install ocm-controller oci://ghcr.io/open-component-model/helm/ocm-controller --version v0.26.0
```
