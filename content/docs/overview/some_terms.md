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

If you right away want to deep-dive into the topic, you can have a look at the [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) and its [Glossary](https://github.com/open-component-model/ocm-spec/blob/main/doc/glossary.md).

## What’s a Component?

- Represents a conceptual entity that defines a specific usage context or semantic meaning for a particular software artifact or set of artifacts. The software artifacts are intended for a purpose and could be as small as a "hello world", or as complex as a business suite
- Is identified by a (globally) unique name
- Evolves over versions

## What’s a Component Version?

- Has a globally unique `Component Identity` (identity attributes `name` + `version`)
- Can have component references to other components (to build a component graph)
- Can have artifacts of kind `sources` and `resources`

## What's a Component Descriptor?

- Serialized form of a Component Version

## What's a Component Constructor

- A file that acts as input for the OCM CLI to construct one or multiple component version(s)

## What are Artifacts?

- Can be either of kind
  - `sources`: input for creating resources e.g. source code or
  - `resources`: contain the code to “do” something, e.g. OCI images, binaries, etc.
- Have a component-local `Artifact Identity` (identity attribute set consists of `name`, optional `extraIdentity` and optional `version`)
- Have a `type` (similar to a MIME-Type, current list is [here](https://github.com/open-component-model/ocm-spec/blob/main/doc/04-extensions/01-artifact-types/README.md))
- Have an exchangeable `access` (formal description how to retrieve an artifact, e.g. a download URL)

## What are OCM Coordinates?

OCM Coordinates are used to reference OCM Component Versions and artifacts within OCM Component Versions. Coordinates referring to an OCM Component Version are also called `Component Identity`, whereas relative coordinates referring to an artifact are called `Artifact Identity`. `Component Identities` are globally unique and may be used to refer to full Component Versions. `Artifact Identities` are always relative to an OCM Component Version and may only be used in conjunction with a Component Identity.

In detail:

### Component Identity

- Component Name: Identifies a component. Should follow conventions like DNS (start with URL-prefix controlled by the owner of the component)
- Component Version: If used with a Component name, identifies a specific Component Version.  Must adhere to "relaxed Semver" (major, minor (+optional patchlevel) - optional v-prefix).

### Artifact Identity

Within a Component Version, all artifacts *must* have a unique identity. The identity always includes:

- Kind: Artifacts are either `sources` or `resources`
- Name: A name, typically used to express the intended purpose

Artifacts may also have additional `extraIdentity` attributes, that contribute to their identities. ExtraIdentity attributes are string-to-string maps.

### Examples

Assuming there is a component named `example.org/my-component`, with two versions `1.2.3` and `1.3.0`, declaring a resource with name `my-resource`, then the following OCM Coordinates can be used to reference different things:

- `example.org/my-component`: all versions of the component (1.2.3 + 1.3.0)
- `example.org/my-component:1.2.3`: version 1.2.3 of the component
- `example.org/my-component:1.2.3:resource/my-resource`: `my-resource` as declared by the component version
