---
title: "Sign Component Versions"
description: ""
lead: ""
date: 2023-03-13T09:38:41+01:00
lastmod: 2023-03-13T09:38:41+01:00
draft: false
images: []
weight: 27
toc: true
---

## Sign Component Versions

Sign component versions to ensure integrity along a transport chain.

Signing requires a key pair, a signature, and, optionally, an issuer, as well as an algorithm and a
name for the signature.

A component version can have multiple signatures with different names. A normalization of the
component version is used for signing. See [Signing Process and Normalization](https://github.com/open-component-model/ocm-spec/blob/main/doc/02-processing/03-signing-process.md) for more details.
Currently, only signing according to the
[RSA PKCS #1 v1.5 signature algorithm](https://datatracker.ietf.org/doc/html/rfc3447) is supported.

Create a key pair using the OCM CLI:

```shell
ocm create rsakeypair acme.priv
```

This will create two files. One named `acme.priv` for the private key and for convenience one named
`acme.pub` for the public key.

Use the `sign componentversion` command to sign a component version:

```shell
ocm sign componentversion --signature acme-sig --private-key=acme.priv ${OCM_REPO}//${COMPONENT}:${VERSION}
```

You can also sign a common transport archive before uploading to a component
repository:

```shell
ocm sign componentversion --signature acme-sig --private-key=acme.priv ctf-hello-world
```

```shell
applying to version "github.com/acme/helloworld:1.0.0"...
successfully signed github.com/acme/helloworld:1.0.0 (digest sha256:46615253117b7217903302d172a45de7a92f2966f6a41efdcc948023ada318bc)
```

<details><summary>What happened?</summary>

Digests will be created for all described artifacts and referenced component versions. Then for the
top-level component versions, the component-version digests are signed. The signature and digests are
stored in the component descriptor(s):

```shell
jq . ${CTF_ARCHIVE}/artifact-index.json
```

```shell
{
  "schemaVersion": 1,
  "artifacts": [
    {
      "repository": "component-descriptors/github.com/acme/helloworld",
      "tag": "1.0.0",
      "digest": "sha256:8c6b8c5a63a09d96d2a60b50adbd47f06b31be6e9d3e8618177c60fb47ec4bb2"
    }
  ]
}
```

Beside the digests of the component descriptor layer, nothing has changed:

```shell
jq . ${CTF_ARCHIVE}/blobs/sha256.8c6b8c5a63a09d96d2a60b50adbd47f06b31be6e9d3e8618177c60fb47ec4bb2
```

```shell
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": {
    "mediaType": "application/vnd.ocm.software.component.config.v1+json",
    "digest": "sha256:23225a4bfd2bacd575ec5317a25a0dd63702594f5859fbc3a4c4301453ac311a",
    "size": 201
  },
  "layers": [
    {
      "mediaType": "application/vnd.ocm.software.component-descriptor.v2+yaml+tar",
      "digest": "sha256:1f8c7801b2b35768b0eb9c919683ffcd0af24d8135beaccb7146af56cb2981d9",
      "size": 3584
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+tar+gzip",
      "digest": "sha256:2a958a5e8e9cca1b4e5b3cce510db9058f0117d09ce8c0981523230aa5d0e3d0",
      "size": 4714
    }
  ]
}
```

```shell
tar xvf ${CTF_ARCHIVE}/blobs/sha256.1f8c7801b2b35768b0eb9c919683ffcd0af24d8135beaccb7146af56cb2981d9 -O - component-descriptor.yaml
```

```shell
meta:
  schemaVersion: v2
component:
  name: github.com/acme/helloworld
  version: 1.0.0
  provider: acme.org
  resources:
  - access:
      localReference: sha256:2a958a5e8e9cca1b4e5b3cce510db9058f0117d09ce8c0981523230aa5d0e3d0
      mediaType: application/vnd.oci.image.manifest.v1+tar+gzip
      referenceName: github.com/acme/helloworld/echoserver:0.1.0
      type: localBlob
    digest:
      hashAlgorithm: sha256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 7b1614e9de1daee6334c91fce087e4365ee30f8f4da783ae81c27c6a81718b1d
    name: chart
    relation: local
    type: helmChart
    version: 1.0.0
  - access:
      imageReference: gcr.io/google_containers/echoserver:1.10
      type: ociArtifact
    digest:
      hashAlgorithm: sha256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: cb5c1bddd1b5665e1867a7fa1b5fa843a47ee433bbb75d4293888b71def53229
    name: image
    relation: external
    type: ociImage
    version: 1.0.0
  componentReferences: []
  repositoryContexts: []
  sources: []
signatures:
- digest:
    hashAlgorithm: sha256
    normalisationAlgorithm: jsonNormalisation/v1
    value: 023accb95490e1cf00926ddec95aadac599528bd987f6c1f0b5440c1bc51add3
  name: acme-sig
  signature:
    algorithm: RSASSA-PKCS1-V1_5
    mediaType: application/vnd.ocm.signature.rsa
    value: 6538f0f1ddb436008c4f82a84cfa92893e44cca1f2363f9da786ab632bca92f6498d912f2e4dfcdd9fa24078be83ba4f56851fa7b1235526c11cf5c9bd923676acaecb0e19f3996ac96a7334a4b4dcbf0b33479e90dd9500ea4fd5e914e17edb41c49ead6b92b313d1b79c612309b743399a2284f19a3e98c383122aa0045766394de700b8db96f4e69c6df2238c149660e5e4f8beaec45737a7ec2ddf36aa0c2042fce298c5ef2f823612229f013c147a19afe23fe81afe31200a3c2ad77485f8e9f8f01d5faba64c484b673e42a49082e1d20fb5c75616896007432e7f1b60da1591c756f4c6fab98f4125d13d7790adb41dd46717c67e92f2de6fb7c8a6c3
```

</details>

### Signing with Certificates

The public key from the last example cannot be validated. This can be changed by using a certificate
instead of a pure public key. The certificate is signed by a CA. This ensures the authenticity of the
described public key. Additionally, the common name of the certificate is validated against the issuer
attribute of the signature stored in the component descriptor.

To create a certificate, use the command:

```shell
ocm create rsakeypair --cacert ca.cert --cakey ca.priv CN=acme.org acme.priv
```

You can use additional attributes of the certificate like `O`, `OU` or `C`. See usage for details.
The certificate can be requested by any official certificate authority instead. It requires the usage types `x509.KeyUsageDigitalSignature` and `x509.ExtKeyUsageCodeSigning`.

For signing the component version you need to provide the issuer, then run:

```shell
ocm sign componentversion --signature acme-sig --private-key=acme.priv --issuer acme.org ${OCM_REPO}//${COMPONENT}:${VERSION}
```

Now the issuer will be stored along the signature and will be checked when verifying with the certificate
instead of the public key.

### Signature Verification

You can verify a signed component version. Therefore, a public or a certificate provided by the
signer is required. If a certificate is provided, it is validated according to its certificate chain.
If an official CA is used instead, you need the certificate of the used root CA.

To verify the signature of a component version, use:

```shell
ocm verify componentversions --signature acme-sig --public-key=acme.pub ctf-hello-world
```

```shell
applying to version "github.com/acme/helloworld:1.0.0"...
successfully verified github.com/acme/helloworld:1.0.0 (digest sha256:46615253117b7217903302d172a45de7a92f2966f6a41efdcc948023ada318bc)
```
