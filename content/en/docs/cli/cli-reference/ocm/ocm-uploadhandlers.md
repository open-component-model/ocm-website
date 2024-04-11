---
title: ocm-uploadhandlers
name: ocm-uploadhandlers
url: /docs/cli/cli-reference/ocm-uploadhandlers/
date: 2024-04-11T12:48:04+02:00
draft: false
images: []
toc: true
---
### Description


An upload handler is used to process resources using the access method
<code>localBlob</code> transferred into an OCM
repository. They may decide to store the content in some other 
storage repository. This may be an additional storage location or it
may replace the storage of the resource as local blob.
If an additional storage location is chosen, the local access method
is kept and the additional location can be registered in the component
descriptor as <code>globalAccess</code> attribute of the local access
specification.

For example, there is a default upload handler responsible for OCI artifact
blobs, which provides regular OCI artifacts for a local blob, if
the target OCM repository is based on an OCI registry. Hereby, the
<code>referenceName</code> attribute will be used to calculate a
meaningful OCI repository name based on the repository prefix
of the OCM repository (parallel to <code>component-descriptors</code> prefix
used to store the component descriptor artifacts).

### Handler Registration 

Programmatically any kind of handlers can be registered for various
upload conditions. But this feature is available as command-line option, also.
New handlers can be provided by plugins. In general available handlers,
plugin-based or as part of the CLI coding are nameable using an hierarchical
namespace. Those names can be used by a <code>--uploader</code> option
to register handlers for various conditions for CLI commands like
[ocm transfer componentversions](/docs/cli/cli-reference/transfer/componentversions) or [ocm transfer commontransportarchive](/docs/cli/cli-reference/transfer/commontransportarchive).

Besides the activation constraints (resource type and media type of the
resource blob), it is possible to pass a target configuration controlling the
exact behaviour of the handler for selected artifacts.

The following handler names are possible:
  - <code>ocm/ociArtifacts</code>: downloading OCI artifacts
    
    The <code>ociArtifacts</code> downloader is able to download OCI artifacts
    as artifact archive according to the OCI distribution spec.
    The following artifact media types are supported:
      - <code>application/vnd.oci.image.manifest.v1+tar</code>
      - <code>application/vnd.oci.image.manifest.v1+tar+gzip</code>
      - <code>application/vnd.oci.image.index.v1+tar</code>
      - <code>application/vnd.oci.image.index.v1+tar+gzip</code>
      - <code>application/vnd.docker.distribution.manifest.v2+tar</code>
      - <code>application/vnd.docker.distribution.manifest.v2+tar+gzip</code>
      - <code>application/vnd.docker.distribution.manifest.list.v2+tar</code>
      - <code>application/vnd.docker.distribution.manifest.list.v2+tar+gzip</code>
    
    By default, it is registered for these mimetypes.
    
    It accepts a config with the following fields:
      - <code>namespacePrefix</code>: a namespace prefix used for the uploaded artifacts
      - <code>ociRef</code>: an OCI repository reference
      - <code>repository</code>: an OCI repository specification for the target OCI registry
    
    Alternatively, a single string value can be given representing an OCI repository
    reference.

  - <code>plugin</code>: [downloaders provided by plugins]
    
    sub namespace of the form <code>&lt;plugin name>/&lt;handler></code>

  - <code>ocm/npmPackage</code>: uploading npm artifacts
    
    The <code>ocm/npmPackage</code> uploader is able to upload npm artifacts
    as artifact archive according to the npm package spec.
    If registered the default mime type is: application/x-tgz
    
    It accepts a plain string for the URL or a config with the following field:
    'url': the URL of the npm repository.



See [ocm ocm-uploadhandlers](/docs/cli/cli-reference/ocm-uploadhandlers) for further details on using
upload handlers.


### See Also


