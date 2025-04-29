---
title: "Installation"
description: "OCM Controller Installation"
draft: false
images: []
weight: 42
toc: true
---

To install the `ocm-controller` you can use the provided Helm chart from the `ocm-controller` GitHub project's `./deploy` folder. The Helm chart has also been uploaded to the GitHub container registry as [OCI artifact](https://github.com/open-component-model/ocm-controller/pkgs/container/helm%2Focm-controller) and this is also the preferred way to install the `ocm-controller`.

{{<callout context="note" title="Prerequisites">}}The ocm-controller require certain prerequisites, like the cert manager and certificate secrets for the in-cluster registry. For details, checkout the `prime-test-cluster.sh` script under this repository's [hack folder](https://github.com/open-component-model/ocm-controller/tree/main/hack){{</callout>}}

To install the `ocm-controller` Helm chart use the following command (replace `v0.26.0` with the desired version):

```bash
helm upgrade -i --wait --create-namespace -n ocm-system ocm-controller \
  oci://ghcr.io/open-component-model/helm/ocm-controller --version v0.26.0
```
