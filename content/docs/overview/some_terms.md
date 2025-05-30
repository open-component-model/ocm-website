---
title : "Important Terms"
description: "Key terms and definitions in the Open Component Model (OCM)"
icon: "🔤"
weight: 13
toc: true
---

As the Open Component Model (OCM) revolves around components, it is essential to establish a common understanding of the fundamental terminology employed throughout this website. The following section provides concise definitions of key terms, laying the groundwork for the documentation and tutorials that follow.

For a comprehensive exploration of every aspect of this topic, please refer to the OCM Specification [OCM Specification](https://github.com/open-component-model/ocm-spec/blob/main/README.md) and its [Glossary](https://github.com/open-component-model/ocm-spec/blob/main/doc/glossary.md).

## Components in OCM

The concept of a *Component* can vary widely, often defined with very specific views on granularity or other technical attributes. OCM takes a different approach, focusing on the intended purpose and overall meaning of components.

In OCM, Components group a set of semantically related *Component Versions*. Each Component Version is uniquely and globally identified by a *Component Identity* and can reference other Components. A Component Version can also contain *Artifacts* and a formal description on how to access them. These Artifacts come in two categories: `resources`, which describe the payload (e.g.,OCI images), and `sources`, which describe the input for creating `resources` (e.g., source code).

## OCM Coordinates

*OCM Coordinates* are used to reference OCM Component Versions and Artifacts within OCM Component Versions. Coordinates referring to an OCM Component Version are also called *Component Identity*, whereas relative Coordinates referring to an artifact are called *Artifact Identity*. Component Identities are globally unique and may be used to refer to full Component Versions. Artifact Identities are always relative to a Component Version and may only be used in conjunction with a Component Identity.

In detail:

### Component Identity

- Component Name: Identifies a component. Must start with URL-prefix that should be controlled by the owner of the component to avoid collisions.
- Component Version: If used with a Component name, identifies a specific Component Version. Must adhere to "relaxed SemVer" (major, minor (+ optional patch level) - optional v-prefix).

### Artifact Identity

Within a Component Version, all Artifacts must have a unique identity. Every Source Identity or Resource Identity always includes a `name` that typically expresses the intended purpose.

Artifacts may also have additional `extraIdentity` attributes that contribute to their identities. `extraIdentity` attributes are string-to-string maps.

### Examples

Assuming there is a component named `example.org/my-component` with two versions, `1.2.3` and `1.3.0`, declaring a resource with the name `my-resource`, the following OCM Coordinates can be used to reference different elements:

- `example.org/my-component`: all versions of the component (1.2.3 + 1.3.0)
- `example.org/my-component:1.2.3`: version 1.2.3 of the component
- `example.org/my-component:1.2.3:resource/my-resource`: `my-resource` as declared by the component version
