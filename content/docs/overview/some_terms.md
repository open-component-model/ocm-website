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

As the Open Component Model revolves around components, it is essential to establish a common understanding of the fundamental terminology employed throughout this website. The following section provides concise definitions of key terms, laying the groundwork for the tutorials and documentation that follow.

If you want to deep-dive into every detailed aspect of the topic, check out the [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) and its [Glossary](https://github.com/open-component-model/ocm-spec/blob/main/doc/glossary.md).

## Components in OCM

The concept of a `Component` can vary widely, often defined with very specific views on granularity or other technical attributes. OCM takes a different approach, focusing on the intended purpose and overall meaning of components.

In OCM, *Components* group a set of semantically related `Component Versions`. Each *Component Version* is uniquely and globally identified by a `Component Identity` and can reference other *Components*. A *Component Version* can also contain `Artifacts` and a formal description on how to access them. These *Artifacts* come in two categories: `Resources`, which describe the payload (e.g., OCI images), and `Sources`, which describe the input for creating *Resources* (e.g., source code).

## OCM Coordinates

`OCM Coordinates` are used to reference *OCM Component Versions* and Artifacts within *OCM Component Versions*. Coordinates referring to an *OCM Component Version* are also called `Component Identity`, whereas relative coordinates referring to an artifact are called `Artifact Identity`. *Component Identities* are globally unique and may be used to refer to full Component Versions. *Artifact Identities* are always relative to an *Component Version* and may only be used in conjunction with a *Component Identity*.

In detail:

### Component Identity

- Component Name: Identifies a component. Should start with URL-prefix controlled by the owner of the component to avoid collisions.
- Component Version: If used with a Component name, identifies a specific Component Version.  Must adhere to "relaxed Semver" (major, minor (+optional patchlevel) - optional v-prefix).

### Artifact Identity

Within a Component Version, all artifacts *MUST* have a unique identity. Every Source Identity or Resource Identity always includes a `name` that is typically used to express the intended purpose.

Artifacts may also have additional `extraIdentity` attributes, that contribute to their identities. ExtraIdentity attributes are string-to-string maps.

### Examples

Assuming there is a component named `example.org/my-component`, with two versions `1.2.3` and `1.3.0`, declaring a resource with name `my-resource`, then the following OCM Coordinates can be used to reference different things:

- `example.org/my-component`: all versions of the component (1.2.3 + 1.3.0)
- `example.org/my-component:1.2.3`: version 1.2.3 of the component
- `example.org/my-component:1.2.3:resource/my-resource`: `my-resource` as declared by the component version
