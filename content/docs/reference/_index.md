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

- [Component Descriptor Schema]({{< relref "component-descriptor-schema.md" >}}) - JSON Schema for validating component descriptors

## Downloads

The following schemas are available for download:

| Schema | Purpose | Use For |
|--------|---------|---------|
| [configuration-schema.yaml](/schemas/configuration-schema.yaml) | **Component Constructor Files** | Creating component versions with `ocm add componentversion` |
| [component-descriptor-v2-schema.json](/schemas/component-descriptor-v2-schema.json) | **Component Descriptors** | Validating output artifacts, API development, debugging |

### Editor Integration for Constructor Files

Add this to the top of your `component-constructor.yaml` for validation and autocompletion:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
```
