---
title: get
name: ocm_plugins get
url: /docs/cli/ocm_plugins/get/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: ocm_plugins
toc: true
isCommand: true
---
### Usage

```
ocm ocm plugins get [<options>] {<plugin name>}
```

### Options

```
  -h, --help               help for get
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

* [ocm ocm plugins](/docs/cli/cli/plugins)	 &mdash; Commands related to OCM plugins
* [ocm ocm](/docs/cli/cli)	 &mdash; Dedicated command flavors for the Open Component Model

