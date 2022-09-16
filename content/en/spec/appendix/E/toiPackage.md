---
title: toiPackage
url: /spec/appendix/E/toiPackage
date: 2022-09-15 21:06:26.573695388 +0100 IST m=+0.009220731
draft: false
images: []
menu:
  spec:
toc: true
---
# `toiPackage` &#8212; Tiny OCM Installer Package

TOI is a small toolset on top of the [Open Component Model](../../../README.md).
It provides
a possibility to run images taken from a component version with user
configuration and feed them with the content of this component version.
It is some basic mechanism which can be used to execute simple installation
steps based on content described by the Open Component Model
(see https://github.com/gardener/ocm/docs/reference/ocm_toi-bootstrapping.md).

A TOI package is YAML resource describing the installation handling
for a dedicated software package based on one or more 
[`toiExecutor`](toiExecutor.md)s.
