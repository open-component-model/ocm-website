---
title: "How OCM Works"
description: "Learn what OCM can do for you."
icon: "💡"
weight: 10
toc: true
---

The Open Component Model (OCM) helps you securely deliver and deploy your software.

## The OCM toolset

- **OCM Format**: Allows you to describe your software artifacts and their lifecycle metadata in a consistent, technology-independent way
- [**OCM CLI**]({{<relref "/docs/reference/ocm-cli/">}}): Provides commands for interacting with OCM elements, helping you create OCM component versions and embed them in CI and CD processes
- [**OCM Controllers**]({{<relref "ocm-controllers">}}): Enable automated software deployment using OCM and Flux

## How OCM Works

[**OCM components**]({{<relref "components.md">}}) are the building blocks of OCM. They represent the artifacts of your delivery.

To [**create a component version**]({{<relref "create-component-version.md">}}), you need two things – a component descriptor file and an OCM repository.

The [component descriptor file]({{<relref "component-descriptor-example.md">}}) is a YAML file that contains the following information:

- Component identity (name and version)
- Provider information
- Resources (artifacts like container images, binaries, configuration)
- Sources (source code repositories, build inputs)
- References to other component versions
- Labels and extra identity attributes

After you have created a component descriptor file, you can use the OCM CLI to add a component version to an OCM repository.

OCM repositories are the home of OCM components. An OCM repository can be a repository in an Open Container Initiative (OCI) registry or a Common Transport Format (CTF) archive.

Once your component version is stored in an OCM repository, you can:

- **[Sign it]({{<relref "sign-component-version.md">}})** 
- **[Verify it]({{<relref "verify-component-version.md">}})**
- **Transfer it** to another OCM repository
- **[Deploy it]({{<relref "deploy-helm-chart.md">}})** with the OCM controllers

![OCM use cases](./ocm-uses-cases.png)

## Plugin System

Both the OCM CLI and OCM controllers support a plugin system for extensibility:

| Tool | Plugin Usage |
|--|--|
| CLI | Custom commands, repository types, input methods |
| Controllers | Custom repository backends, credential providers |

## Learn More

- Discover the [benefits of OCM]({{<relref "benefits">}}).
- [Create your first component version]({{<relref "create-component-version">}}).