---
title: OCM Controllers
description: "Learn about the OCM controllers and their capabilities."
icon: "🏁"
weight: 43
toc: true
hasMermaid: true
---

{{<callout context="danger" title="Caution" icon="outline/alert-triangle">}}
This project is in early development and not yet ready for production use.
{{</callout>}}

The OCM controllers bridge the gap between OCM repositories and running Kubernetes clusters. They resolve OCM component versions, download resources, and hand them off to deployment tooling such as FluxCD or the built-in [Deployer]({{< relref "deployer.md" >}}).

A separate controller handles the transfer of OCM components between registries. For details on that, see the [transfer architecture document](https://github.com/open-component-model/open-component-model/blob/main/kubernetes/controller/docs/adr/replication.md).

### Before You Begin

You should be familiar with the following concepts:

- [Open Component Model](https://ocm.software/)
- [Kubernetes](https://kubernetes.io/) ecosystem
- [kro](https://kro.run)
- Kubernetes resource deployer such as [FluxCD](https://fluxcd.io/)

## Architecture

Every deployment starts with the same chain of three controller resources:

```mermaid
flowchart LR
    classDef k8sObject fill:#b3b3b3,color:black,stroke:black;
    classDef ocm fill:white,stroke:black,color:black;

    subgraph OCM Repository
        CV[Component Version]
    end

    subgraph Kubernetes Cluster
        Repo[Repository] --> Comp[Component] --> Res[Resource]
    end

    CV -.->|resolves| Repo

    class Repo,Comp,Res k8sObject
    class CV ocm
```

The **Repository** validates that the OCM repository is reachable. The **Component** downloads and verifies the component version descriptor. The **Resource** resolves a specific artifact within that component and publishes its location in its status.

From here, what happens next depends on the deployment pattern.

## Deployment Patterns

### Using FluxCD (or other external deployers)

An OCM resource with an OCI-based access type can be consumed directly by FluxCD. A `ResourceGraphDefinition` (RGD) wires the OCM controller resources to FluxCD's `OCIRepository` and `HelmRelease`, letting kro orchestrate the full chain.

```mermaid
flowchart TB
    classDef cluster fill:white,color:black,stroke:black;
    classDef reconciledBy fill:#dedede,stroke:black,stroke-dasharray: 5,color:black;
    classDef k8sObject fill:#b3b3b3,color:black,stroke:black;
    classDef information fill:#b3b3b3,color:black,stroke:black,stroke-dasharray: 2;
    classDef ocm fill:white,stroke:black,color:black;
    classDef legendStyle fill:white,stroke:black,color:black,stroke-dasharray: 2;
    classDef legendStartEnd height:0px;
    classDef legendItems fill:#b3b3b3,stroke:none,color:black;

    subgraph legend[Legend]
        start1[ ] ---references[referenced by] --> end1[ ]
        start2[ ] -.-creates -.-> end2[ ]
        start3[ ] ---instanceOf[instance of] --> end3[ ]
        start4[ ] ~~~reconciledBy[reconciled by] ~~~ end4[ ]
        start5[ ] ~~~k8sObject[k8s object] ~~~ end5[ ]
        start6[ ] ~~~templateOf[template of] ~~~ end6[ ]
    end

    subgraph background[ ]
        direction TB

        subgraph ocmRepo[OCM Repository]
           subgraph ocmCV[OCM Component Version]
               subgraph ocmResource[OCM Resource: HelmChart]
               end
           end
        end

        subgraph k8sCluster[Kubernetes Cluster]
            subgraph kroRGD[kro]
                subgraph rgd[RGD: Simple]
                    direction LR
                    rgdRepository[Repository]
                    rgdComponent[Component]
                    rgdResourceHelm[Resource: HelmChart]
                    rgdSource[FluxCD: OCI Repository]
                    rgdHelmRelease[FluxCD: HelmRelease]
                end
            end
            subgraph kroInstance[kro]
                subgraph instanceSimple[Instance: Simple]
                    subgraph ocmControllers[OCM Controllers]
                        k8sRepo[Repository] --> k8sComponent[Component] --> k8sResource[Resource: HelmChart]
                    end
                    subgraph fluxCD[FluxCD]
                        source[OCI Repository] --> helmRelease[HelmRelease]
                    end
                    k8sResource --> source
                end
            end
            kroRGD & instanceSimple --> crdSimple[CRD: Simple]
            helmRelease --> deployment[Deployment: Helm chart]
        end

        ocmRepo --> k8sRepo
    end

    linkStyle default fill:none,stroke:black;
    linkStyle 2,3,16,18 stroke:black,stroke-dasharray: 10;
    linkStyle 4,5,17 stroke:black,stroke-dasharray: 4;

    class start1,end1,start2,end2,start3,end3,start4,end4,start5,end5,start6,end6 legendStartEnd;
    class references,creates,instanceOf legendItems;
    class templateOf,rgdRepository,rgdComponent,rgdResourceHelm,rgdSource,rgdHelmRelease information;
    class reconciledBy,ocmK8sToolkit,fluxCD,kroRGD,kroInstance reconciledBy;
    class k8sObject,rgd,k8sRepo,k8sComponent,k8sResource,source,helmRelease,deployment,crdSimple,instanceSimple k8sObject;
    class ocmRepo,ocmCV,ocmResource ocm;
    class k8sCluster cluster;
    class legend legendStyle;
```

The RGD defines templates for all the resources needed. kro reconciles the RGD into a CRD, and creating an instance of that CRD spins up the actual resources: Repository, Component, and Resource on the OCM side, plus OCIRepository and HelmRelease on the FluxCD side.

{{<callout context="caution" title="OCM resource access required" icon="outline/alert-triangle">}}
With FluxCD, this only works if the OCM resource has an access type for which FluxCD has a corresponding Source (e.g. an OCI or GitHub repository).
{{</callout>}}

### Using the Deployer

For resources that contain plain Kubernetes manifests, such as an RGD, a Kustomization, or raw YAML, the built-in [Deployer]({{< relref "deployer.md" >}}) can apply them directly using server-side apply. No external deployment tooling is required.

A common pattern is packaging an RGD inside the OCM component itself and using the Deployer to bootstrap it into the cluster. This lets developers ship deployment instructions alongside the software.

For details on how the Deployer works, including ApplySet semantics, drift detection, and caching, see the [Deployer concept]({{< relref "deployer.md" >}}).

## ResourceGraphDefinitions

A `ResourceGraphDefinition` (RGD) is a kro resource that defines templates for a set of Kubernetes resources and the dependencies between them. When applied to a cluster, kro creates a CRD from the RGD. Instances of that CRD trigger the actual resource creation.

RGDs are central to how the OCM controllers orchestrate deployments. They allow you to express the full dependency chain, from OCM repository access through to the final deployment, as a single declarative unit. Values can be passed from one resource's status into another resource's spec using kro's template expressions.

For more on kro and RGDs, see the [kro documentation](https://kro.run).

## Installation

Currently, the OCM controllers are available as [image][controller-image] and
[Kustomization](https://github.com/open-component-model/open-component-model/blob/main/kubernetes/controller/config/default/kustomization.yaml). A Helm chart is planned for the future.

To install the OCM controllers into your running Kubernetes cluster, you can use the following commands:

```console
# In the open-component-model repository, folder kubernetes/controller
task deploy
```

or

```console
kubectl apply -k https://github.com/open-component-model/open-component-model/kubernetes/controller/config/default?ref=main
```

{{<callout context="caution" title="Deployer tools" icon="outline/alert-triangle">}}
If you plan to use FluxCD or another external deployer alongside the OCM controllers, you need to install them separately. The OCM controllers deployment does not include kro or any deployer.

- [kro](https://kro.run/docs/getting-started/Installation/)
- [FluxCD](https://fluxcd.io/docs/installation/)
{{</callout>}}

## Getting Started

- [Setup your (test) environment with kind, kro, and FluxCD]({{< relref "setup-controller-environment.md" >}})
- [Deploying a Helm chart using a `ResourceGraphDefinition` with FluxCD]({{< relref "deploy-with-controllers.md" >}})
- [Configuring credentials for OCM controller resources to access private OCM repositories]({{< relref "configure-credentials-for-controllers.md" >}})

[controller-image]: https://github.com/open-component-model/open-component-model/pkgs/container/kubernetes%2Fcontroller
