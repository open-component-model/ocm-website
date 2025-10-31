---
title: "Installation"
description: "Install the OCM controller using Helm"
icon: "🔧"
weight: 52
---

{{<callout context="tip" title="Did you know?">}}Get ready for the next evolution of the Open Component Model, designed to empower your cloud-native workflows. Discover a preview of the innovative `ocm-k8s-toolkit` [here](https://github.com/open-component-model/ocm-k8s-toolkit) and be part of shaping the future of component management!{{</callout>}}

To install the `ocm-controller` you can use the provided Helm chart from the `ocm-controller` GitHub project's `./deploy` folder. The Helm chart has also been uploaded to the GitHub container registry as [OCI artifact](https://github.com/open-component-model/ocm-controller/pkgs/container/helm%2Focm-controller) and this is also the preferred way to install the `ocm-controller`.

{{<callout context="note" title="Prerequisites">}}The ocm-controller requires certain prerequisites, like the cert manager and certificate secrets for the in-cluster registry. For details, checkout the `prime-test-cluster.sh` script under this repository's [hack folder](https://github.com/open-component-model/ocm-controller/tree/main/hack){{</callout>}}

To install the `ocm-controller` Helm chart use the following command (replace `v0.26.0` with the desired version):

```bash
helm upgrade -i --wait --create-namespace -n ocm-system ocm-controller \
  oci://ghcr.io/open-component-model/helm/ocm-controller --version v0.26.0
```
