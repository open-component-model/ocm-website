---
title: versions
name: show versions
url: /docs/cli/cli-reference/show/versions/
date: 2024-04-11T12:48:04+02:00
draft: false
images: []
toc: true
---
### Usage

```
ocm show versions [<options>] <component> {<version pattern>}
```

### Options

```
  -h, --help          help for versions
  -l, --latest        show only latest version
      --repo string   repository name or spec
  -s, --semantic      show semantic version
```

### Description


Match versions of a component against some patterns.


If the <code>--repo</code> option is specified, the given names are interpreted
relative to the specified repository using the syntax

<center>
    <pre>&lt;component>[:&lt;version>]</pre>
</center>

If no <code>--repo</code> option is specified the given names are interpreted 
as located OCM component version references:

<center>
    <pre>[&lt;repo type>::]&lt;host>[:&lt;port>][/&lt;base path>]//&lt;component>[:&lt;version>]</pre>
</center>

Additionally there is a variant to denote common transport archives
and general repository specifications

<center>
    <pre>[&lt;repo type>::]&lt;filepath>|&lt;spec json>[//&lt;component>[:&lt;version>]]</pre>
</center>

The <code>--repo</code> option takes an OCM repository specification:

<center>
    <pre>[&lt;repo type>::]&lt;configured name>|&lt;file path>|&lt;spec json></pre>
</center>

For the *Common Transport Format* the types <code>directory</code>,
<code>tar</code> or <code>tgz</code> is possible.

Using the JSON variant any repository types supported by the 
linked library can be used:

Dedicated OCM repository types:
  - <code>ComponentArchive</code>: v1

OCI Repository types (using standard component repository to OCI mapping):
  - <code>CommonTransportFormat</code>: v1
  - <code>OCIRegistry</code>: v1
  - <code>oci</code>: v1
  - <code>ociRegistry</code>


### Examples

```

$ ocm show versions ghcr.io/mandelsoft/cnudie//github.com/mandelsoft/playground

```

### See Also

* [ocm show](/docs/cli/cli-reference/show)	 &mdash; Show tags or versions

