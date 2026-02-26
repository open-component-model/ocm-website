---
title: Reference
description: "Browse reference documentation for the OCM CLI, component descriptor schemas, and OCM controllers."
icon: "💾"
weight: 50
toc: true
sidebar:
  collapsed: true
---

This section contains reference documentation for the Open Component Model.

## Schemas

- [Component Descriptor Schema](component-descriptor-schema/) - JSON Schema for validating component descriptors

## Downloads

The following schemas are available for download and editor validation:

| Schema | Purpose | Description |
|--------|---------|-------------|
| [configuration-schema.yaml](/schemas/configuration-schema.yaml) | **Component Constructor Files** | Schema for `component-constructor.yaml` files (input for `ocm add componentversion`) |
| [component-descriptor-v2-schema.json](/schemas/component-descriptor-v2-schema.json) | **Component Descriptors** | Schema for component descriptor files (output artifacts stored in registries) |

### Usage

**For Component Constructor files:**
```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
```

**For Component Descriptor files:**
```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/component-descriptor-v2-schema.json
```
