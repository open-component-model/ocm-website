---
title: clean
name: cache clean
url: /docs/cli/cache/clean/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: cache
toc: true
isCommand: true
---
### Usage

```
ocm cache clean [<options>]
```

### Options

```
  -b, --before string   time since last usage
  -s, --dry-run         show size to be removed
  -h, --help            help for clean
```

### Description


Cleanup all blobs stored in oci blob cache (if given).
	

### Examples

```

$ ocm clean cache

```

### See Also

* [ocm cache](/docs/cli/cache)	 &mdash; Cache related commands

