---
title: "Component Descriptors"
description: ""
lead: ""
date: 2023-01-17T10:22:23Z
lastmod: 2023-01-17T10:22:23Z
draft: false
images: []
weight: 20
toc: false
---

The following is an example of a signed component descriptor containing a resource, source and one component reference. It uses the `v3alpha1` schema. There are no differences in the semantics between v2 and v3. "version" is used as kind of moniker for different serializing/deserializing formats (`v3` has the format of Kubernetes resources).

This component is publicly available and can be inspected using the following command:

```shell
ocm componentversion get --repo ghcr.io/phoban01/ocm github.com/weaveworks/weave-gitops --scheme v3alpha1 -oyaml
```

## Component Descriptor

```yaml
apiVersion: ocm.software/v3alpha1 # component schema version
kind: ComponentVersion
metadata:
  name: github.com/weaveworks/weave-gitops # name of the component
  provider: # component provider information
    name: weaveworks
  version: v1.0.0 # version of the component
repositoryContexts: # list of repository context the component version "lived" in, with the current one at the top
- baseUrl: ghcr.io
  componentNameMapping: urlPath
  subPath: phoban01/ocm
  type: OCIRegistry
spec:
  resources: # list of resources modelled by the component
  - name: image # resource name
    relation: external # resource location (external repository or internal to this repository)
    type: ociImage # resource type
    version: v0.14.1 # resource version
    access: # metadata describing how to access the resource
      type: ociArtifact # type of accesss information
      imageReference: ghcr.io/weaveworks/wego-app:v0.14.1 # oci image url
    digest: # signing metadata for the resource
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: efa2b9980ca2de65dc5a0c8cc05638b1a4b4ce8f6972dc08d0e805e5563ba5bb # the digest itself
  sources: # list of sources relevant to this component
  - name: weave-gitops # source name
    type: git # source type
    version: v0.14.1 # source version
    access: # metadata describing how to access the source
      type: gitHub #
      ref: refs/tags/v0.14.1
      repoUrl: github.com/weaveworks/weave-gitops
      commit: 727513969553bfcc603e1c0ae1a75d79e4132b58
  references: # list of references to other components
  - name: prometheus # reference name
    version: v1.0.0 # reference version
    componentName: cncf.io/prometheus # referenced component name
    digest: # signing metadata for the referenced resource
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v1
      value: 04eb20b6fd942860325caf7f4415d1acf287a1aabd9e4827719328ba25d6f801
signatures: # list of signatures used for signing and verification
- name: ww-dev # name of the signature
  digest: # digest of the signature including the algorithm used
    hashAlgorithm: SHA-256
    normalisationAlgorithm: jsonNormalisation/v1
    value: 4faff7822616305ecd09284d7c3e74a64f2269dcc524a9cdf0db4b592b8cee6a
  signature: # signature including the algorithm used
    algorithm: RSASSA-PKCS1-V1_5
    mediaType: application/vnd.ocm.signature.rsa
    value: 26468587671bdbd2166cf5f69829f090c10768511b15e804294fcb26e552654316c8f4851ed396f279ec99335e5f4b11cb043feb97f1f9a42115f4fda2d31ae8b481b7303b9a913d3a4b92d446fbee9ed487c93b09e513f3f68355040ec08454675e1f407422062abbd2681f70dd5488ad29020b30cfa7e001455c550458da96166bc3243c8426977d73352aface5323fb2b5a374e9c31b272a59c160b85631231c9fc2f23c032401b80fef937029a39111cee34470c61ae86cd4942553466411a5a116159fdcc10e50fe9360c5184028e72d1fe9c7315f26e15d7b4849f62d197501b8cc6b6f1b1391ecc2fc2fc0c1290d2554594505b25fa8f9bfb28c8df24
```
