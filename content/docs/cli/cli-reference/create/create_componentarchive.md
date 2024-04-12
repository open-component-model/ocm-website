---
title: componentarchive
name: create componentarchive
url: /docs/cli/cli-reference/create/componentarchive/
date: 2024-04-11T12:48:04+02:00
draft: false
images: []
toc: true
---
### Usage

```
ocm create componentarchive [<options>] <component> <version> --provider <provider-name> {--provider <label>=<value>} {<label>=<value>}
```

### Options

```
  -F, --file string            target file/directory (default "component-archive")
  -f, --force                  remove existing content
  -h, --help                   help for componentarchive
  -p, --provider stringArray   provider attribute
  -S, --scheme string          schema version (default "v2")
  -t, --type string            archive format (directory, tar, tgz) (default "directory")
```

### Description


Create a new component archive. This might be either a directory prepared
to host component version content or a tar/tgz file (see option --type).

A provider must be specified, additional provider labels are optional.


The <code>--type</code> option accepts a file format for the
target archive to use. The following formats are supported:
- directory
- tar
- tgz

The default format is <code>directory</code>.


If the option <code>--scheme</code> is given, the specified component descriptor format is used/generated.

The following schema versions are supported for explicit conversions:
  - <code>ocm.software/v3alpha1</code>
  - <code>v2</code> (default)


### Examples

```

$ ocm create componentarchive --file myfirst --provider acme.org --provider email=alice@acme.org acme.org/demo 1.0

```

### See Also

* [ocm create](/docs/cli/cli-reference/create)	 &mdash; Create transport or component archive

