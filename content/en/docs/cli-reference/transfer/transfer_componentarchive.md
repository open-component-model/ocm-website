---
title: componentarchive
name: transfer componentarchive
url: /docs/cli/transfer/componentarchive/
date: 2023-07-14T13:44:00Z
draft: false
images: []
menu:
  docs:
    parent: transfer
toc: true
isCommand: true
---
### Usage

```
ocm transfer componentarchive [<options>]  <source> <target>
```

### Options

```
  -h, --help          help for componentarchive
  -t, --type string   archive format (directory, tar, tgz) (default "directory")
```

### Description


Transfer a component archive to some component repository. This might
be a CTF Archive or a regular repository.
If the type CTF is specified the target must already exist, if CTF flavor
is specified it will be created if it does not exist.

Besides those explicitly known types a complete repository spec might be configured,
either via inline argument or command configuration file and name.

The <code>--type</code> option accepts a file format for the
target archive to use. The following formats are supported:
- directory
- tar
- tgz

The default format is <code>directory</code>.


### See Also

* [ocm transfer](/docs/cli/transfer)	 &mdash; Transfer artifacts or components

