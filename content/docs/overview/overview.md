---
title: Overview
description: "Overview of the Open Component Model"
url: /docs/overview/overview/
date: 2022-08-12T10:37:54+01:00
lastmod: 2022-08-12T10:37:54+01:00
draft: false
weight: 12
toc: true
---

## What is the Open Component Model?

OCM is an open standard for describing software artifacts and lifecycle metadata. It is a technology-agnostic and machine-readable format and focuses on software artifacts that need to be delivered securely across boundaries. At the same time, it maintains integrity and provenance along the complete supply chain.

With the unique identifier of OCM components acting as correlation ID, it enables the alignment of different processes and tools across all stages of the software lifecycle.

Although OCM may seem similar to both package management tools and SBOM, it is actually neither. An SBOM describes the constituent parts of a software product required during the development process. In contrast, OCM describes those parts necessary for delivery and deployment.

We think of this as a **Software Bill of Delivery (SBOD)**.

- **Describe** resources and source repositories of a software product in code. Sign them for uncompromised integrity.
- **Transport** content to any environment, be it public cloud, on-prem, or air-gapped. OCM ensures secure transport across boundaries.
- Leverage built-in Flux integration to seamlessly **automate the deployment** of components via GitOps.
- OCM is more than just another SBOM. It focuses on the parts necessary for delivery and deployment, introducing a new perspective on software delivery. It's an **SBoD, Service Bill of Delivery**.

## Why use OCM?

- OCM components represent the Digital Twin of your deployments, intended to be the single source of truth.
- OCM component identities are unique and immutable.
- Access to the artifacts can be exchanged, e.g. OCM identity stays the same after transporting the OCM component from registry A to registry B.
- Decouple CI from CD. Let agile teams decide to use their own tool set and the central compliance and Ops teams another. The contract between them is OCM.
- Enables asynchronous operations using OCM components, e.g. compliance scans
- Link additional metadata, e.g. an SBoM or data gathered from compliance scans using OCM identities
