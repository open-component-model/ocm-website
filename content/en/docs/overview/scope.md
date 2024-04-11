---
title: "Scope"
description: ""
lead: ""
date: 2022-08-12T10:37:54+01:00
lastmod: 2022-08-12T10:37:54+01:00
draft: false
weight: 3
toc: true
---

Operating software products, both for cloud and on-premises, covers many aspects:

- How, when and where are the technical artifacts created?
- How are technical artifacts stored and accessed?
- Which technical artifacts are to be deployed?
- How is the configuration managed?
- How and when are compliance checks and vulnerability scans executed?
- When are technical artifacts deployed?
- Where and how are those artifacts deployed?
- Which other software installations are required and how are they deployed and accessed?
- etc.

The overall problem domain has a complexity that makes it challenging to be solved as a whole.
However, the problem domain can be divided into two disjoint phases:

- production of technical artifacts
- deployment and lifecycle management of technical artifacts

The produced artifacts must be stored somewhere to access and collect them for the deployment.
OCM defines a standard to describe which technical artifacts belong to a software product and how to
access them. It can be used used at the interface between artifact production and later phases
in the software lifecycle, e.g. the deployment or compliance scans.

OCM provides a common standard for the coupling of

- compliance checks
- security scanning
- code signing
- transport
- deployment or
- other lifecycle-management aspects

based on a well-defined description of software artifacts, their types and the access to their physical content.

In that sense, OCM provides the basis to

- exchange information about software in a controlled manner by defining a location- and technology-agnostic reference
  framework to identify software artifacts
- enable access to local technical artifacts via these IDs
- verify the authenticity of the artifact content found in an actual environment.

If software products are described using OCM, a scanning tool could use the information inside of such an OCM component
to collect all technical artifacts it needs to check and store findings under the globally unique and location-agnostic
identities provided by the model.
This information can be stored along with the component versions and exchanged with other tools without loosing its meaning.
If the technical resources of different software installations are described with different
formalisms, such tools must provide interfaces and implementations for all of them and data exchange becomes a nightmare.

This problem becomes even harder if a software product is build of multiple components, each described with
a different formalism. OCM allows a uniform definition of such compositions, so that one consistent description of
a software installation is available.

The identity scheme provided by OCM acts as some kind of Lingua Franca, enabling
a tool ecosystem to describe, store and exchange information even across boundaries and different system environments, without
loosing its meaning in relation to the described software artifacts and groupings.

The core OCM does not make any assumptions about the

- kinds of technical artifacts (e.g. resources like Docker images, Helm charts, binaries etc. or Git sources)
- technology how to store and access technical artifacts (e.g. as OCI artifacts in an OCI registry)

OCM is a technology-agnostic specification and allows [implementations](https://github.com/open-component-model/ocm-spec/blob/main/doc/specification/extensionpoints/README.md) to provide support for exactly those technical aspects as an extension of the basic model.
The description formalism is even valid and can (at least partly) formally processed,
if not all specified aspects are covered by an actual implementation.
