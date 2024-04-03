---
title: toi
name: toi
url: /docs/cli/toi/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: cli-reference
toc: true
isCommand: true
---
### Usage

```
ocm toi [<options>] <sub command> ...
```

### Options

```
  -h, --help   help for toi
```

### Description


TOI is an abbreviation for (T)iny (O)CM (I)nstallation. It is a simple
application framework on top of the Open Component Model, that can
be used to describe image based installation executors and installation
packages (see topic [ocm toi bootstrapping](/docs/cli/toi/bootstrapping) in form of resources
with a dedicated type. All involved resources are hereby taken from a component
version of the Open Component Model, which supports all the OCM features, like
transportation.

The framework consists of a generic bootstrap command
([ocm toi bootstrap componentversions](/docs/cli/toi/bootstrap/componentversions)) and an arbitrary set of image
based executors, that are executed in containers and fed with the required
installation data by th generic command.


### See Also



##### Sub Commands

* [ocm toi <b>bootstrap</b>](/docs/cli/toi/bootstrap)	 &mdash; bootstrap components
* [ocm toi <b>configuration</b>](/docs/cli/toi/configuration)	 &mdash; TOI Commands acting on config
* [ocm toi <b>describe</b>](/docs/cli/toi/describe)	 &mdash; describe packages
* [ocm toi <b>package</b>](/docs/cli/toi/package)	 &mdash; TOI Commands acting on components



##### Additional Help Topics

* [ocm toi <b>bootstrapping</b>](/docs/cli/toi/bootstrapping)	 &mdash; Tiny OCM Installer based on component versions
* [ocm toi <b>ocm-references</b>](/docs/cli/toi/cli-references)	 &mdash; notation for OCM references

