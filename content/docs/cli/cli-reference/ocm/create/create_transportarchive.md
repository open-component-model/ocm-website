---
title: transportarchive
name: create transportarchive
url: /docs/cli/cli-reference/ocm/create/transportarchive/
date: 2024-04-16T15:24:23+02:00
draft: false
images: []
toc: true
sidebar:
  collapsed: true
---
### Usage

```
ocm create transportarchive [<options>] <path>
```

### Options

```
  -f, --force         remove existing content
  -h, --help          help for transportarchive
  -t, --type string   archive format (directory, tar, tgz) (default "directory")
```

### Description


Create a new empty OCM/OCI transport archive. This might be either a directory prepared
to host artifact content or a tar/tgz file.


### See Also

* [ocm create](/docs/cli/cli-reference/ocm/create)	 &mdash; Create transport or component archive

