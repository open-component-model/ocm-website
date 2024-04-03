---
title: create
name: oci_transportarchive create
url: /docs/cli/oci_transportarchive/create/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: oci_transportarchive
toc: true
isCommand: true
---
### Usage

```
ocm oci transportarchive create [<options>] <path>
```

### Options

```
  -f, --force         remove existing content
  -h, --help          help for create
  -t, --type string   archive format (directory, tar, tgz) (default "directory")
```

### Description


Create a new empty OCM/OCI transport archive. This might be either a directory prepared
to host artifact content or a tar/tgz file.


### See Also

* [ocm oci transportarchive](/docs/cli/oci/transportarchive)	 &mdash; Commands acting on OCI view of a Common Transport Archive
* [ocm oci](/docs/cli/oci)	 &mdash; Dedicated command flavors for the OCI layer

