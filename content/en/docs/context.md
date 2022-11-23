---
title: "Context"
description: ""
lead: ""
date: 2022-08-12T10:37:54+01:00
lastmod: 2022-08-12T10:37:54+01:00
draft: false
images: []
menu:
  docs:
    parent: ""
    identifier: "background"
weight: 100
toc: true
---

The definition, structure and lifecycle-management of software in larger enterprises often builds upon tools and processes, which originate from former on-premise thinking and monolithic architectures. In the past, development teams have built specific integrations with CI/CD systems, compliance tools, reporting dashboards or delivery processes. Some might have even built their own toolsets, specifically for their products, including those required for compliance handling and delivery automation.<br> 
These concepts, processes and tools are often still in use today, even though everyone knows: They don't fit into today's cloud world.

## Why is that a problem?
A fragmented set of individual, sometimes homegrown, tools used across software components is constantly affecting the ability to deliver software securely, consistently and compliant to cloud, on-premise or hybrid environments.

Individual, overly complex and thus hard-to-operate CI/CD pipelines, and the inability to provide one aggregated "compliance-dashboard" of all currently running artefacts across all environments, result in a tedious, error-prone and ineffective lifecycle-management of software at scale.

## How can this improve?
The major problem here is the absence of **a standardized software component model used to describe all software components, including their technical artefacts**. 

Such a model would not only help to streamline **deployments to various environments** (public, private, hybrid), but also in other areas of lifecycle-management like **compliance and reporting**.

Let's have a look at the most crucial features a standardized software component model must support.

## Requirements towards a modern software component model
### Immutable Component-ID
An immutable Component-ID must be established by the model for each software component. This ID could be used by all subsequent lifecycle-management processes like compliance scanning. One might think of this as a "correlation ID", which makes it possible to correlate the various lifecycle-management tools and processes (including their results) to one single identifiable software component.

### Artefact Descriptions with Location Information
The model must support the description of all artefacts required for a specific software component to be deployed. This list of technical artefacts (or "resources") can be defined as **a "Software-Bill-of-Delivery" (SBoD)**, as it is only required to describe those artefacts, which have to be delivered for a successfull deployment.
These descriptions must also include the concrete technical access locations, from where each artefact can be retrieved from. 

### Separation of Component-ID and Artefact Location
Some of the aforementioned environments prescribe the use of artefacts stored in local registries, **requiring the process of copying technical artefacts into such target environments**. This is especially true for private or air-gapped use-cases, where it is usually not possible to pull artefacts from their original location (due to restricted/non-existing internet access or for compliance reasons). These scenarios require that **software components must separate their immutable ID from the current location of their technical artefacts**: The Component-ID needs to stay stable, across all environments and landscapes, whereas the artefact locations have to be changeable.

### Technology-Agnostic
At its heart, the model needs to be **technology-agnostic**, so that not only modern containerized cloud, but also legacy software is supported. Larger companies usually operate some kind of hybrid landscapes these days, where parts are modern cloud native software applications running on cloud infrastructures, and other parts are legacy apps, which have not yet (or will never be) transitioned to the cloud or put into containers.<br>
This fact makes it crucial to **establish a software component model, which is able to handle both cloud native and legacy software**, so it needs to be fully agnostic about the technologies used by the described software components and their artefacts.

### Extensibility
Additionally, the **model needs to be extensible**. Being able to easily adapt to future trends and technologies, without constantly affecting the tools and processes used for lifecycle-managing the software, is a must.

### Signing 
The model needs to support signing and verification processes out-of-the-box. This enables consumers of software components to verify that delivered components have not been tampered with. The signing and verification support has to acknowledge the fact that the technical artefact locations may change over time, which means that these concrete locations must not be part of the signing process.

## TL;DR - Summary
All of the above boils down to the following requirements.<br>
A modern standardized software component model must:
- describe all individual technical artefacts of a software component 
- provide access information for these artefacts 
- establish an immutable Component-ID, to be used across all lifecycle-management processes
- establish a clear separation of the immutable ID from the technical artefact locations
- handle technical artefacts in a technology-agnostic way
- be extensible to support future use-cases
- support standard signing and verification processes

The Open Component Model aka "OCM" and its accompanying toolset addresses all of the above, and much more.
