---
title: functional
url: /spec/specification/extensionpoints/functional
date: 2022-09-15 21:06:26.578246248 +0100 IST m=+0.013771522
draft: false
images: []
menu:
  spec:
toc: true
---
# Functional Extension Points of the Open Component Model Specification

The specification is based on 4 basic functional extension points:
- The [storage backend technologies](../mapping/README.md) to use to store OCM
  elements (available
  mapping specifications can be found in [appendix A](../../appendix/A/README.md)).
- [Access to artifact content](../elements/README.md#artifact-access) using
  different storage technologies. This is described by types access
  specifications (types with available implementations can be found in
  [appendix B](../../appendix/B/README.md)).
- [Digest](../elements/README.md#digests) calculation for dedicated content
  technologies requiring digests different from standard byte sequence digests
  of artifact blobs (defined digest types can be found in
  [appendix C](../../appendix/C/README.md)).
- Defined [signing](../elements/README.md#signing) extensions can be found in
  [appendix D](../../appendix/D/README.md)).