---
title: action
name: execute action
url: /docs/cli/execute/action/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: execute
toc: true
isCommand: true
---
### Usage

```
ocm execute action [<options>] <action spec> {<cred>=<value>}
```

### Options

```
  -h, --help             help for action
  -m, --matcher string   matcher type override
  -n, --name string      action name (overrides type in specification)
  -o, --output string    output mode (json, yaml) (default "json")
```

### Description


Execute an action extension for a given action specification. The specification
show be a JSON or YAML argument.

Additional properties settings can be used to describe a consumer id
to retrieve credentials for.


### Examples

```

$ ocm execute action '{ "type": "oci.repository.prepare/v1", "hostname": "...", "repository": "..."}'

```

### See Also

* [ocm execute](/docs/cli/execute)	 &mdash; Execute an element.

