---
title: "OCM v2: A Fresh Foundation for Secure Software Delivery"
description: "OCM v2 is a complete reboot — a new CLI, Kubernetes controllers, and Go library built from the ground up for modularity, security, and community."
date: 2026-03-30T10:00:00+01:00
contributors:
  - OCM Team
tags: ["release", "community", "v2", "supply-chain", "kubernetes"]
draft: false
slug: "ocmv2"
---

We are excited to announce **OCM v2** — a ground-up rebuild of the Open Component Model tooling stack. The new CLI, Kubernetes controllers, and Go library all live in a single monorepo at [github.com/open-component-model/open-component-model](https://github.com/open-component-model/open-component-model), designed from the start for modularity, security, and community contribution.

## Why a Reboot?

The original OCM libraries served the project well, but several issues made it clear that incremental fixes were not enough:

- **Supply chain concerns from monolithic design.** The legacy library's monolithic architecture meant that pulling in OCM pulled in everything — even parts you did not need. This created unnecessary supply chain exposure for consumers who only wanted a subset of functionality.
- **Contributability barriers.** The codebase was difficult for new contributors to navigate, understand, and extend. The high barrier to entry worked against our goal of building a community-driven project.
- **Extensibility and maintainability.** Adding new features cleanly or maintaining existing ones without risking regressions across unrelated areas became increasingly difficult.

OCM v2 is the result: a modular design, less coupled APIs, a smaller dependency footprint, and a codebase built for community contribution from day one. 

Learn more about the project's evolution in [About the OCM Project](/dev/docs/concepts/about-the-ocm-project/).

## What's in v2

All three pillars of the OCM tooling stack have been rebuilt and are released together.

### A New CLI

The v2 CLI implements the full **Pack, Sign, Transport, Deploy** workflow that OCM users rely on:

- **Pack** software artifacts into component versions — see [Create Component Versions](/dev/docs/getting-started/create-component-versions/)
- **Sign** component versions with RSA-based PKI signatures — see [Signing and Verification](/dev/docs/tutorials/signing-and-verification/)
- **Transport** components between registries, including reference transport and air-gapped delivery via CTF archives — see [Transfer and Transport](/dev/docs/concepts/transfer-and-transport/) and [Air-Gap Transfer](/dev/docs/how-to/transfer-components-across-an-air-gap/)
- **Deploy** applications from component versions using controllers — see [Deploy a Helm Chart](/dev/docs/getting-started/deploy-helm-charts/) and [OCM Controllers](/dev/docs/concepts/ocm-controllers/)

Here is a taste of how the CLI feels in practice:

```bash
# Create a component version from a constructor file
ocm add cv --file ./transport-archive component-constructor.yaml

# Sign it
ocm sign cv --signature release ghcr.io/acme.org/product:1.0.0

# Transfer to a CTF archive for air-gapped delivery
ocm transfer cv --copy-resources --recursive \
  ghcr.io/acme.org/product:1.0.0 \
  ctf::./airgap-transport.ctf

# Import into the target registry on the other side
ocm transfer cv --copy-resources --recursive \
  ctf::./airgap-transport.ctf//acme.org/product:1.0.0 \
  target-registry.internal

# Verify signatures survived the journey
ocm verify cv --signature release target-registry.internal//acme.org/product:1.0.0
```

Get started by [installing the CLI](/dev/docs/getting-started/install-the-ocm-cli/).

### Kubernetes Controllers

The new Kubernetes controllers bring GitOps-native deployment of OCM component versions to Kubernetes. The controller stack introduces three core custom resources that map directly to OCM concepts:

- **Repository** — points to an OCM repository and verifies reachability
- **Component** — references a Repository, downloads and verifies the component version descriptor
- **Resource** — resolves individual resources from a component version, verifies signatures, and publishes artifact locations for downstream consumers

Today, deployment orchestration is handled through [kro](https://kro.run) ResourceGraphDefinitions combined with [FluxCD](https://fluxcd.io/) as the deployer. A ResourceGraphDefinition wires the OCM resources together with Flux's HelmRelease or Kustomization resources, giving you a declarative, auditable deployment pipeline.

We are actively working on a **new deployment engine abstraction** that will simplify this further. The goal is to provide a streamlined, opinionated deployment experience directly within the OCM controller stack — reducing the number of moving parts while preserving the flexibility to plug in different deployers for advanced use cases. Stay tuned for more on this in the coming months.

Get started with the controllers:

- [OCM Controllers Concept](/dev/docs/concepts/ocm-controllers/) — understand the architecture
- [Set Up a Controller Environment](/dev/docs/getting-started/set-up-controller-environments/) — prepare a local Kubernetes cluster with kro and Flux
- [Deploy a Helm Chart](/dev/docs/getting-started/deploy-helm-charts/) — deploy your first application from a component version

### Go Library and Bindings

The new Go library provides clean, well-documented bindings for programmatic interaction with OCM. Because the library, CLI, and controllers all live in the same [monorepo](https://github.com/open-component-model/open-component-model), they share a single set of dependencies and are versioned together — eliminating the compatibility issues that could arise from separate release cycles.

The bindings are already seeing adoption across the [Apeiro](https://apeirora.eu/) ecosystem:

- **[Konfidence](https://github.com/search?q=org%3Akonfidence-project%20ocm.software&type=code)** — uses the OCM library for their Image Vector concept, managing container image references as first-class OCM resources
- **[Gardener](https://github.com/gardener/gardener-landscape-kit)** — building their new gitops tooling on top of the OCM bindings for component-based lifecycle management
- **[openMCP](https://github.com/open-component-model/service-provider-ocm)** — leveraging the library for bootstrap and delivery procedures across managed control planes via the OCM service provider
- **[Platform Mesh](https://github.com/search?q=org%3Aplatform-mesh%20ocm.software&type=code)** — integrating OCM into their delivery workflow for cross-platform artifact distribution

We are excited to see more projects adopt the bindings as the ecosystem grows and are welcoming everyone to contribute.

## Conformance Testing

The CLI and controllers are not tested in isolation. They are validated through **conformance scenarios** that exercise the entire product stack end-to-end.

The first conformance scenario is the [Sovereign Cloud Delivery](https://github.com/open-component-model/open-component-model/tree/main/conformance/scenarios/sovereign) scenario. It builds a product as OCM components, signs them, transfers them through a simulated air gap using CTF archives, imports them into an isolated cluster registry, and deploys them using OCM controllers. This validates that signatures, resources, and references survive the entire journey intact — across registry boundaries, network gaps, and into live Kubernetes environments.

This is just the beginning. We plan to add more conformance scenarios covering additional delivery patterns and integration points, ensuring that every release of the OCM stack meets a growing baseline of real-world validation.

## A Community-First Project

OCM v2 is not just a technical reboot — it is a community reboot. Since the adoption of OCM by [Neonephos](https://neonephos.org), we have established new governance structures and communication channels to make collaboration easier and more transparent.

### OCM Technical Steering Committee

The [OCM TSC](https://github.com/open-component-model/open-component-model/blob/main/docs/steering/CHARTER.md) operates as part of Neonephos and provides strategic oversight for the OCM project. It sets the technical direction, coordinates across SIGs, and ensures that the project evolves in alignment with the needs of its growing community.

### SIG Runtime

The [SIG Runtime](https://github.com/open-component-model/open-component-model/blob/main/docs/community/SIGs/Runtime/SIG-Runtime-CHARTER.md) is the primary governance body for the OCM runtime implementation. It oversees the development of the CLI, controllers, and library, ensuring that technical decisions are made openly and aligned with the broader project direction. Technical decisions are centrally tracked and aligned with the TSC via ADRs.

### How to Get Involved

There are multiple ways to participate in the OCM community:

- **Zulip Channel:** `neonephos-ocm-support` — primary communication channel
- **Mailing list:** [open-component-model-sig-runtime@lists.neonephos.org](mailto:open-component-model-sig-runtime@lists.neonephos.org)
- **Slack Channel** (Kubernetes Slack, deprecated): `#open-component-model-sig-runtime`
- **Docs and meeting notes:** under `docs/community/SIGs/Runtime/` in the [monorepo](https://github.com/open-component-model/open-component-model)

### SIG Spec and Community Specification License

Alongside the v2 release, we are planning the kickstart of **SIG Spec** — a dedicated special interest group for the OCM specification itself. SIG Spec will own the evolution of the specification, coordinate community input on proposals, and ensure the spec stays aligned with real-world implementation needs.

This goes hand in hand with the move to the [Community Specification License](https://github.com/open-component-model/ocm-project/issues/939), planned for Q2 2026. Together, SIG Spec and the license change make the specification a truly community-governed artifact — anyone can participate in its evolution under clear, fair terms.

## What's Coming Next

### Zero Trust Signing with Sigstore

We are working on [Sigstore integration](https://github.com/open-component-model/ocm-project/issues/556) for keyless signing and verification. This will complement the existing RSA-based PKI approach with a zero-trust model, removing the need to manage and distribute signing keys while providing the same level of provenance assurance.

### Expanding the Ecosystem

The v2 release is the foundation. Here is what we are building on top of it:

- **Apeiro integration:** Konfidence Image Vector System and openMCP Provider for enabling OCM APIs
- **Simpler deployment workflows** for Cloud Native Kubernetes environments
- **New integrations:** Examples include OCI Artifact Input Type and GitHub Source Support in the library
- **Language bindings beyond Go:** We are exploring bindings for other languages such as Python, broadening OCM's accessibility to a wider developer audience
- **Compliance tooling with ODG (Open Delivery Gear):** Deeper integration with ODG to streamline compliance workflows — automating security scans, license checks, and policy enforcement as part of the OCM delivery pipeline
- **Software Bill of Delivery:** OCM already provides the foundation for a true [Software Bill of Delivery (SBOD)](https://documentation.apeirora.eu/docs/best-practices/lcm/sbod/) — a comprehensive, machine-readable record of everything that was delivered, how it was built, signed, transported, and deployed. We are building on this vision to make SBOD a first-class concern across the entire toolchain

These improvements will steadily close the feature gap with our previous implementation, and we want to achieve parity.

## Documentation and Migration

The documentation site now serves two versions:

- **Legacy** — documentation for the original OCM stack. This is currently the default and the legacy stack will be supported until at least **the end of 2026**.
- **v2 docs** (currently labeled "dev") — documentation for the new stack you are reading about here.

**Migration should be affordable.** Many CLI commands are cross-compatible between legacy and v2. We made a deliberate effort to keep the `.ocmconfig` structure and command syntax consistent, so existing users and CI/CD pipelines should find the transition straightforward.

If you are new to OCM, start directly with the v2 docs. If you are an existing user, you can migrate at your own pace while the legacy stack remains fully supported.

## Get Started

Ready to try OCM v2? Pick your path:

{{< card-grid >}}
{{< link-card title="Get Started with the CLI" href="/dev/docs/getting-started/install-the-ocm-cli/" description="Install the OCM CLI and learn the Pack, Sign, Transport, Deploy workflow." >}}
{{< link-card title="Get Started with Controllers" href="/dev/docs/getting-started/set-up-controller-environments/" description="Set up a Kubernetes environment with OCM controllers, kro, and Flux." >}}
{{< /card-grid >}}

## Get Involved

OCM is open source and we welcome contributions of all kinds — code, documentation, bug reports, and feature requests.

- Browse the code and contribute: [github.com/open-component-model/open-component-model](https://github.com/open-component-model/open-component-model)
- Join the conversation on Zulip: `neonephos-ocm-support`
- Read the [SIG Runtime Charter](https://github.com/open-component-model/open-component-model/blob/main/docs/community/SIGs/Runtime/SIG-Runtime-CHARTER.md)
- Try the new CLI and [get started](/dev/docs/getting-started/)

We are looking forward to building the future of secure software delivery together.
