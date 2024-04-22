---
title : "Important Terms"
description: "Some important terms used in OCM"
lead: ""
date: 2020-10-06T08:48:23+00:00
lastmod: 2020-10-06T08:48:23+00:00
draft: false
weight: 13
toc: true
images: []
---

As the open component model revolves around components, it is essential to establish a common understanding of the fundamental terminology employed throughout this website. The following section provides concise definitions of key terms, laying the groundwork for the tutorials and documentation that follow.

If you right away want to deep-dive into the topic, you can have a look at the [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) and its [Glossary](https://github.com/open-component-model/ocm-spec/blob/main/doc/glossary.md)

## What’s a Component?

- Represents a conceptual entity that defines a specific usage context or semantic meaning for a particular software artifact or set of artifacts. The software artifacts are intended for a purpose and could be as small as a "hello world", or as complex as a business suite
- Is identified by a (globally) unique name
- Evolves over versions

## What’s a Component Version?

- Has an identity (name + version)
- Can have component references to other components (to build a component graph)
- Has artifacts (`sources` and `resources`)

## What's a Component Descriptor?

- Serialized form of a Component Version

## What's a Component Constructor

- A file that acts as input for the OCM CLI to construct one or multiple component version(s)

## What are Artifacts?

- `Sources`: input for creating resources e.g. source code
- `Resources`: contain the code to “do” something, e.g. OCI Images, binaries, etc.
- Have a component-local identity (name and version)
- Have a `Type` (similar to a MIME-Type)
- Have an exchangeable `Access` (formal description how to retrieve an artifact, e.g. a download URL)
