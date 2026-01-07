---
title: "Verify Component Versions"
url: "/docs/getting-started/verify-component-version/"
description: "Learn how to verify signed component versions using public keys."
icon: "🔍"
weight: 27
toc: true
---

Verifying a component version ensures that a signature was created by a trusted key and that the component descriptor has not been modified.

## Prerequisites

- [Install the OCM CLI]({{< relref "ocm-cli-installation" >}}).
- Get a key pair (private + public key). Don't have a key pair yet? Follow our guide: [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}).
- To follow the examples, you need the component version from the  guide [Create and Examine Component Versions]({{< relref "signing-and-verification.md#key-pair-generation" >}}).

## Minimal .ocmconfig for Verification

To verify a signature, OCM needs a public key.  
We recommend referring to key files rather than embedding PEM blocks directly.

Add the following to your `.ocmconfig`. If the file is present in your home directory (`~/.ocmconfig`), the OCM CLI will use it by default.

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
              public_key_pem_file: "<path-to-your-public-key>"
```

Replace `<path-to-your-public-key>` with the corresponding path. If you followed the [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}) guide, you can use the path `~/.ocm/keys/dev/public.pem`.

The `identity` attributes define the consumer type for RSA verification:

- `type` must be `RSA/v1alpha1` for RSA-based verification.
- `algorithm` specifies the signing algorithm (`RSASSA-PSS` is recommended, `RSASSA-PKCS1V15` is legacy).
- `signature` specifies the signature name/label for this configuration (default is `default`).

The `credentials` properties contain the actual key material:

- `public_key_pem_file` is the path to a public key file in PEM format.

> 💡 Path Consistency: Use the same directory structure as for signing.  
> If you signed with `~/.ocm/keys/dev/private.key`, verify with `~/.ocm/keys/dev/public.pem`.

## Verify a Component Version

Assuming you created and signed a component version in the previous steps, you can verify it with:

```bash
ocm verify cv transport-archive//github.com/acme.org/helloworld:1.0.0
```

If the signature matches the public key specified in the `default` signature,
the OCM CLI prints a verification success message and exits with status code `0`.

```bash
time=2025-11-19T15:58:22.421+01:00 level=INFO msg="no resolvers configured, using component reference as resolver"
time=2025-11-19T15:58:22.421+01:00 level=INFO msg="Resolving credentials via repository" identity="path=transport-archive,type=OCIRepository" config=DockerConfig/v1(~/.docker/config.json)
time=2025-11-19T15:58:22.425+01:00 level=INFO msg="fetching descriptor" descriptor.mediaType=application/vnd.oci.image.manifest.v1+json descriptor.digest=sha256:a01d26fdfde80d01b725d92a2c6aefe0a34ec1a98935e8fae13b422e816054f0 descriptor.size=1418
time=2025-11-19T15:58:22.431+01:00 level=INFO msg="no verifier specification file given, using default RSASSA-PSS"
time=2025-11-19T15:58:22.431+01:00 level=INFO msg="verifying signature" name=default
time=2025-11-19T15:58:22.435+01:00 level=INFO msg="signature verification completed" name=default duration=4.287541ms
time=2025-11-19T15:58:22.435+01:00 level=INFO msg="SIGNATURE VERIFICATION SUCCESSFUL"
```

## Verify a Specific Signature Name

If your component contains multiple signatures (e.g., `dev`, `prod`), you can explicitly specify the signature for verification.
Your `.ocmconfig` must contain the corresponding public key for that signature. OCM then selects the credentials
associated with the specified signature.

```bash
# Verify specific signature
ocm verify cv --signature dev transport-archive//github.com/acme.org/helloworld:1.0.0
```

## Multiple Signatures (Multi-Environment)

For multi-environment setups with multiple different keys:

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
              public_key_pem_file: "<path-to-the-first-public-key>"
      
      - identity:
          type: RSA/v1alpha1
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              public_key_pem_file: "<path-to-the-first-public-key>"
```

Replace `<path-to-the-first-public-key>` and `<path-to-the-second-public-key>` with the corresponding paths. If you followed the [Key Pair Generation]({{< relref "signing-and-verification.md#key-pair-generation" >}}) guide, you can use the following paths:

- `~/.ocm/keys/dev/public.pem` for the `dev` signature
- `~/.ocm/keys/prod/cert-chain.pem` for the `prod` signature

Then verify the appropriate signature:

```bash
# Verify development signature
ocm verify cv --signature dev transport-archive//github.com/acme.org/helloworld:1.0.0

# Verify production signature
ocm verify cv --signature prod transport-archive//github.com/acme.org/helloworld:1.0.0
```

## Common Issues

**Verification fails?**

- Ensure the public key matches the signature.
- Check that you're verifying the correct signature name.
- Verify the component hasn't been modified after signing.

**Public key not found?**

- Check the file path in `public_key_pem_file` and the `signature` profile.

**Wrong signature name?**

- List signatures: `ocm get cv ... --signatures`.
- Use `--signature <name>` to specify the correct signature.

**Need more help?**

- See [Troubleshooting]({{< relref "/docs/tutorials/signing-and-verification#troubleshooting" >}}).
