---
title: "Transport OCM Component Versions"
description: "Learn how to transport OCM component versions between different registries."
icon: "🚚"
weight: 26
toc: true
---

The section [Add Component Version to CTF archive](/docs/getting-started/create-component-version/#add-component-version-to-ctf-archive/) explained how to store component versions in a CTF archive.

During the transfer, it is possible to include component references as local blobs. It is also possible to include references in a recursive way.

Here is an example of a recursive transfer from one OCI registry to another, which includes resources and references:

```shell
ocm transfer componentversion --recursive --copy-resources ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 another-registry/
```

```shell
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

The OCM CLI's `transfer` command can be used to transfer component versions, CTF archives, and artifacts. See `ocm transfer -h` for more information.

More examples on the transport archive and the common transfer format (CTF) can be found in the [ocm-spec](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/03-storage-backends/ctf.md).

## Air gapped environment

Working with air-gapped environments requires careful preparation and a systematic approach to ensure all component dependencies are available offline. This section demonstrates how to prepare, transport, and deploy OCM components in secure, disconnected environments.

### Inspect Component Structure

Begin by examining the component descriptor and its resolved references to understand the complete dependency tree:

```shell
ocm get resources ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 -r  -otree
COMPONENT                                       NAME           VERSION IDENTITY TYPE        RELATION
└─ ocm.software/toi/demo/helmdemo                              0.12.0                       
   ├─                                           chart          0.12.0           helmChart   local
   ├─                                           config-example 0.12.0           yaml        local
   ├─                                           creds-example  0.12.0           yaml        local
   ├─                                           image          1.0              ociImage    external
   ├─                                           package        0.12.0           toiPackage  local
   └─ ocm.software/toi/installers/helminstaller installer      0.12.0                       
      ├─                                        toiexecutor    0.12.0           toiExecutor local
      └─                                        toiimage       0.12.0           ociImage    local
```

### Create Offline Package

Download the complete component descriptor with all referenced resources as local blobs. This creates a self-contained package that includes all dependencies:

```shell
ocm transfer component ghcr.io/open-component-model/ocm//ocm.software/toi/demo/helmdemo:0.12.0 -r --copy-resources ./ctf-copy-resources
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

### Verify Package Integrity

Confirm that all resources have been successfully packaged and are available as local blobs:

```shell
du -shA ctf-copy-resources 
106M ctf-copy-resources
```

```shell
ocm get resources ctf-copy-resources -o treewide 
COMPONENT                                    NAME           VERSION IDENTITY TYPE        RELATION ACCESS
├─ ocm.software/toi/demo/helmdemo                           0.12.0                                
│  ├─                                        chart          0.12.0           helmChart   local    localBlob
│  ├─                                        config-example 0.12.0           yaml        local    localBlob
│  ├─                                        creds-example  0.12.0           yaml        local    localBlob
│  ├─                                        image          1.0              ociImage    external localBlob
│  └─                                        package        0.12.0           toiPackage  local    localBlob
└─ ocm.software/toi/installers/helminstaller                0.12.0                                
   ├─                                        toiexecutor    0.12.0           toiExecutor local    localBlob
   └─                                        toiimage       0.12.0           ociImage    local    localBlob
```

### Transport to Air-Gapped Environment

Copy the packaged OCM artifacts to your preferred portable storage medium for secure transport:

```shell
sudo cp -r ./ctf-copy-resources /media/....
```

**Physical Transport Phase** ✈️

Transport your portable storage device containing the OCM artefact to the air-gapped environment following your organization's security protocols.

```shell
                                                   ___
                                              ____/   \____
    o  "Here I come!"                         |    ✈️     |
   /|\_┌▓┐                                    |___________|
   / \                                           |     |
                                              ___|     |___
```  

### Deploy in Air-Gapped Environment

Transfer the OCM artifacts from your portable storage device to the air-gapped OCI registry:

```shell
ocm transfer ctf ./media/.../ctf-copy-resources $AIR_GAPPED_OCI_REGISTRY/... 
```

### Application Deployment

With all components now available in your air-gapped registry, you can proceed with deploying your [applications via GitOps](/docs/tutorials/ocm-and-gitops/deploying-applications-with-ocm-gitops/). The self-contained nature of the OCM package ensures reliable deployment without external dependencies.

```shell
              🎉 SUCCESSFUL DEPLOYMENT IN AIR-GAPPED K8S CLUSTER 🎉

                    ╔══════════════════════════════════════╗
                    ║        AIR-GAPPED ENVIRONMENT        ║
                    ║              🔒 SECURE �             ║
                    ╚══════════════════════════════════════╝
                                      │
                    ┌─────────────────────────────────────┐
                    │         KUBERNETES CLUSTER          │
                    │                                     │
                    │  ┌─────┐  ┌─────┐  ┌─────┐          │
                    │  │ POD │  │ POD │  │ POD │          │
                    │  │ ⚙️  │  │ ⚙️  │  │ ⚙️  │          │
                    │  └─────┘  └─────┘  └─────┘          │
                    │     │        │        │             │
                    │  ┌──┴────────┴────────┴──┐          │
                    │  │      LEADER NODE      │          │
                    │  │         🎛️            │          │
                    │  └───────────────────────┘          │
                    │                                     │
                    │  ┌─────┐  ┌─────┐  ┌─────┐          │
                    │  │NODE1│  │NODE2│  │NODE3│          │
                    │  │ 🖥️  │  │ 🖥️  │  │ 🖥️  │          │
                    │  └─────┘  └─────┘  └─────┘          │
                    └─────────────────────────────────────┘

                        \o/  "DEPLOYMENT SUCCESSFUL!"
                         |   "All pods are running!"
                        / \  "Zero downtime achieved!"
```
