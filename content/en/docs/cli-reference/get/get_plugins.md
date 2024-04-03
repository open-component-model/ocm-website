---
title: plugins
name: get plugins
url: /docs/cli/get/plugins/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: get
toc: true
isCommand: true
---
### Usage

```
ocm get plugins [<options>] {<plugin name>}
```

### Options

```
  -h, --help               help for plugins
  -o, --output string      output mode (JSON, json, wide, yaml)
  -s, --sort stringArray   sort fields
```

### Description


Get lists information for all plugins specified, if no plugin is specified
all registered ones are listed.


With the option <code>--output</code> the output mode can be selected.
The following modes are supported:
  - <code></code> (default)
  - <code>JSON</code>
  - <code>json</code>
  - <code>wide</code>
  - <code>yaml</code>


### Examples

```

$ ocm get plugins
$ ocm get plugins demo -o yaml

```

### See Also

* [ocm get](/docs/cli/get)	 &mdash; Get information about artifacts and components

