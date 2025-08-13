---
title: get pubsub
name: pubsub
url: /docs/reference/ocm-cli/get/pubsub/
draft: false
images: []
weight: 55
toc: true
sidebar:
  collapsed: true
---
### Usage

```
ocm get pubsub {<ocm repository>}
```

### Options

```
  -h, --help               help for pubsub
  -o, --output string      output mode (JSON, json, yaml)
  -s, --sort stringArray   sort fields
```

### Description


A repository may be able to store a publish/subscribe specification
to propagate the creation or update of component versions.
If such an implementation is available and a specification is
assigned to the repository, it is shown. The specification
can be set with the [ocm set pubsub](/docs/reference/ocm-cli/set/pubsub/).


With the option <code>--output</code> the output mode can be selected.
The following modes are supported:
  - <code></code> (default)
  - <code>JSON</code>
  - <code>json</code>
  - <code>yaml</code>


### See Also

* [ocm get](/docs/reference/ocm-cli/get/)	 &mdash; Get information about artifacts and components

