---
title: "Display and Examine Component Versions"
description: "Learn how to display and examine component versions in OCM."
icon: "👁️"
weight: 24
toc: true
---

## List Component Versions

To show the list of all component versions of a specific component stored in an OCM repository or CTF archive (which technically is also an OCM repository), the [`ocm get component-version`](/docs/reference/ocm-cli/ocm-get-component-version/) command can be used. Only specify the component name and skip the version.

In the example below we use the OCM component `ocm.software/toi/demo/helmdemo`.

Notice the format of the specified component which has a prefix defining the OCM repository followed by a double slash `//` and then the component name.

```shell
ocm get cv ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo
```

```shell
 COMPONENT                      │ VERSION     │ PROVIDER
────────────────────────────────┼─────────────┼──────────────
 ocm.software/toi/demo/helmdemo │ 0.21.0      │ ocm.software
                                │ 0.21.0-rc.1 │
                                │ 0.20.1      │
                                │ 0.20.1-rc.1 │
                                │ 0.20.0      │
                                │ 0.20.0-rc.1 │
                                │ 0.19.1      │
...
```

## Get Component Versions

To see just a specific component version, add a version to the component name:

```shell
ocm get cv ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.21.0
```

```shell
 COMPONENT                      │ VERSION │ PROVIDER
────────────────────────────────┼─────────┼──────────────
 ocm.software/toi/demo/helmdemo │ 0.21.0  │ ocm.software
```

To get the component descriptor of that component version, use the output format option `-o yaml` (the output below has been shortened for better readability and only the `image` and `chart`).

```shell
ocm get cv ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.21.0 -o yaml
```

```yaml
component:
  componentReferences:
  - componentName: ocm.software/toi/installers/helminstaller
    digest:
      hashAlgorithm: ""
      normalisationAlgorithm: ""
      value: ""
    name: installer
    version: 0.21.0
  creationTime: "2025-03-06T07:37:08Z"
  name: ocm.software/toi/demo/helmdemo
  provider: ocm.software
  repositoryContexts:
  - baseUrl: ghcr.io
    componentNameMapping: urlPath
    subPath: open-component-model/ocm
    type: OCIRegistry
  resources:
...
  - access:
      imageReference: ghcr.io/open-component-model/ocm/google-containers/echoserver:1.10@sha256:cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229
    name: image
    relation: external
    type: ociImage
    version: "1.0"
  - access:
      imageReference: ghcr.io/open-component-model/ocm/ocm.software/toi/demo/helmdemo/echoserver:0.1.0@sha256:8ab41f82c9a28535f1add8ffbcd6d625a19ece63c4e921f9c8358820019d1ec2
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 8ab41f82c9a28535f1add8ffbcd6d625a19ece63c4e921f9c8358820019d1ec2
    name: chart
    relation: local
    type: helmChart
    version: 0.21.0
...
```

In the example above, `ghcr.io/open-component-model/ocm` is the OCM repository, whereas `ocm.software/toi/demo/helmdemo` is the component stored in this component repository and `0.21.0` the component's version.

{{<callout context="caution" title="Under Construction">}}The `--recursive` option is currently implemented from scratch and not available yet. Stay tuned for updates!{{</callout>}}

With the option `--recursive`, it is possible to show the complete component version, including the component versions it references.

```shell
ocm get cv ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.21.0 --recursive
```

```shell
  REFERENCEPATH                         COMPONENT                                 VERSION PROVIDER     IDENTITY
                                        ocm.software/toi/demo/helmdemo            0.21.0  ocm.software
  ocm.software/toi/demo/helmdemo:0.21.0 ocm.software/toi/installers/helminstaller 0.21.0  ocm.software "name"="installer"
```

{{<callout context="caution" title="Under Construction">}}The `-o tree` option is currently implemented from scratch and not available yet. Stay tuned for updates!{{</callout>}}

To get a tree view, add the option `-o tree`:

```shell
ocm get cv ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.21.0 --recursive -o tree
```

```shell
  NESTING COMPONENT                                 VERSION PROVIDER     IDENTITY
  └─ ⊗    ocm.software/toi/demo/helmdemo            0.21.0  ocm.software
     └─   ocm.software/toi/installers/helminstaller 0.21.0  ocm.software "name"="installer"
```

As mentioned before a CTF archive itself is an OCM repository, so we can execute the same commands on a CTF archive. So, let's get the information about the component `github.com/acme.org/helloworld` we created in the previous step and that we stored in the CTF archive `/tmp/helloworld/ctf-hello-world`:

```shell
ocm get cv /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0
```

```shell
 COMPONENT                      │ VERSION │ PROVIDER
────────────────────────────────┼─────────┼──────────
 github.com/acme.org/helloworld │ 1.0.0   │ acme.org
```

## List Resources of a Component Version

{{<callout context="caution" title="Under Construction">}}Listing resources and sources most likely will become part of the `ocm get cv` command and become an additional option. Stay tuned for updates!{{</callout>}}

To list the resources found in a component version tree, the command [`ocm get resources`](https://github.com/open-component-model/ocm/blob/main/docs/reference/ocm_get_resources.md) can be used:

```shell
ocm get resources ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 --recursive -o tree
```

```shell
COMPONENT                                       NAME           VERSION IDENTITY TYPE        RELATION
└─ ocm.software/toi/demo/helmdemo                              0.21.0
   ├─                                           chart          0.21.0           helmChart   local
   ├─                                           config-example 0.21.0           yaml        local
   ├─                                           creds-example  0.21.0           yaml        local
   ├─                                           image          1.0              ociImage    external
   ├─                                           package        0.21.0           toiPackage  local
   └─ ocm.software/toi/installers/helminstaller installer      0.21.0
      ├─                                        toiexecutor    0.21.0           toiExecutor local
      └─                                        toiimage       0.21.0           ociImage    local
```
