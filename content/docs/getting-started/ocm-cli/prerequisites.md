---
title: "Prerequisites"
url: /docs/getting-started/prerequisites/
description: "What you need to get started with OCM"
icon: "⚠️"
weight: 21
toc: true
---

This and the following chapters walk you through some basic steps to get started with OCM concepts and the OCM CLI.

You will learn how to create a component version, display and examine the component, and download resources.

We will update the getting started guides with more actions, like signing, transfer and verification of components during the ongoing development of our new major release.

To follow the steps described in this section, you will need to:

## Install the Required Tools

Before you begin, make sure you have the following tools installed on your system:

- [Git](https://git-scm.com/) for cloning the OCM repository
- [Go](https://golang.org/) (version 1.24 or later)
- [Task](https://taskfile.dev/) build tool
- [jq](https://jqlang.org/) for processing JSON data

## Obtain Access to an OCM Repository

This can be any OCI registry for which you have write permission (e.g., GitHub Packages). An OCM repository based on an OCI registry is identified by a leading OCI repository prefix. For example: `ghcr.io/<YOUR-ORG>/ocm`.