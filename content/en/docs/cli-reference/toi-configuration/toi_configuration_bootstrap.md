---
title: bootstrap
name: toi_configuration bootstrap
url: /docs/cli/toi_configuration/bootstrap/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: toi_configuration
toc: true
isCommand: true
---
### Usage

```
ocm toi configuration bootstrap [<options>] {<component-reference>} {<resource id field>}
```

### Options

```
  -c, --credentials string   credentials file name (default "TOICredentials")
  -h, --help                 help for bootstrap
      --lookup stringArray   repository name or spec for closure lookup fallback
  -p, --parameters string    parameter file name (default "TOIParameters")
      --repo string          repository name or spec
```

### Description


If a TOI package provides information for configuration file templates/prototypes
this command extracts this data and provides appropriate files in the filesystem.

The package resource must have the type <code>toiPackage</code>.
This is a simple YAML file resource describing the bootstrapping of a dedicated kind
of software. See also the topic [ocm toi-bootstrapping](/docs/cli/toi-bootstrapping).

The first matching resource of this type is selected. Optionally a set of
identity attribute can be specified used to refine the match. This can be the
resource name and/or other key/value pairs (<code>&lt;attr>=&lt;value></code>).

If no credentials file name is provided (option -c) the file
<code>TOICredentials</code> is used. If no parameter file name is
provided (option -p) the file <code>TOIParameters</code> is used.

For more details about those files see [ ocm bootstrap package](/docs//cli/bootstrap/package).


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

\
If a component lookup for building a reference closure is required
the <code>--lookup</code>  option can be used to specify a fallback
lookup repository. By default, the component versions are searched in
the repository holding the component version for which the closure is
determined. For *Component Archives* this is never possible, because
it only contains a single component version. Therefore, in this scenario
this option must always be specified to be able to follow component
references.


### Examples

```

$ ocm toi bootstrap config ghcr.io/mandelsoft/ocm//ocmdemoinstaller:0.0.1-dev

```

### See Also

* [ocm toi configuration](/docs/cli/toi/configuration)	 &mdash; TOI Commands acting on config
* [ocm toi](/docs/cli/toi)	 &mdash; Dedicated command flavors for the TOI layer



##### Additional Help Topics

* [ocm toi configuration bootstrap <b>toi-bootstrapping</b>](/docs/cli/toi/configuration/bootstrap/toi-bootstrapping)	 &mdash; Tiny OCM Installer based on component versions

