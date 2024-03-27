---
title: transportarchive
name: create transportarchive
url: /docs/cli/create/transportarchive/
date: 2024-03-27T16:27:00Z
draft: false
images: []
menu:
  docs:
    parent: create
toc: true
isCommand: true
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

* [ocm create](/docs/cli/create)	 &mdash; Create transport or component archive

