---
title: "Verify a Component Version"
url: "/docs/getting-started/verify-component-version/"
description: "Learn how to verify signed component versions using public keys."
icon: "🔍"
weight: 27
toc: true
---

Verifying a component version ensures that a signature was created by a trusted key and that the component descriptor has not been modified.  
This Getting Started section mirrors the workflow from [Sign a Component Version]({{< relref sign-component-version.md >}}),
assuming you already have access to the **public key** corresponding to the private key used for signing.

If you do not yet know how to generate key pairs, see the [SSL Key Pairs for Signing and Verification]({{< relref "key-pairs-and-ocmconfig.md" >}}) document.

## Minimal `.ocmconfig` for verification

To verify a signature, OCM needs a public key.  
We recommend referring to key files rather than embedding PEM blocks directly.

Add the following to your `.ocmconfig`:

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
              public_key_pem_file: ./keys/public.pem
```

**Explanation:**
- The properties below the `identity` field define the signing profile
    - `type` specifies the key type (here: RSA)
    - `algorithm` specifies the signing algorithm (here: RSASSA-PSS)
    - `signature` specifies the signature name (default is `default`)
- `public_key_pem_file` → path to a public key file in PEM format

## Verify a component version

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

## Verifying a specific signature name

If your component contains multiple signatures (e.g., `dev`, `prod`), you can explicitly choose a signature for verification.
Your .ocmconfig must contain the corresponding public key for that signature:

```bash
ocm verify cv transport-archive//github.com/acme.org/helloworld:1.0.0 --signature prod
```

OCM then selects the credentials associated with the `prod` profile.
