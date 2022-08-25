---
title: credentials
name: get credentials
url: /docs/cli/get/credentials/
date: 2022-08-24T18:41:47+01:00
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
ocm get credentials {<consumer property>=<value>}
```

### Description


Try to resolve a given consumer specification against the configured credential
settings and show the found credential attributes.

For the following usage contexts with matchers and standard identity matchers exist:

  - <code>OCIRegistry</code>: OCI registry credential matcher
    
    It matches the <code>OCIRegistry</code> consumer type and additionally acts like 
    the <code>hostpath</code> type.

  - <code>exact</code>: exact match of given pattern set

  - <code>hostpath</code>: Host and path based credential matcher
    
    This matcher works on the following properties:
    
    - *<code>hostname</code>* (required): the hostname of a server
    - *<code>port</code>* (optional): the port of a server
    - *<code>pathprefix</code>* (optional): a path prefix to match. The 
      element with the most matching path components is selected (separator is <code>/</code>).
    

  - <code>partial</code>: complete match of given pattern ignoring additional attributes


The used matcher is derived from the consumer attribute <code>type</code>.
For all other consumer types a matcher matching all attributes will be used.
The usage of a dedicated matcher can be enforced by the option <code>--matcher</code>.


### Options

```
  -h, --help             help for credentials
  -m, --matcher string   matcher type override
```

### See Also

* [ocm get](/docs/cli/get)	 &mdash; Get information about artefacts and components

