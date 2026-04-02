---
title: "PEM Signing with Certificate Chains"
description: "Sign and verify component versions using PEM-encoded signatures with an X.509 certificate chain and a dedicated trust anchor."
icon: "🔐"
weight: 56
toc: true
---

## Overview

OCM supports two signature encoding policies: **Plain** (the default, a compact hex-encoded signature) and **PEM** (a mode that embeds an X.509 certificate chain directly in the signature value).

This guide covers the **PEM encoding policy**. You should use it when:

- Your organization already has a PKI (Certificate Authority) infrastructure
- Signers should not need to distribute their public key to every verifier separately
- You want the verifier to pin a specific **trust anchor** (root CA) rather than a bare public key

**How it differs from Plain signing:**

| Aspect | Plain (default) | PEM |
| ------ | --------------- | --- |
| Signature value | Hex-encoded bytes | PEM `SIGNATURE` block |
| Public key distribution | Verifier needs it in `.ocmconfig` | Embedded in signature (leaf + any intermediates) |
| Trust anchor | Public key pinning | Root CA certificate pinning |
| Certificate chain | Not supported | Leaf required; intermediates optional |
| Use case | Simple setups, self-signed keys | PKI integration, enterprise environments |

## Prerequisites

- OCM CLI installed — see [Install the OCM CLI]({{< relref "ocm-cli-installation.md" >}})
- An OCM component version to sign — see [Create Component Versions]({{< relref "create-component-version.md" >}})
- `openssl` command available in your shell

## How PEM Signing Works

PEM signing uses a certificate chain where a root CA (the trust anchor) signs a leaf certificate — or signs an intermediate CA that in turn signs the leaf. The private key of the leaf certificate performs the actual signing.

```text
Root CA (self-signed)           ← verifier's trust anchor, never embedded
  └── Leaf certificate          ← minimum required chain (direct issuance)
        └── Signs the component descriptor digest

Root CA (self-signed)           ← verifier's trust anchor, never embedded
  └── Intermediate CA           ← optional; common in enterprise PKI
        └── Leaf certificate
              └── Signs the component descriptor digest
```

An intermediate CA is **not required** — you can issue a leaf certificate directly from the root CA. Intermediates are common in enterprise PKI to limit root CA exposure but add no functional requirement for OCM.

**At signing time**, OCM embeds the leaf certificate (and any intermediate certificates) into the signature value as PEM `CERTIFICATE` blocks after the `SIGNATURE` block. The root CA is **never** embedded — the verifier holds it as a trust anchor.

**At verification time**, OCM:

1. Extracts the embedded certificate chain from the signature
2. Builds a path from the leaf through any intermediates to the verifier's trust anchor (root CA)
3. Validates the chain — self-signed certificates in the embedded chain are rejected outright
4. Extracts the public key from the validated leaf certificate
5. Verifies the cryptographic signature

{{< callout context="caution" title="Root CA must not be embedded" >}}
Do **not** include the root CA in the certificate chain you supply to the signer. OCM rejects any self-signed certificate found in the embedded chain to prevent signers from asserting their own trust anchor.
{{< /callout >}}

## Step 1: Generate a Certificate Chain

If your organization already has a PKI, obtain a leaf certificate (and intermediate chain if applicable) from your CA and skip to [Step 2](#step-2-prepare-credential-files).

Otherwise, generate a chain locally with `openssl`. The examples below show both options.

### Option A: Direct issuance (root CA → leaf)

This is the simplest setup — the root CA signs the leaf directly. No intermediate is needed.

```bash
mkdir -p ~/.ocm/keys/pem-demo
cd ~/.ocm/keys/pem-demo

# ── Root CA ──────────────────────────────────────────────────────────────────
openssl genrsa -out root.key 4096
openssl req -x509 -new -nodes \
  -key root.key \
  -sha256 -days 3650 \
  -subj "/CN=OCM Demo Root CA" \
  -out root.crt

# ── Leaf certificate (signed directly by root) ────────────────────────────────
openssl genrsa -out leaf.key 4096
openssl req -new \
  -key leaf.key \
  -subj "/CN=OCM Demo Signer" \
  -out leaf.csr

openssl x509 -req \
  -in leaf.csr \
  -CA root.crt -CAkey root.key -CAcreateserial \
  -sha256 -days 365 \
  -out leaf.crt

chmod 600 root.key leaf.key
chmod 644 root.crt leaf.crt
```

**Files created:**

| File | Purpose |
| ---- | ------- |
| `root.key` / `root.crt` | Root CA — the verifier's trust anchor |
| `leaf.key` / `leaf.crt` | Leaf — the private key used for signing |

### Option B: With an intermediate CA (root CA → intermediate → leaf)

Add an intermediate CA when your PKI requires it — for example, to keep the root CA key offline or to delegate signing authority to a sub-CA.

```bash
mkdir -p ~/.ocm/keys/pem-demo
cd ~/.ocm/keys/pem-demo

# ── Root CA ──────────────────────────────────────────────────────────────────
openssl genrsa -out root.key 4096
openssl req -x509 -new -nodes \
  -key root.key \
  -sha256 -days 3650 \
  -subj "/CN=OCM Demo Root CA" \
  -out root.crt

# ── Intermediate CA ───────────────────────────────────────────────────────────
openssl genrsa -out intermediate.key 4096
openssl req -new \
  -key intermediate.key \
  -subj "/CN=OCM Demo Intermediate CA" \
  -out intermediate.csr

cat > intermediate-ext.cnf <<'EOF'
basicConstraints = CA:TRUE
keyUsage = digitalSignature, keyCertSign, cRLSign
EOF

openssl x509 -req \
  -in intermediate.csr \
  -CA root.crt -CAkey root.key -CAcreateserial \
  -sha256 -days 1825 \
  -extfile intermediate-ext.cnf \
  -out intermediate.crt

# ── Leaf certificate ──────────────────────────────────────────────────────────
openssl genrsa -out leaf.key 4096
openssl req -new \
  -key leaf.key \
  -subj "/CN=OCM Demo Signer" \
  -out leaf.csr

openssl x509 -req \
  -in leaf.csr \
  -CA intermediate.crt -CAkey intermediate.key -CAcreateserial \
  -sha256 -days 365 \
  -out leaf.crt

chmod 600 root.key intermediate.key leaf.key
chmod 644 root.crt intermediate.crt leaf.crt
```

**Files created:**

| File | Purpose |
| ---- | ------- |
| `root.key` / `root.crt` | Root CA — keep the key offline in production |
| `intermediate.key` / `intermediate.crt` | Intermediate CA |
| `leaf.key` / `leaf.crt` | Leaf — the private key used for signing |

## Step 2: Prepare Credential Files

The **signer** needs the leaf private key and a chain file containing the certificates to embed in the signature. The **verifier** needs only the root CA certificate as a trust anchor.

{{< callout context="caution" title="Root CA must never be in the chain file" >}}
The chain file supplied to the signer must **not** contain the root CA. OCM rejects any self-signed certificate found embedded in a signature to prevent signers from asserting their own trust anchor.
{{< /callout >}}

```bash
cd ~/.ocm/keys/pem-demo

# Option A: direct issuance — chain contains only the leaf
cp leaf.crt chain.pem

# Option B: with intermediate — chain contains leaf then intermediate (root excluded)
cat leaf.crt intermediate.crt > chain.pem

chmod 644 chain.pem
```

{{< callout context="note" title="Order matters" >}}
The chain file must start with the **leaf** certificate. If intermediates are present, they follow in order toward the root (leaf → intermediate → … ). The root CA is always omitted.
{{< /callout >}}

**Summary of files used per role:**

| Role | Files needed |
| ---- | ------------ |
| Signer | `leaf.key` (private key), `chain.pem` (leaf, plus any intermediates) |
| Verifier | `root.crt` (trust anchor only) |

## Step 3: Configure `.ocmconfig`

OCM resolves signing and verification credentials through its credential system. Both the signer and verifier configure a consumer of type `RSA/v1alpha1`.

### Signing configuration

```yaml
# ~/.ocmconfig  (or pass with --config <path>)
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
              private_key_pem_file: ~/.ocm/keys/pem-demo/leaf.key
              public_key_pem_file: ~/.ocm/keys/pem-demo/chain.pem
```

### Verification configuration

```yaml
# ~/.ocmconfig  (or a separate file passed with --config <path>)
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
              public_key_pem_file: ~/.ocm/keys/pem-demo/root.crt
```

{{< callout context="caution" title="Trust anchor isolation" >}}
When a self-signed certificate is supplied as `public_key_pem_file` for verification, OCM uses it as an **isolated trust anchor** and bypasses the system root store entirely. Only signatures rooted in that specific CA will verify successfully. This is intentional: it gives you precise control over which CA is trusted.
{{< /callout >}}

### Credential property reference

The `RSA/v1alpha1` consumer type accepts these credential properties:

| Property | Direction | Description |
| -------- | --------- | ----------- |
| `private_key_pem` | Signing | RSA private key as an inline PEM string (PKCS#1 or PKCS#8) |
| `private_key_pem_file` | Signing | Path to a PEM file containing the RSA private key |
| `public_key_pem` | Both | Inline PEM string — a bare public key, a certificate, or a chain of certificates |
| `public_key_pem_file` | Both | Path to a PEM file — same accepted formats as `public_key_pem` |

For PEM encoding, `public_key_pem_file` (or `public_key_pem`) serves two distinct purposes depending on the role:

- **Signer**: Supply the certificates to embed — at minimum just the leaf certificate, plus any intermediate certificates if your PKI uses them. OCM reads these and appends them to the signature value. Do not include the root CA.
- **Verifier**: Supply the root CA certificate. OCM treats a self-signed certificate as a trust anchor and validates the embedded chain against it. Non-self-signed certificates supplied here are treated as additional intermediates for path building.

### Consumer identity attributes

| Attribute | Required | Description |
| --------- | -------- | ----------- |
| `type` | Yes | Must be `RSA/v1alpha1` |
| `algorithm` | No | `RSASSA-PSS` (default) or `RSASSA-PKCS1V15` (legacy) |
| `signature` | No | Name of the signature — must match `--signature` flag (default: `default`) |

## Step 4: Create a Signer Spec File

The `--signer-spec` flag enables the PEM encoding policy. Create a small YAML file:

```yaml
# pem-signer.yaml
type: RSASigningConfiguration/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: PEM
```

This file controls **how** the signature is encoded. It does **not** contain credentials — those are always resolved from `.ocmconfig`.

## Step 5: Sign and Verify

### Sign

```bash
ocm sign cv \
  --config ~/.ocmconfig \
  --signer-spec pem-signer.yaml \
  ghcr.io/myorg/component:1.0.0
```

The signature value stored in the component descriptor will look like:

```text
-----BEGIN SIGNATURE-----
Signature Algorithm: RSASSA-PSS
<base64-encoded signature bytes>
-----END SIGNATURE-----
-----BEGIN CERTIFICATE-----
<leaf certificate DER>
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
<intermediate CA DER>  ← only present if intermediates were included in chain.pem
-----END CERTIFICATE-----
```

### Verify

```bash
ocm verify cv \
  --config ~/.ocmconfig-verify \
  ghcr.io/myorg/component:1.0.0
```

No `--verifier-spec` is needed — OCM infers the PEM encoding from the `application/x-pem-file` media type stored alongside the signature and selects the correct handler automatically.

### Dry-run signing

Use `--dry-run` to compute and print the signature without writing it to the repository — useful for testing your configuration:

```bash
ocm sign cv \
  --config ~/.ocmconfig \
  --signer-spec pem-signer.yaml \
  --dry-run \
  ghcr.io/myorg/component:1.0.0
```

## Multiple Environments

You can maintain separate signing identities (e.g., `dev` and `prod`) by using different `signature` names and different certificate chains in a single `.ocmconfig`:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      # Development signer (self-signed, Plain encoding)
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: dev
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/dev/private.pem
              public_key_pem_file: ~/.ocm/keys/dev/public.pem

      # Production signer (CA-signed, PEM encoding)
      - identity:
          type: RSA/v1alpha1
          algorithm: RSASSA-PSS
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/pem-demo/leaf.key
              public_key_pem_file: ~/.ocm/keys/pem-demo/chain.pem
```

Sign or verify a specific environment with `--signature`:

```bash
# Sign for production
ocm sign cv --signer-spec pem-signer.yaml --signature prod ghcr.io/myorg/component:1.0.0

# Verify the production signature
ocm verify cv --signature prod --config ~/.ocmconfig-verify ghcr.io/myorg/component:1.0.0
```

## Troubleshooting

### "must not be embedded in the signature"

The chain file supplied to the signer contains a self-signed (root CA) certificate. Remove the root CA from `chain.pem`.

```bash
# Check which certificates are in chain.pem
openssl crl2pkcs7 -nocrl -certfile chain.pem | openssl pkcs7 -print_certs -noout

# Verify the leaf is correctly signed (direct issuance)
openssl verify -CAfile root.crt leaf.crt

# Verify the leaf is correctly signed (with intermediate)
openssl verify -CAfile root.crt -untrusted intermediate.crt leaf.crt
```

### "certificate signed by unknown authority" / chain validation fails

The root CA supplied as the verifier trust anchor does not match the root that signed the embedded chain. Check that the `public_key_pem_file` in the verification config points to the correct root CA.

```bash
# Verify the full chain offline (direct issuance)
openssl verify -CAfile root.crt leaf.crt

# Verify the full chain offline (with intermediate)
openssl verify -CAfile root.crt -untrusted intermediate.crt leaf.crt
```

### "could not resolve credentials for identity"

The consumer identity in `.ocmconfig` does not match what OCM looks up. Confirm:

- `type: RSA/v1alpha1` is spelled correctly
- `algorithm` matches the value in the signer spec (`RSASSA-PSS`)
- `signature` matches the `--signature` flag value (default: `default`)

### "signature already exists"

A signature with the same name already exists in the component descriptor. Use `--force` to overwrite it or choose a different name with `--signature`.

## Related Documentation

- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) — Overview of all signing options, algorithms, and trust models
- [Sign Component Versions]({{< relref "sign-component-version.md" >}}) — Quick-start guide for Plain signing
- [Verify Component Versions]({{< relref "verify-component-version.md" >}}) — Quick-start guide for verification
- [Configure Credentials for Signing]({{< relref "docs/how-to/configure-signing-credentials.md" >}}) — Full credential configuration reference
