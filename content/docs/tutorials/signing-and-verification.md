---
title: "Signing and Verification"
description: "Complete guide to cryptographic signing and verification in OCM."
url: "/docs/tutorials/signing-and-verification"
icon: "✍️"
weight: 55
toc: true
---

## Overview

The Open Component Model provides cryptographic signing and verification capabilities
to establish **provenance** and **authenticity** of component versions.
This guide covers the complete signing and verification workflow, from key pair generation to trust model selection.

**This guide is for users who want to:**

- Understand how OCM handles component signing and verification
- Learn about supported signature types
- See step-by-step signing and verification examples
- Plan multi-environment workflows with dedicated signing profiles (dev/staging/prod)
- Understand how signer specifications and encoding policies complement `.ocmconfig`

## Signing and Verification Workflow

### High-Level Process

A side-by-side comparison makes it clear how both flows mirror the same normalization and hashing steps while differing only in credential handling.

### Workflow Comparison

| Step | Signing Flow | Verification Flow |
|------|--------------|-------------------|
| 1 | Resolve signing credentials from `.ocmconfig` or signer spec | Resolve signature by name and load public key/certificate (config, CLI flag, or embedded PEM) |
| 2 | Normalize component descriptor (selected algorithm) | Normalize component descriptor with the same algorithm |
| 3 | Hash normalized descriptor (selected hash) | Hash normalized descriptor and compare against signature digest |
| 4 | Produce signature, store it with descriptor metadata | Verify signature (and certificate chain if PEM) |

### What Gets Signed?

OCM signs the **component descriptor**, which contains:

- Component metadata (name, version, provider)
- Resources (artifacts like container images, Helm charts)
- Sources (references to source code)
- References to other components
- **Resource digests** (cryptographic hashes of artifacts)

**Important:** OCM does **not** sign the artifacts themselves, but rather their digests in the component descriptor. This provides:

- ✅ Efficient verification (no external dependencies)
- ✅ Tamper detection (any change to artifacts invalidates the signature)
- ✅ Provenance (signature proves who created/released the component version)

## Key Pair Generation (Optional)

> **Already have RSA key pairs?** Skip to [Configuring Keys in an .ocmconfig File](#configuring-keys-in-an-ocmconfig-file).

This section covers general RSA key pair generation and management. If you already have suitable RSA keys (self-signed or CA-signed), you can use them directly with OCM and skip to the configuration section.

### Choose Your Approach

Before generating keys, decide which approach fits your needs:

| Your Situation | Recommended Approach |
|----------------|---------------------|
| Local development or testing | **Self-Signed Keys** |
| Production environment | **CA-Signed Keys** |
| Enterprise/Multi-organization | **CA-Signed Keys** |
| Compliance requirements | **CA-Signed Keys** |

### Self-Signed vs. CA-Signed

**Self-Signed Keys:**

- Simple to create (no external CA required)
- Full control over key lifecycle
- Trust based on explicit key distribution
- Public key must be manually distributed to verifiers

**CA-Signed Certificates:**

- Requires Certificate Authority (CA)
- Certificate chain validates against trusted root CAs
- Trust leverages existing PKI
- Automatic trust propagation via certificate validation

## Key Pair Generation

OCM supports **RSA** signatures with two algorithms:

- **RSASSA-PSS** - Default and recommended
- **RSASSA-PKCS1v15** - Legacy support

### Directory Structure Setup

First, create a consistent directory structure for your keys. This guide uses the following convention:

```bash
# Create a directory for your OCM keys
mkdir -p ~/.ocm/keys

# Recommended structure:
# ~/.ocm/keys/
#   ├── dev/          # Development keys
#   ├── staging/      # Staging keys
#   └── prod/         # Production keys
```

Throughout this guide, we'll use this structure and reference files with their full paths.

### Self-Signed Keys (Development)

Self-signed keys are ideal for development, testing, and environments without PKI infrastructure.

#### Generate Development Keys

```bash
# Create directory for development keys
mkdir -p ~/.ocm/keys/dev

# Generate private key (4096 bits recommended)
openssl genrsa -out ~/.ocm/keys/dev/private.key 4096

# Extract public key
openssl rsa -in ~/.ocm/keys/dev/private.key -pubout -out ~/.ocm/keys/dev/public.pem

# Set secure permissions
chmod 600 ~/.ocm/keys/dev/private.key
chmod 644 ~/.ocm/keys/dev/public.pem
```

**Files created:**

- `~/.ocm/keys/dev/private.key` - Private key (4096 bits)
- `~/.ocm/keys/dev/public.pem` - Public key

### CA-Signed Keys (Production)

CA-signed certificates provide a trust chain that can be validated against a certificate authority.
They are recommended for production environments, enterprise deployments,
and scenarios requiring PKI integration or compliance.

#### Generate Production Keys with CSR

```bash
# Create directory for production keys
mkdir -p ~/.ocm/keys/prod

# Generate private key
openssl genrsa -out ~/.ocm/keys/prod/private.key 4096

# Create certificate signing request (CSR)
openssl req -new -key ~/.ocm/keys/prod/private.key \
  -out ~/.ocm/keys/prod/request.csr \
  -subj "/C=US/O=MyOrg/OU=Engineering/CN=OCM Production Signer"

# Set secure permissions
chmod 600 ~/.ocm/keys/prod/private.key
chmod 644 ~/.ocm/keys/prod/request.csr

# Send request.csr to your CA and save the response
# After receiving from CA, save as:
#   ~/.ocm/keys/prod/certificate.pem
#   ~/.ocm/keys/prod/ca-chain.pem (if provided)
```

**Files created:**

- `~/.ocm/keys/prod/private.key` - Private key (4096 bits)
- `~/.ocm/keys/prod/request.csr` - Certificate signing request (send to CA)

**Files received from CA:**

- `~/.ocm/keys/prod/certificate.pem` - Signed certificate
- `~/.ocm/keys/prod/ca-chain.pem` - CA certificate chain (optional but recommended)

#### Create Certificate with Chain

If you receive individual certificates, combine them into a chain:

```bash
# Combine leaf certificate with intermediate and root CA certificates
cat ~/.ocm/keys/prod/certificate.pem \
    ~/.ocm/keys/prod/intermediate-ca.pem \
    ~/.ocm/keys/prod/root-ca.pem \
    > ~/.ocm/keys/prod/cert-chain.pem

chmod 644 ~/.ocm/keys/prod/cert-chain.pem
```

## Configuring Keys in an .ocmconfig File

OCM uses its credential system to resolve signing and verification keys.
The keys are configured as credentials for a special consumer type: `RSA/v1alpha1`.

> **Using your own keys?** Simply reference your existing key file paths in the configuration examples below instead of the `~/.ocm/keys/` paths shown here.

All examples below use the **exact file paths** from the key generation section above.

> **Tip:** Add the entries below to your `.ocmconfig`. If the file is present in your home directory (`~/.ocmconfig`), the OCM CLI will use it automatically. Only provide `--config <path>` when you want to reference a different configuration file.

### Basic Signing Configuration (Development)

Using the development keys we created earlier:

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
              private_key_pem_file: ~/.ocm/keys/dev/private.key
```

**Note:** This references `~/.ocm/keys/dev/private.key` which we created with the OpenSSL command in the previous section.

> **Alternative:** Keys can also be embedded inline using `private_key_pem` property.
> The inline format uses a multi-line YAML string with the PEM block.

### Basic Verification Configuration (Development)

Using the public key we generated earlier:

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
              public_key_pem_file: ~/.ocm/keys/dev/public.pem
```

**Note:** This configuration references `~/.ocm/keys/dev/public.pem` which was extracted from the private key using OpenSSL.

### Identity Attributes Explained

The consumer identity for RSA signing/verification supports these attributes:

| Attribute   | Required | Description                                                      |
|-------------|----------|------------------------------------------------------------------|
| `type`      | Yes      | Must be `RSA/v1alpha1`                                           |
| `algorithm` | No       | `RSASSA-PSS` (default) or `RSASSA-PKCS1V15` (legacy)             |
| `signature` | No       | Name/label for this signature configuration (default: `default`) |

The `signature` attribute is particularly useful for multi-environment setups.

## Multi-Environment Configuration

> **Optional (advanced):** Skip this section if you operate a single environment. You can continue with [Signer Specifications](#signer-specifications) without missing any required setup.

In many organizations, you'll want different signing keys for different environments or purposes.

For multiple environments, generate separate keys using the same process:

- **Development:** Self-signed keys (see [Self-Signed Keys](#self-signed-keys-development) section)
- **Staging:** Self-signed keys in `~/.ocm/keys/staging/` (same process)
- **Production:** CA-signed keys (see [CA-Signed Keys](#ca-signed-keys-production) section)

### Combined Configuration Example

This example shows a complete `.ocmconfig` with signing and verification keys for all environments:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      # Development environment
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: dev
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/dev/private.key
              public_key_pem_file: ~/.ocm/keys/dev/public.pem

      # Staging environment
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: staging
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/staging/private.key
              public_key_pem_file: ~/.ocm/keys/staging/public.pem

      # Production environment (CA-signed with certificate chain)
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/prod/private.key
              public_key_pem_file: ~/.ocm/keys/prod/cert-chain.pem
```

**Notes:**

- Each environment has both private and public keys
- Production uses the certificate chain for verification
- The same configuration works for both signing and verification

### Usage Examples

**Signing:**

```bash
# Sign with development key
ocm sign cv --signature dev ghcr.io/myorg/component:1.0.0

# Sign with staging key
ocm sign cv --signature staging ghcr.io/myorg/component:1.0.0

# Sign with production key
ocm sign cv --signature prod ghcr.io/myorg/component:1.0.0
```

**Verification:**

```bash
# Verify with development key
ocm verify cv --signature dev ghcr.io/myorg/component:1.0.0

# Verify with staging key
ocm verify cv --signature staging ghcr.io/myorg/component:1.0.0

# Verify with production key
ocm verify cv --signature prod ghcr.io/myorg/component:1.0.0
```

### Verification-Only Configuration

If you only need to verify signatures (e.g., on CI/CD runners or deployment systems), you can omit the private keys:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: RSA/v1alpha1
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              # Only public key needed for verification
              public_key_pem_file: ~/.ocm/keys/prod/cert-chain.pem
```

**Note:** This configuration contains only the public key. Verification works, but signing operations will fail (as intended for read-only environments).

## Signer Specifications

> **Optional (advanced):** If you do not need per-command overrides or CI-friendly specs, skip ahead to [Signature Encoding Policies](#signature-encoding-policies). Core functionality continues there.

The `--signer-spec` flag provides fine-grained control over the signing process via a YAML configuration file.

### When to Use Signer Specs

Use signer specifications when you need:

- ✅ Command-specific signing config
- ✅ CI/CD pipeline integration
- ✅ Explicit control over signing parameters
- ✅ Different encoding policies
- ✅ Temporary or one-off signing operations

**Signer specs vs. .ocmconfig:**

| Aspect              | Signer Spec File         | .ocmconfig               |
|---------------------|--------------------------|--------------------------|
| Scope               | Command-specific         | Global configuration     |
| Portability         | Easy to version control  | User/machine-specific    |
| Use case            | CI/CD, explicit control  | Local development        |
| Key distribution    | Embedded or referenced   | Centralized config       |

### Signer Spec File Format

A signer specification file contains only signing configuration, **not** the signature name (which is provided via `--signature` flag).

```yaml
type: RSA/v1alpha1
signatureAlgorithm: RSASSA-PSS  # or RSASSA-PKCS1V15
signatureEncodingPolicy: Plain  # or PEM

# Option 1: Reference external file (preferred)
privateKeyPEMFile: ~/.ocm/keys/dev/private.key

# Option 2: Inline private key
# privateKeyPEM: |
#   -----BEGIN PRIVATE KEY-----
#   ...
#   -----END PRIVATE KEY-----
```

**Note:** The **signature name** is specified via the `--signature` flag when running the command, not in this file.

### Default Signer Spec Behavior

If `--signer-spec` is **not** provided, OCM uses defaults:

```yaml
type: RSA/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: Plain
# Private key resolved from .ocmconfig
```

This means:

- Algorithm: RSASSA-PSS
- Encoding: Plain (raw signature bytes)
- Key: Retrieved from `.ocmconfig` config file

### Example: Using Signer Spec in CI/CD

**signer-config.yaml:**

```yaml
type: RSA/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: Plain
privateKeyPEMFile: /secrets/signing-key.pem
```

**CI/CD pipeline:**

```bash
# Inject private key into CI/CD secrets
echo "$SIGNING_PRIVATE_KEY" > /secrets/signing-key.pem
chmod 600 /secrets/signing-key.pem

# Sign component version
ocm sign cv \
  --signer-spec ./signer-config.yaml \
  --signature release \
  ghcr.io/myorg/component:${VERSION}
```

## Signature Encoding Policies

> **Optional (advanced):** Readers who only work with the default signing setup can skip directly to [Signing Component Versions](#signing-component-versions). The sections below cover advanced storage and trust scenarios.

OCM supports two encoding policies that affect how signatures are stored and verified.

### Plain Encoding (Default)

Stores only the raw signature bytes. Compact but requires the public key to be provided separately (via `.ocmconfig` or `--public-key` flag).

**Configuration:**

```yaml
type: RSA/v1alpha1
signatureEncodingPolicy: Plain
```

Suitable for self-signed keys and scenarios where public keys are distributed through `.ocmconfig`.

### PEM Encoding

Embeds the certificate chain directly in the signature, enabling verification against the system trust store without requiring public keys in `.ocmconfig`.

**Configuration:**

```yaml
type: RSA/v1alpha1
signatureEncodingPolicy: PEM
```

**How it works:**

1. Creates a PEM block containing the signature
2. Appends the signer's certificate chain
3. During verification, validates the chain against the system trust store
4. Extracts the public key from the validated certificate

**Requirements:**

- Signature name must match the config
- Certificate chain must be included in the signature
- System trust store must contain the root CA, or root CA must be provided in `.ocmconfig`

Suitable for enterprise PKI integration and scenarios requiring automated trust validation.

## Signing Component Versions

### Basic Signing

```sh
# Sign with default signature name and configuration
ocm sign cv ghcr.io/myorg/component:1.0.0

# Sign with custom signature name
ocm sign cv --signature release ghcr.io/myorg/component:1.0.0
```

### Advanced Signing Options

```sh
# Use specific signer specification
ocm sign cv \
  --signer-spec ./config/prod-signer.yaml \
  --signature prod-release \
  ghcr.io/myorg/component:1.0.0

# Dry run (compute signature without storing)
ocm sign cv \
  --signature test \
  --dry-run \
  ghcr.io/myorg/component:1.0.0

# Force overwrite existing signature
ocm sign cv \
  --signature release \
  --force \
  ghcr.io/myorg/component:1.0.0

# Custom normalization and hash algorithms
ocm sign cv \
  --normalisation jsonNormalisation/v4alpha1 \
  --hash SHA512 \
  --signature release \
  ghcr.io/myorg/component:1.0.0
```

### Common Signing Flags

| Flag              | Description                              | Default       |
|-------------------|------------------------------------------|---------------|
| `--signature`     | Name of the signature                    | `default`     |
| `--signer-spec`   | Path to signer specification file        | (uses config) |
| `--force`         | Overwrite existing signature             | `false`       |
| `--dry-run`       | Compute signature without storing        | `false`       |

For complete flag reference, see `ocm sign cv --help`.

## Verifying Component Versions

### Basic Verification

```sh
# Verify default signature
ocm verify cv ghcr.io/myorg/component:1.0.0

# Verify specific signature
ocm verify cv --signature release ghcr.io/myorg/component:1.0.0
```

### Verification with External Public Key

```sh
# Provide public key via command line
ocm verify cv \
  --public-key ./keys/public.pem \
  --signature release \
  ghcr.io/myorg/component:1.0.0
```

### Verification Process

1. **Fetch component version** from repository
2. **Locate signature** by name in component descriptor
3. **Resolve public key** from:
   - `.ocmconfig` credential system, OR
   - `--public-key` flag, OR
   - Certificate chain in signature (PEM encoding only)
4. **Normalize component descriptor** using specified algorithm
5. **Hash normalized descriptor**
6. **Verify signature** using public key
7. **Validate certificate chain** (PEM encoding only)

### Verification Success Criteria

For verification to succeed:

- ✅ Signature exists with specified name
- ✅ Public key can be resolved
- ✅ Signature cryptographically valid
- ✅ Component descriptor unchanged since signing
- ✅ Certificate chain valid (PEM encoding only)
- ✅ Certificate DN matches signature name (PEM encoding only)

## Trust Models

OCM supports multiple trust models depending on your security requirements.

### 1. Key Pinning (Self-Signed)

Specific public keys configured in `.ocmconfig`. Trust is based on exact key match without certificate validation.

**Trust chain:**

```code
Component Signature → Public Key in .ocmconfig → Trust
```

Simple setup with full control, suitable for small teams and development environments.

### 2. System Trust Store (CA-Signed, PEM Encoding)

Certificate chain embedded in signature and validated against system trust store or distributed root CA. No manual public key distribution needed.

**Trust chain:**

```code
Component Signature → Embedded Cert Chain → System Trust Store → Root CA → Trust
```

Suitable for automatic trust propagation in enterprise PKI infrastructure.

## Complete Configuration Examples

### Example 1: Development Setup (Self-Signed)

**Prerequisites:** Generate self-signed keys (see "Self-Signed Keys" section):

```bash
mkdir -p ~/.ocm/keys/dev
openssl genrsa -out ~/.ocm/keys/dev/private.key 4096
openssl rsa -in ~/.ocm/keys/dev/private.key -pubout -out ~/.ocm/keys/dev/public.pem
chmod 600 ~/.ocm/keys/dev/private.key
chmod 644 ~/.ocm/keys/dev/public.pem
```

**.ocmconfig:**

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
              private_key_pem_file: ~/.ocm/keys/dev/private.key
              public_key_pem_file: ~/.ocm/keys/dev/public.pem
```

**Usage:**

```bash
# Sign
ocm sign cv --signature dev ghcr.io/myorg/component:1.0.0

# Verify
ocm verify cv --signature dev ghcr.io/myorg/component:1.0.0
```

### Example 2: Enterprise Production Setup (CA-Signed, PEM Encoding)

**Prerequisites:** Use CA-signed production keys (see "CA-Signed Keys" section).

**Key differences from Development:**

- Uses `signatureEncodingPolicy: PEM`
- Certificate chain embedded in signature
- Validates against system trust store
- Minimal `.ocmconfig` needed for verification

**Signer specification (~/prod-signer.yaml):**

```yaml
type: RSA/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: PEM
privateKeyPEMFile: ~/.ocm/keys/prod/private.key
```

**Sign:**

```bash
ocm sign cv --signer-spec ~/prod-signer.yaml --signature prod ghcr.io/myorg/component:1.0.0
```

**Verify:**

```bash
# Certificate chain validated automatically from signature
ocm verify cv --signature prod ghcr.io/myorg/component:1.0.0
```

## Troubleshooting

### Signature Verification Fails

**Error:** "signature verification failed"

**Common causes:**

1. Wrong public key configured
2. Component version modified after signing
3. Signature name mismatch
4. Certificate chain invalid (PEM encoding)

**Solutions:**

- Verify public key matches private key: `openssl rsa -in private.key -pubout`
- Check signature name: `ocm get cv -o yaml ghcr.io/myorg/component:1.0.0`
- Verify certificate chain: `openssl verify -CAfile ca-chain.pem certificate.pem`

### Private Key Not Found

**Error:** "could not resolve credentials for identity"

**Solutions:**

- Check `.ocmconfig` path and syntax
- Verify file paths in `private_key_pem_file`
- Ensure `signature` attribute matches between config and command

### Certificate Chain Validation Fails (PEM)

**Error:** "certificate validation failed"

**Solutions:**

- Ensure system trust store includes required root CAs
- Provide root CA in `.ocmconfig`: `public_key_pem_file: ./ca-root.pem`
- Verify certificate DN matches signature name
- Check certificate expiry: `openssl x509 -in cert.pem -noout -dates`

### Signature Already Exists

**Error:** "signature 'name' already exists"

**Solutions:**

- Use `--force` to overwrite: `ocm sign cv ... --force`
- Use a different signature name: `--signature name-v2`
- Remove old signature first (manual descriptor editing)

## Summary

OCM's signing and verification system provides:

- ✅ **Flexible trust models** - From simple key pinning to enterprise PKI
- ✅ **Multiple algorithms** - RSASSA-PSS (recommended) and PKCS1v15
- ✅ **Encoding options** - Plain (compact) and PEM (with cert chains)
- ✅ **Multi-environment support** - Separate keys for dev, staging, prod
- ✅ **Signer specifications** - Fine-grained control over signing process
- ✅ **Credential integration** - Unified with OCM credential system

**Choosing the right approach:**

| Scenario                     | Recommended Approach               |
|------------------------------|------------------------------------|
| Local development            | Self-signed, Plain encoding        |
| Small team                   | Self-signed, key pinning           |
| Medium organization          | CA-signed, Plain, certificate pinning |
| Enterprise                   | CA-signed, PEM, system trust store |
| Compliance-driven            | CA-signed, PEM, HSM integration    |

## Related Documentation

- [Credentials in .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) - Practical credential configuration examples
- [OCM CLI Reference]({{< relref "/docs/reference/ocm-cli" >}}) - Complete command-line options
