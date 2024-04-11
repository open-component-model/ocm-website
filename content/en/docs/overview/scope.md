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

Operating software installations/products, both for cloud and on-premises, covers many aspects:

- How, when and where are the technical artifacts created?
- How are technical artifacts stored and accessed?
- Which technical artifacts are to be deployed?
- How is the configuration managed?
- How and when are compliance checks, scanning etc. executed?
- When are technical artifacts deployed?
- Where and how are those artifacts deployed?
- Which other software installations are required and how are they deployed and accessed?
- etc.

The overall problem domain has a complexity that makes it challenging to be solved as a whole.
However, the problem domain can be divided into two disjoint phases:

- production of technical artifacts
- deployment and lifecycle management of technical artifacts

The produced artifacts must be stored somewhere such that they can be accessed and collected for the deployment.
The OCM defines a standard to describe which technical artifacts belong to a software installation and how to
access them which could be used at the interface between production and the deployment/lifecycle management phase.

The OCM provides a common standard for the coupling of
- compliance checks
- security scanning
- code signing
- transport
- deployment or
- other lifecycle-management aspects
based on a well-defined description of software-artifacts, their types and the access to their physical content.

In that sense, the OCM provides the basis to
- exchange information about software in a controlled manner by defining a location- and technology-agnostic reference
  framework to identify software artifacts
- enable access to local technical artifacts via these IDs
- verify the authenticity of the artifact content found in an actual environment.

If software installations are described using the OCM, e.g. a scanning tool could use this to collect all technical
artifacts it needs to check and store findings under the globally unique and location-agnostic identities provided by the model.
This information can be stored along with the component versions and exchanged with other tools without loosing its meaning.
If the technical resources of different software installations are described with different
formalisms, such tools must provide interfaces and implementations for all if them and data exchange becomes a nightmare.

This problem becomes even harder if a software installation is build of different parts/components, each described with
another formalism. OCM allows a uniform definition of such compositions such that one consistent description of
a software installation is available.

The identity scheme provided by the OCM acts as some kind of Lingua Franca, enabling
a tool ecosystem to describe, store and exchange information even across environments without
loosing its meaning in relation to the described software artifacts and groupings.

The core OCM does not make any assumptions about the

- kinds of technical artifacts (e.g. docker images, helm chart, binaries etc., git sources)
- technology how to store and access technical artifacts (e.g. as OCI artifacts in an OCI registry)

OCM is a technology-agnostic specification and allows [implementations](https://github.com/open-component-model/ocm-spec/blob/main/doc/specification/extensionpoints/README.md) to provide support
for exactly those technical aspects as an extension of the basic model. The description formalism is even valid and can (at least partly)
formally processed, if not all specified aspects are covered by an actual implementation.
