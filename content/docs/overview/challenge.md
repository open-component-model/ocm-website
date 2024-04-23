---
title : "Benefits of OCM"
description: "The Software Lifecycle Management Challenge"
weight: 12
date: 2020-10-06T08:48:23+00:00
lastmod: 2020-10-06T08:48:23+00:00
draft: false
images: []
toc: true
---

In today's cloud era, enterprises still grapple with tools and processes rooted in outdated on-premises and monolithic thinking. Ad-hoc, fragmented toolsets are used across software lifecycle processes, severely impacting the ability to deliver software securely, consistently, and compliantly across cloud, on-prem, hybrid and air-gapped environments.

Overly complex, bespoke CI/CD pipelines and the lack of automation across the whole lifecyle process create a tedious, error-prone, and ineffective approach to managing software at scale. This operational nightmare is compounded by the absence of a standardized way to describe software components and their associated technical artifacts.

## Requirements Towards a Modern Software Component Model

### Immutable and unique Component Identity

A crucial requirement is the ability to assign an immutable and globally unique Component Identity to each software component. This identifier acts as a "correlation ID," allowing all lifecycle management processes, such as compliance scanning, to correlate their outputs to a single, identifiable software component.

### Artifact Descriptions with Location Information

The model should facilitate the description of all technical artifacts (or resources) necessary for deploying a specific software component. This list, termed a "Software Bill of Delivery" (SBoD), outlines only the artifacts required for successful deployment. Additionally, the description must encompass the specific technical access locations from which each artifact can be retrieved.

### Separation of Component Identity and Artifact Location

In certain environments, artifacts are required to be stored in local registries, mandating the copying of technical artifacts into these target environments. This is especially true for private or air-gapped scenarios where retrieving artifacts from their original location is not feasible due to restricted or non-existent internet access or compliance reasons. To address this, the model must enable the separation of a software component's immutable ID from the current location of its technical artifacts. The Component Identity must remain stable across all boundaries and system environments, while the artifact locations should be changeable.

### Technology-Agnostic

At its core, the model must be technology-agnostic, capable of supporting not only modern containerized cloud products but also legacy software. Many larger companies operate hybrid landscapes comprising modern cloud-native products running on cloud infrastructures and legacy applications that have not yet transitioned (or may never transition) to the public cloud or be containerized. To cater to such scenarios, it is crucial for the software component model to handle both cloud-native and legacy software, necessitating complete agnosticism regarding the technologies used by the described software components and their artifacts.

### Extensibility

The model should be designed with extensibility in mind, enabling straightforward adaptation to future trends and technologies without constantly impacting the tools and processes employed for software lifecycle management.

### Signing

The model should provide out-of-the-box support for signing and verification processes. This capability allows consumers of software components to verify that the delivered components have not been tampered with. Importantly, the signing and verification support must account for the possibility that the technical artifact locations may change over time, implying that these specific locations should not be part of the signing process.

### Network effects

Components described using OCM are primed for secure consumption and immediate integration into higher-level components (or products). The ability to link to trusted and already attested components can facilitate adoption across different teams within an organization, directly improving efficiency (akin to the proficiency of package models like Maven or npm). Moreover, with other parties also describing components using OCM, commercial contracts can cover the necessary technical trust outside the organization, simplifying the secure import and compliant re-use of these components. OCM envisions fostering a network effect across the industry.

## OCM: Streamlining Software Lifecycle Management

The Open Component Model (OCM) is the much-needed life-raft for organizations drowning in software lifecycle management complexity. By establishing a standardized way to describe software components and their artifacts, OCM tackles the core issues plaguing enterprises. By linking additional metadata using OCM’s identities, it facilitates asynchronous handling of various lifecycle management processes, such as compliance checks, security scans, deployments, and more, in a decoupled and streamlined manner.

![OCM as Enabler for asynchronous Lifecycle Management Processes](/images/ocm-benefits-lm-processes-with-ocm-bluebg.png)
<br>

- **Unique Component Identities:** OCM assigns an immutable, globally unique ID to each component, enabling seamless correlation across all lifecycle tools and processes like a "compliance dashboard".
  
- **Software Bill of Delivery:** OCM enables the precise specification of all technical artifacts required for delivering a software component. This compilation, termed a 'Software Bill of Delivery (SBoD),' comprehensively lists the necessary artifacts along with their corresponding location information to facilitate seamless access.

- **Stable IDs, Changing Artifact Locations:** OCM cleanly separates the immutable component ID from the changeable artifact locations, essential for hybrid/private environments.

- **Technology Agnosticism:** Being agnostic to implementation technologies like container images, NPM packages, or binaries, OCM effortlessly handles both cloud-native and legacy apps.

- **Future-Proof Extensibility:** OCM's extensible design allows simple adaptation to emerging trends without disrupting existing tooling.

- **Trusted Signatures:** Built-in signing and verification ensure artifact integrity even as artifact locations change over time.
  
With OCM, a "single source of truth" is established for all software artifacts across the lifecycle. Compliance checks, security scans, deployments and more become streamlined operations anchored to OCM's standardized component definitions.

Moreover, by fostering component reuse within and across organizations, OCM unlocks powerful network effects akin to package managers, boosting productivity and simplifying commercial software consumption.

In essence, OCM is the missing link that finally empowers organizations to tame the software lifecycle beast through a consistent, location-agnostic way to identify, access, exchange and verify software artifacts at scale.
