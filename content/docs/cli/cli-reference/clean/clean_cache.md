---
title: cache
name: clean cache
url: /docs/cli/cli-reference/clean/cache/
date: 2024-04-16T09:35:25+02:00
draft: false
images: []
toc: true
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

* [ocm clean](/docs/cli/cli-reference/clean)	 &mdash; Cleanup/re-organize elements

