---
title: "Sign Component Versions"
url: "/docs/getting-started/sign-component-version/"
description: "Learn how to sign component versions using key pairs."
icon: "✍️"
weight: 26
toc: true
---

Signing ensures the **authenticity** and **integrity** of component versions in OCM.  

## Prerequisites

- [Install the OCM CLI]({{< relref "ocm-cli-installation" >}}).
- Get a key pair (private + public key). Don't have a key pair yet? Follow our guide: [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}).
- To follow the examples, you need the component version from the  guide [Create and Examine Component Versions]({{< relref "create-component-version.md" >}}).

## Minimal .ocmconfig for Signing

Add the following to your `.ocmconfig` file. If the file is present in your home directory (`~/.ocmconfig`), the OCM CLI will use it by default.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: default
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: "<path-to-your-private-key>"
```
Replace `<path-to-your-private-key>` with the corresponding path. If you followed the [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}) guide, you can use the path `~/.ocm/keys/dev/private.pem`.

The `identity` attributes define the consumer type for RSA signing:

- `type` must be `RSA/v1alpha1` for RSA-based signing.
- `algorithm` specifies the signing algorithm (`RSASSA-PSS` is recommended, `RSASSA-PKCS1V15` is legacy).
- `signature` specifies the signature name/label for this configuration (default is `default`).

The `credentials` properties contain the actual key material:

- `private_key_pem_file` is the path to a private key file in PEM format.

## Sign a Component Version

An `.ocmconfig` file can contain multiple signature profiles which can be specified during signing using the `--signature` option.  
If no signature is specified, the signature named `default` will be looked up in the `.ocmconfig` and used for signing.

Let's sign the component we created earlier in the [Create a Component Version]({{< relref "create-component-version.md" >}}) section,
assuming you used the default name for the CTF:

```bash
ocm sign cv /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0 --config <path-to-your-.ocmconfig>
```

This command signs the specified component version and stores the signature in the repository:

```yaml
digest:
  hashAlgorithm: SHA-256
  normalisationAlgorithm: jsonNormalisation/v4alpha1
  value: a7d15e55e5a9d6c988b73983270d04a33b1b133aa77bd486f4b22f052615fd90
name: default
signature:
  algorithm: RSASSA-PSS
  mediaType: application/vnd.ocm.signature.rsa.pss
  value: 57cfd281dc43fdba5d73547aed13226c2358b3bfbc6c600dd42e80144cb944faf4c...
```

When looking at the component descriptor, we can also see the new signature entry at the end of the descriptor:

```bash
ocm get cv /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0 -oyaml
```

```yaml
- component:
    componentReferences: null
    name: github.com/acme.org/helloworld
    provider: acme.org
    repositoryContexts: null
    resources:
    - access:
        localReference: sha256:f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2
        mediaType: text/plain; charset=utf-8
        type: localBlob/v1
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2
      name: mylocalfile
      relation: local
      type: blob
      version: 1.0.0
    - access:
        imageReference: ghcr.io/stefanprodan/podinfo:6.9.1@sha256:262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb
        type: ociArtifact
      digest:
        hashAlgorithm: SHA-256
        normalisationAlgorithm: genericBlobDigest/v1
        value: 262578cde928d5c9eba3bce079976444f624c13ed0afb741d90d5423877496cb
      name: image
      relation: external
      type: ociImage
      version: 1.0.0
    sources: null
    version: 1.0.0
  meta:
    schemaVersion: v2
  signatures:
  - digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v4alpha1
      value: a7d15e55e5a9d6c988b73983270d04a33b1b133aa77bd486f4b22f052615fd90
    name: default
    signature:
      algorithm: RSASSA-PSS
      mediaType: application/vnd.ocm.signature.rsa.pss
      value: 57cfd281dc43fdba5d73547aed13226c2358b3bfbc6c600dd42e8014...
```

## Replace an Existing Signature

In case you want to replace an existing signature, use the `--force` flag.
Otherwise you will get an error like `Error: signature "default" already exists`.

```bash
ocm sign cv /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0 --force
```

> ⚠️ Only overwrite signatures if you are sure no other process relies on the existing one.

## Multiple Signatures (Multi-Environment)

For multi-environment setups, you can use named signatures. Configure different keys in `.ocmconfig`:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: RSA/v1alpha1
          signature: dev
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: "<path-to-the-first-private-key>"
      
      - identity:
          type: RSA/v1alpha1
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: "<path-to-the-second-private-key>"
```

Replace `<path-to-the-first-private-key>` and `<path-to-the-second-private-key>` with the corresponding paths. If you followed the [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}) guide, you can use the following paths:

- `~/.ocm/keys/dev/private.pem` for the `dev` signature
- `~/.ocm/keys/prod/private.pem` for the `prod` signature

Then sign with the appropriate signature name:

```bash
# Sign for development
ocm sign cv --signature dev /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0

# Sign for production
ocm sign cv --signature prod /tmp/helloworld/transport-archive//github.com/acme.org/helloworld:1.0.0
```

See the [Multi-Environment Configuration]({{< relref "signing-and-verification.md#multi-environment-configuration" >}}) section for complete examples.

## Troubleshooting

For support with common issues, see the [Troubleshooting]({{< relref "/docs/tutorials/signing-and-verification#troubleshooting" >}})
section of the Signing and Verification guide.
