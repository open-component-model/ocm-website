---
title: "Context"
description: ""
lead: ""
date: 2022-08-12T10:37:54+01:00
lastmod: 2022-08-12T10:37:54+01:00
draft: false
images: []
menu:
  docs:
    parent: ""
    identifier: "background"
weight: 100
toc: true
---

The definition, structure and management of software in larger enterprises often builds upon tools and processes, which
largely originate from former on-premise thinking and monolithic architectures. Development teams responsible for
solutions or services have built specific, often point-2-point integrations with CI/CD systems, compliance tools,
reporting dashboards or delivery processes in the past. Larger development teams might have even built their own
toolsets specifically for their products, including those needed for compliance handling and delivery automation.
These concepts, process integrations and resulting tools are often still in use today, even though everyone knows:
They don't fit into today's cloud world.

The result is a fragmented set of homegrown specific tools across products, solutions and services, affecting an
enterprises' ability to deliver software consistently and compliant to its own or customer operated target environments.
These specific, overly complex and thus hard to understand CI/CD pipelines, and the inability to instantly
provide a holistic aggregated view of currently running technical artifacts for each and every production environment
(including both cloud and on-premise), result in the overall management of software at scale becoming tedious, error-prone
and ineffective.

## Why is this a huge problem?

Most prominently, with the general un-alignment of how software is defined and managed,
it is not possible without additional overhead (like setting up even more processes and tools on top) to manage
the complete lifecycle of all solutions, services or individual deployment artifacts running in any
given landscape. Even worse, when trying to set up new landscapes, it becomes a nightmare to successfully orchestrate,
deploy and configure the needed software components in the new environments.

As long as individual development teams within a company continue to use their own tools and processes to manage the
lifecycle of the software they are responsible for, this unsatisfying (and finally TCD and TCO affecting) situation can
not improve and will only get worse over time.

## How can this improve?

The major problem at hand here is the absence of one aligned software component model, consistently used across the
enterprise, to manage compliant software components and their technical artifacts. Such
a model would help not only with streamlined deployments to public and private cloud environments, but also in various
other areas of lifecycle management like compliance processes and reporting. This software component model must describe
all technical artifacts of a software product, and establish an ID for each component, which should then consistently be
used across all lifecycle management tasks.

Here, it is also crucial to understand that setting up local environments often requires the use of artifacts stored local to the environment.
This is especially true for restricted or private clouds, in which it is usually not possible to access artifacts from
their original source location (due to restricted internet access), leading to the fact that artifacts need to be
transported into these environments. This local deployment scenario requires that software components must clearly
separate their ID from the location of their technical artifacts, so that this technical location may change, without
changing the ID. At the same time the environment-local location of the artifacts must be retrievable using this identity.

At its heart, the model has to be technology-agnostic, so that not only modern containerized cloud software,
but also legacy software is supported, out-of-the-box. It simply has to be acknowledged that companies are not able to
just drop everything that has been used in the past and solely use new cloud native workloads. This fact makes it
crucial to establish a common component model, which is able to handle both cloud native and legacy software, for which
it needs to be fully agnostic about the technology used.

Additionally, the model needs to be easily extensible. No one is able to
predict the future, apart from the fact that things will always change, especially in the area of IT. Being able to
adapt to future trends, without constantly affecting the processes and tools responsible for the core of the lifecycle
management of software, is a must.
