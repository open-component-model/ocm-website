---
title: "Sign Component Versions"
description: "Cryptographically sign a component version to establish authenticity and enable verification."
icon: "🔏"
weight: 23
toc: true
---

## Goal

Sign a component version to certify its authenticity and enable downstream verification.

## You'll end up with

- A component version with a cryptographic signature attached

**Estimated time:** ~3 minutes

## Prerequisites

- [OCM CLI installed]({{< relref "ocm-cli-installation.md" >}})
- [RSA key pair generated]({{< relref "docs/how-to/generate-signing-keys.md" >}})
- [Signing credentials configured]({{< relref "docs/how-to/configure-signing-credentials.md" >}})
- A component version in a CTF archive or OCI registry

## Steps

{{< steps >}}

{{< step >}}

### Sign the component version

Run the sign command against your component:

```bash
ocm sign cv <repository>//<component>:<version>
```
{{< tabs >}}
{{< tab "Local CTF Archive" >}}

```bash
ocm sign cv ./transport-archive//github.com/acme.org/helloworld:1.0.0
```
{{< /tab >}}
{{< tab "Remote OCI Registry" >}}

```bash
ocm sign cv ghcr.io/myorg/components//github.com/acme.org/helloworld:1.0.0
```
{{< /tab >}}
{{< /tabs >}}

{{< /step >}}

{{< step >}}

### Use a named signature (optional)

If you have multiple signing configurations in your `.ocmconfig`,
use `--signature` flag to specify which one to use.
Without the flag, OCM uses the configuration named `default`.
```bash
ocm sign cv --signature prod ghcr.io/myorg/components//github.com/acme.org/helloworld:1.0.0
```

{{< /step >}}

{{< step >}}

### Verify the signature was added

Check that the signature is present in the component descriptor:

```bash
ocm get cv ./transport-archive//github.com/acme.org/helloworld:1.0.0 -o yaml
```

Look for the `signatures` section in the output:

```yaml
signatures:
  - name: default
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v2
      value: abc123...
    signature:
      algorithm: RSA/PKCS1v15
      value: <base64-encoded-signature>
```

{{< /step >}}

{{< /steps >}}

## Troubleshooting

### Symptom: "no private key found"

**Cause:** OCM cannot find a matching signing configuration in `.ocmconfig`.

**Fix:** Ensure your `.ocmconfig` has a consumer entry with matching `signature` name:

- Without `--signature` flag: must have `signature: default`
- With `--signature prod`: must have `signature: prod`

See [Configure Signing Credentials]({{< relref "configure-signing-credentials.md" >}}).

### Symptom: "signature already exists"

**Cause:** The component version already has a signature with this name.

**Fix:** Use a different signature name with `--signature newname`, or remove the existing signature first.

### Symptom: Permission denied on registry

**Cause:** Missing write access to the OCI registry.

**Fix:** Ensure you're authenticated to the registry:

```bash
docker login ghcr.io
```

