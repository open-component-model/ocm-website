---
title: pubsub
name: set pubsub
url: /docs/cli-reference/set/pubsub/
draft: false
images: []
weight: 55
toc: true
sidebar:
  collapsed: true
---
### Usage

```
ocm set pubsub {<ocm repository>} [<pub/sub specification>]
```

### Options

```
  -d, --delete   delete pub/sub configuration
  -h, --help     help for pubsub
```

### Description


A repository may be able to store a publish/subscribe specification
to propagate the creation or update of component versions.
If such an implementation is available this command can be used
to set the pub/sub specification for a repository.
If no specification is given an existing specification
will be removed for the given repository.
The specification
can be queried with the [ocm get pubsub](/docs/cli-reference/get/pubsub/).
Types and specification formats are shown for the topic
[ocm ocm-pubsub](/docs/cli-reference/help/ocm-pubsub/).


### See Also

* [ocm set](/docs/cli-reference/set/)	 &mdash; Set information about OCM repositories

