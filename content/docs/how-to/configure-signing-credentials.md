---
title: "Configure Signing Credentials"
description: "Configure OCM signing and verification keys using .ocmconfig or signer specification files."
icon: "🔑"
weight: 35
toc: true
---

## Goal

Set up credential configuration so OCM can find your signing keys when signing or verifying component versions.

## You'll end up with

- A configured `.ocmconfig` or signer spec file
- Ability to sign and verify component versions without specifying key paths manually

**Estimated time:** ~3 minutes

## Prerequisites

- [OCM CLI installed]({{< relref "docs/getting-started/ocm-cli-installation.md" >}})
- [RSA key pair generated]({{< relref "generate-signing-keys.md" >}})

## Steps

Choose the configuration method that fits your workflow:

{{< tabs "config-method" >}}

{{< tab ".ocmconfig (recommended)" >}}

### Configure via .ocmconfig

{{< steps >}}

{{< step >}}
**Create or edit your .ocmconfig file**

Create `~/.ocmconfig` if it doesn't exist:

```bash
touch ~/.ocmconfig
```

{{< /step >}}

{{< step >}}
**Add the signing credential configuration**

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
              private_key_pem_file: ~/.ocm/keys/private.pem
              public_key_pem_file: ~/.ocm/keys/public.pem
```

**Key paths:**
- `private_key_pem_file` - Required for **signing** operations
- `public_key_pem_file` - Required for **verification** operations

{{< /step >}}

{{< step >}}
**Test the configuration**

```bash
ocm sign cv --dry-run ./transport-archive//github.com/acme.org/helloworld:1.0.0
```

If configured correctly, the dry run completes without "no private key found" errors.

{{< /step >}}

{{< /steps >}}

### Configure multiple signing identities

For different environments (dev, staging, prod), add multiple consumer blocks:

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
              private_key_pem_file: ~/.ocm/keys/dev/private.pem
              public_key_pem_file: ~/.ocm/keys/dev/public.pem
      - identity:
          type: RSA/v1alpha1
          signature: prod
        credentials:
          - type: Credentials/v1
            properties:
              private_key_pem_file: ~/.ocm/keys/prod/private.pem
              public_key_pem_file: ~/.ocm/keys/prod/public.pem
```

Specify the signature name when signing:

```bash
ocm sign cv --signature dev ghcr.io/myorg/component:1.0.0
ocm sign cv --signature prod ghcr.io/myorg/component:1.0.0
```

{{< /tab >}}

{{< tab "Signer Spec File" >}}

### Configure via signer spec file

Use this method in CI/CD pipelines or when you need explicit control over key paths.

{{< steps >}}

{{< step >}}
**Create a signer specification file**

Create `signer-config.yaml`:

```yaml
type: RSA/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: Plain
privateKeyPEMFile: /secrets/signing-key.pem
```

{{< /step >}}

{{< step >}}
**Pass the file when signing**

```bash
ocm sign cv \
  --signer-spec ./signer-config.yaml \
  --signature release \
  ghcr.io/myorg/component:1.0.0
```

This bypasses the `.ocmconfig` credential lookup and uses the specified key directly.

{{< /step >}}

{{< /steps >}}

{{< /tab >}}

{{< /tabs >}}

## Identity Attributes Reference

The consumer identity for RSA signing/verification supports these attributes:

| Attribute   | Required | Description                                         |
|-------------|----------|-----------------------------------------------------|
| `type`      | Yes      | Must be `RSA/v1alpha1`                              |
| `algorithm` | No       | `RSASSA-PSS` (default) or `RSASSA-PKCS1V15`         |
| `signature` | No       | Name for this key configuration (default: `default`)|

## Troubleshooting

### Symptom: "no private key found"

**Cause:** OCM cannot find a matching consumer entry in `.ocmconfig`.

**Fix:** Ensure:
- The file path `private_key_pem_file` is correct and the file exists
- The `signature` name matches what you're using (or is `default` if not specified)
- The file is valid YAML with correct indentation

### Symptom: "permission denied" reading key file

**Cause:** Key file has restrictive permissions.

**Fix:** Ensure your user can read the key file:

```bash
chmod 600 ~/.ocm/keys/private.pem
ls -la ~/.ocm/keys/
```

## CLI Reference

| Command                                                                  | Description |
|--------------------------------------------------------------------------|-------------|
| [`ocm sign cv --dry-run`]({{< relref "/docs/reference/ocm-cli/ocm_sign_component-version.md" >}}) | Test signing configuration |
| [`ocm verify cv`]({{< relref "/docs/reference/ocm-cli/ocm_verify_component-version.md" >}})       | Test verification configuration |

## Next Steps

- [How-to: Sign Component Versions]({{< relref "sign-component-version.md" >}}) - Sign components with your configured credentials
- [How-to: Verify Component Versions]({{< relref "verify-component-version.md" >}}) - Verify signatures using public keys

## Related Documentation

- [How-to: Generate Signing Keys]({{< relref "generate-signing-keys.md" >}}) - Create the key pair needed for this configuration
- [Concept: Signing and Verification]({{< relref "signing-and-verification-concept.md" >}}) - Understand how OCM signing works