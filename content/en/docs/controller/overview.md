---
title: "Overview"
description: ""
lead: ""
date: 2023-10-20T11:24:41+01:00
lastmod: 2023-10-20T11:24:41+01:00
draft: false
images: []
weight: 21
toc: true
---

The `ocm-controller` is a pivotal part of the Open Component Model (OCM) ecosystem, designed to automate software deployment using the Open Component Model alongside Flux.

Here are its core functionalities:

1. **Component Descriptor Resolution**:
   - Resolves `ComponentDescriptor` metadata for specific component versions.

2. **Authentication**:
   - Handles authentication with OCM repositories, safeguarding secure access to required resources.

3. **Artifact Retrieval**:
   - Fetches artifacts from OCM repositories, gathering essential software or data necessary for deployment.

4. **Component Verification**:
   - Conducts verification of components ensuring integrity and correctness.

5. **Resource Availability**:
   - Makes individual resources from components available within the cluster, facilitating proper resource management.

6. **Localization and Configuration**:
   - Manages localization and configuration of component resources, ensuring correct setup for the target environment.

The `ocm-controller` is developed to be a robust tool within the OCM framework, aiming to streamline the deployment process, making it more structured, secure, and automated. Through its features, it tackles various crucial aspects of modern software deployment, contributing to a more efficient and reliable deployment workflow.

---

## Pipeline Model

The `ocm-controller` operates using a **pipeline** model. The purpose of the pipeline is to process resources from a component and automatically prepare them for deployment, using deployment information that is part of the component itself. In this, sense the processing pipeline is "OCM aware".

The pipeline model is faciliated through the introduction of a `Snapshot` Kubernetes resource. The `Snapshot` resource is managed by the `ocm-controller` and captures the output of a pipeline step. The content of a `Snapshot` is persisted to an in-cluster OCI registry that is also managed by the `ocm-controller`. As a result of the dedicated Kuberetes resource and OCI-based storage, S`Snapshot`'s can be processed and produced by any third-party Kubernetes controller. In addition, `Snapshot`s are Flux-compliant OCI Images and can be deployed using Flux.

The `ocm-controller` contains several built-in processors that can produce, transform and deploy `Snapshot`s, these are as follows:

1. #### Resource Controller
- Produces a `Snapshot` containing the specified OCM resource

2. #### Localization Controller
- Produces a `Snapshot` that applies **Localization rules** to an input resource. **Localization rules** specify how to resolve references to images or other artifacts in manifests that are part of the resource using information from the `Component`. This is important when deploying in air-gapped scenarios or when resources have been moved from their original location using the `ocm` tooling.

3. #### Configuration Controller
- Similar to the `Localization` process but applies configuration rules to an input resource. Configuration data can be passed inline to the controller and is then validated and injected into the resource manifests.

4. #### ResourcePipeline Controller
- An WASM-based controller that allows streamlining and consolidating the pipeline approach. Each step in a `ResourcePipeline` can be a WASM module that contains the logic for transforming resources. A dedicated ABI is provided that enables calling host-functions in order to access component metadata. The `ResourcePipeline` should eventually replace all usage of `Localization` and `Configuration` controller.

5. #### FluxDeployer Controller
- A Flux wrapper that consumes `Snapshot` resources. The `FluxDeployer` creates a Flux `OCIRepository` source that can be consumed by either a `HelmRelease` or `Kustomization`.
