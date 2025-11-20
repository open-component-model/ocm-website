---
title: "SSL Key Pairs in .ocmconfig File"
description: "How to generate and reference SSL key pairs in the OCM CLI configuration file."
url: "/docs/tutorials/keypairs-in-ocmconfig/"
icon: "🔑"
weight: 54
toc: true
---

> **⚠️ This document is deprecated**  
> This guide has been superseded by the comprehensive [Signing and Verification Deep Dive]({{< relref "signing-and-verification.md" >}}), which provides complete coverage of cryptographic signing, key management, trust models, and advanced configuration options.
>
> Please refer to the new guide for:
> - Detailed signing and verification workflows
> - Key pair generation best practices
> - Multi-environment configurations
> - Signer specifications and encoding policies
> - Enterprise PKI integration
>
> The content below is kept for reference but may be incomplete.

---

This section provides a look behind the scenes of how OCM handles keys, signatures, trust, and verification.
While the Getting Started sections focus on the simplest and most practical workflow,
this section explains some basics about key generation and configuration.

For comprehensive information, see the [Signing and Verification Deep Dive]({{< relref "signing-and-verification.md" >}}).

## Creating a keypair using OpenSSL

In both scenarios below, a private key (`private.key`) and a public key or certificate (`public.pem`) are created.

### Self-signed (recommended for development)
```bash
openssl genrsa -out private.key 4096
openssl rsa -in private.key -pubout -out public.pem
```

### CA-signed (recommended for production)
```bash
openssl genrsa -out private.key 4096
openssl req -new -key private.key -out request.csr
# Send request.csr to your CA and obtain public certificate public.pem
```

## Configure key pair in OCM config file

OCM supports both inline PEM and file-based PEM in the `.ocmconfig` file.
Use the files created above to copy the content or directly reference the files in the configuration.
**File-based configuration is much easier to maintain.**

Both, signing and verification configurations can be placed in the same `.ocmconfig` file.
In the examples below, we show them separately for clarity.

### For signing
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
              private_key_pem_file: ./keys/private.key
```
Inline PEM equivalent:
```yaml
private_key_pem: |
  -----BEGIN PRIVATE KEY-----
  ...
  -----END PRIVATE KEY-----
```

### For verification
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

Inline PEM equivalent:

```yaml
public_key_pem: |
  -----BEGIN PUBLIC KEY-----
  ...
  -----END PUBLIC KEY-----
```

## Certificate chains: CA-signed vs. self-signed

There are two fundamentally different public key scenarios:

### Self-signed public key
- Has **no issuer**, no certificate chain.
- OCM can only verify if the **exact same key** is provided in `.ocmconfig`.
- There is **no trust store validation**.

### CA-signed public certificate (with chain)
- Certificate contains:
    - Public key
    - Issuer
    - Optional chain (intermediate → root)
- When used with **PEM-encoded signatures** (EncodingPEM):
    - OCM validates the certificate chain against the **system trust store**
    - OCM may also use additional custom trust anchors provided via credentials
    - After successful chain validation, the **leaf public key** is used to verify the signature

## Signature encodings: EncodingPlain vs. EncodingPEM

The OCM RSA handler supports two encodings:

### EncodingPlain
- Signature contains **only** the raw signature bytes.
- **No certificates are included**.
- OCM must obtain the public key from `.ocmconfig`.
- Ideal for simple setups.

### EncodingPEM
- Signature contains:
    - Signature bytes
    - One or more **X.509 certificates** (certificate chain)
- OCM behavior:
    - Validates certificate chain against **system trust store** and/or trust anchors
    - Extracts public key from the validated leaf certificate
    - Uses that to verify the signature

This is used when you want CA-backed trust rather than key-pinning.
