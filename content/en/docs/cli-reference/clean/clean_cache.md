---
title: cache
name: clean cache
url: /docs/cli/clean/cache/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: clean
toc: true
isCommand: true
---
### Usage

```
ocm clean cache [<options>]
```

### Options

```
  -b, --before string   time since last usage
  -s, --dry-run         show size to be removed
  -h, --help            help for cache
```

### Description


Cleanup all blobs stored in oci blob cache (if given).
	

### Examples

```

$ ocm clean cache

```

### See Also

* [ocm clean](/docs/cli/clean)	 &mdash; Cleanup/re-organize elements

