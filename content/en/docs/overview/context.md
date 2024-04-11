---
title: Context
date: 2022-08-12T10:37:54+01:00
lastmod: 2022-08-12T10:37:54+01:00
draft: false
weight: 2
toc: true
---

The definition, structure and lifecycle-management of software in larger enterprises often builds upon tools and processes, which originate from former on-premise thinking and monolithic architectures. In the past, development teams have built specific integrations with CI/CD systems, compliance tools, reporting dashboards or delivery processes. Some might have even built their own toolsets, specifically for their products, including those required for compliance handling and delivery automation.<br>
These concepts, processes and tools are often still in use today, even though everyone knows: They don't fit into today's cloud world.

## Why is that a problem?
A fragmented set of individual, sometimes homegrown, tools used across software components is constantly affecting the ability to deliver software securely, consistently and compliant to cloud, on-premise or hybrid environments.

Individual, overly complex and thus hard-to-operate CI/CD pipelines, and the inability to provide one aggregated "compliance-dashboard" of all currently running artifacts across all environments, result in a tedious, error-prone and ineffective lifecycle-management of software at scale.

![Compliance without OCM](/images/ocm-benefits-compliance-without-ocm-bluebg.png)

## How can this improve?
The major problem here is the absence of **a standardized software component model used to describe all software components, including their technical artifacts**.

![Compliance with OCM](/images/ocm-benefits-compliance-with-ocm-bluebg.png)

Such a model would not only help to streamline **compliance processes**, but also in other areas of lifecycle-management like **deployments into various environments (public, private, hybrid) and reporting**.

![OCM as Enabler for asynchronous Lifecycle Management Processes](/images/ocm-benefits-lm-processes-with-ocm-bluebg.png)

Let's have a look at the most crucial features a standardized software component model must support.

## Requirements towards a modern software component model
### Immutable Component-ID
An immutable Component-ID must be established by the model for each software component. This ID could be used by all subsequent lifecycle-management processes like compliance scanning. One might think of this as a "correlation ID", which makes it possible to correlate the various lifecycle-management tools and processes (including their results) to one single identifiable software component.

### Artifact Descriptions with Location Information
The model must support the description of all artifacts required for a specific software component to be deployed. This list of technical artifacts (or "resources") can be defined as **a "Software-Bill-of-Delivery" (SBoD)**, as it is only required to describe those artifacts, which have to be delivered for a successfull deployment.
These descriptions must also include the concrete technical access locations, from where each artifact can be retrieved from.

### Separation of Component-ID and Artifact Location
Some of the aforementioned environments prescribe the use of artifacts stored in local registries, **requiring the process of copying technical artifacts into such target environments**. This is especially true for private or air-gapped use-cases, where it is usually not possible to pull artifacts from their original location (due to restricted/non-existing internet access or for compliance reasons). These scenarios require that **software components must separate their immutable ID from the current location of their technical artifacts**: The Component-ID needs to stay stable, across all environments and landscapes, whereas the artifact locations have to be changeable.

### Technology-Agnostic
At its heart, the model needs to be **technology-agnostic**, so that not only modern containerized cloud, but also legacy software is supported. Larger companies usually operate some kind of hybrid landscapes these days, where parts are modern cloud native software applications running on cloud infrastructures, and other parts are legacy apps, which have not yet (or will never be) transitioned to the cloud or put into containers.<br>
This fact makes it crucial to **establish a software component model, which is able to handle both cloud native and legacy software**, so it needs to be fully agnostic about the technologies used by the described software components and their artifacts.

### Extensibility
Additionally, the **model needs to be extensible**. Being able to easily adapt to future trends and technologies, without constantly affecting the tools and processes used for lifecycle-managing the software, is a must.

### Signing
The model needs to support signing and verification processes out-of-the-box. This enables consumers of software components to verify that delivered components have not been tampered with. The signing and verification support has to acknowledge the fact that the technical artifact locations may change over time, which means that these concrete locations must not be part of the signing process.

### Network effects
Re-use components described with OCM are ready for secure consumption and immediate integration by higher level components (or products). Linking to trusted and already attested components can spawn across different teams within the organization. This directly improves efficiency (cf. proficiency of package models of maven or npm). With other parties also describing component with OCM, a commercial contract can cover the necessary technical trust outside the organization and simplify its secure import and compliant re-use. OCM envisions a network effect across the industry.

## TL;DR - Summary
All of the above boils down to the following requirements.<br>
A modern standardized software component model must:
- describe all individual technical artifacts of a software component
- provide access information for these artifacts
- establish an immutable Component-ID, to be used across all lifecycle-management processes
- establish a clear separation of the immutable ID from the technical artifact locations
- handle technical artifacts in a technology-agnostic way
- be extensible to support future use-cases
- support standard signing and verification processes

The Open Component Model aka "OCM" and its accompanying toolset addresses all of the above, and much more.
