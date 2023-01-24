---
title: cli-reference
name: cli-reference
url: /docs/cli/
date: 2023-01-24T12:26:09Z
draft: false
images: []
menu:
  docs:
    parent: cli-reference
toc: true
isCommand: false
---
### Options

```
  -X, --attribute stringArray   attribute setting
      --config string           configuration file
  -C, --cred stringArray        credential setting
  -h, --help                    help for ocm
      --logconfig string        log config
  -L, --logfile string          set log file
  -l, --loglevel string         set log level
  -v, --verbose                 enable verbose logging
      --version                 show version
```

### Introduction


The Open Component Model command line client support the work with OCM
artifacts, like Component Archives, Common Transport Archive,  
Component Repositories, and component versions.

Additionally it provides some limited support for the docker daemon, OCI artifacts and
registries.

It can be used in two ways:
- *verb/operation first*: here the sub commands follow the pattern *&lt;verb> &lt;object kind> &lt;arguments>*
- *area/kind first*: here the area and/or object kind is given first followed by the operation according to the pattern
  *[&lt;area>] &lt;object kind> &lt;verb/operation> &lt;arguments>*

The command accepts some top level options, they can only be given before the sub commands.

With the option <code>--cred</code> it is possible to specify arbitrary credentials
for various environments on the command line. Nevertheless it is always preferrable
to use the cli config file.
Every credential setting is related to a dedicated consumer and provides a set of
credential attributes. All this can be specified by a sequence of <code>--cred</code>
options. 

Every option value has the format

<center>
    <pre>--cred [:]&lt;attr>=&lt;value></pre>
</center>

Consumer identity attributes are prefixed with the colon (:). A credential settings
always start with a sequence of at least one identity attributes, followed by a
sequence of credential attributes.
If a credential attribute is followed by an identity attribute a new credential setting
is started.

The first credential setting may omit identity attributes. In this case it is used as
default credential, always used if no dedicated match is found.

For example:

<center>
    <pre>--cred :type=ociRegistry --cred hostname=ghcr.io --cred usename=mandelsoft --cred password=xyz</pre>
</center>

With the option <code>-X</code> it is possible to pass global settings of the 
form 

<center>
    <pre>-X &lt;attribute>=&lt;value></pre>
</center>

The value can be a simple type or a json string for complex values. The following
attributes are supported:
- <code>github.com/mandelsoft/oci/cache</code> [<code>cache</code>]: *string*

  Filesystem folder to use for caching OCI blobs

- <code>github.com/mandelsoft/ocm/compat</code> [<code>compat</code>]: *bool*

  Compatibility mode: Avoid generic local access methods and prefer type specific ones.

- <code>github.com/mandelsoft/ocm/keeplocalblob</code> [<code>keeplocalblob</code>]: *bool*

  Keep local blobs when importing OCI artifacts to OCI registries from <code>localBlob</code>
  access methods. By default they will be expanded to OCI artifacts with the
  access method <code>ociRegistry</code>. If this option is set to true, they will be stored
  as local blobs, also. The access method will still be <code>localBlob</code> but with a nested
  <code>ociRegistry</code> access method for describing the global access.

- <code>github.com/mandelsoft/ocm/ociuploadrepo</code> [<code>ociuploadrepo</code>]: *oci base repository ref*

  Upload local OCI artifact blobs to a dedicated repository.

- <code>github.com/mandelsoft/ocm/plugindir</code> [<code>plugindir</code>]: *plugin directory*

  Directory to look for OCM plugin executables.

- <code>github.com/mandelsoft/ocm/signing</code>: *JSON*

  Public and private Key settings given as JSON document with the following
  format:
  
  <pre>
  {
    "publicKeys"": [
       "&lt;provider>": {
         "data": ""&lt;base64>"
       }
    ],
    "privateKeys"": [
       "&lt;provider>": {
         "path": ""&lt;file path>"
       }
    ]
  </pre>
  
  One of following data fields are possible:
  - <code>data</code>:       base64 encoded binary data
  - <code>stringdata</code>: plain text data
  - <code>path</code>:       a file path to read the data from

- <code>github.com/mandelsoft/tempblobcache</code> [<code>blobcache</code>]: *string* Foldername for temporary blob cache

  The temporary blob cache is used to accessing large blobs from remote sytems.
  The are temporarily stored in the filesystem, instead of the memory, to avoid
  blowing up the memory consumption.

### See Also

* [ocm <b>add</b>](/docs/cli/add)	 &mdash; Add resources or sources to a component archive
* [ocm <b>clean</b>](/docs/cli/clean)	 &mdash; Cleanup/re-organize elements
* [ocm <b>create</b>](/docs/cli/create)	 &mdash; Create transport or component archive
* [ocm <b>describe</b>](/docs/cli/describe)	 &mdash; Describe artifacts
* [ocm <b>download</b>](/docs/cli/download)	 &mdash; Download oci artifacts, resources or complete components
* [ocm <b>get</b>](/docs/cli/get)	 &mdash; Get information about artifacts and components
* [ocm <b>show</b>](/docs/cli/show)	 &mdash; Show tags or versions
* [ocm <b>sign</b>](/docs/cli/sign)	 &mdash; Sign components
* [ocm <b>transfer</b>](/docs/cli/transfer)	 &mdash; Transfer artifacts or components
* [ocm <b>verify</b>](/docs/cli/verify)	 &mdash; Verify component version signatures

