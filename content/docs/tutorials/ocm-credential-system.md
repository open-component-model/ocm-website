---
title: "Understanding the OCM Credential System"
description: "Learn how OCM manages and resolves credentials for artifact repositories and services."
url: "/docs/tutorials/ocm-credential-system"
icon: "🔐"
weight: 52
toc: true
---

## Overview

The OCM credential system provides a unified way to manage credentials for accessing artifact repositories and services. Instead of configuring credentials separately for each tool, OCM uses a central configuration that supports:

- 🔐 **Multiple services** - OCI registries, Helm repositories, npm, Maven, GitHub, signing keys
- 🎯 **Wildcard matching** - Configure credentials once for entire organizations  
- 🔗 **Credential dependencies** - Retrieve credentials from secret managers
- 🔌 **Existing tools** - Integrate with Docker config, npm config, and more
- 🚀 **Smart resolution** - Automatic fallback and caching

This guide explains the core concepts and common configuration patterns.

## How It Works

### Basic Concept

The credential system connects **consumers** (services needing credentials) with **credentials** (authentication data):

```yaml
type: credentials.config.ocm.software
consumers:
  - identity:              # Who needs credentials?
      type: OCIRegistry
      hostname: docker.io
    credentials:           # What credentials to use?
      - type: Credentials
        properties:
          username: myuser
          password: mytoken
```

### Common Consumer Types

| Type | Used For | Attributes |
|------|----------|------------|
| `OCIRegistry` | Docker, ghcr.io, quay.io | `hostname`, `pathprefix`, `scheme`, `port` |
| `HelmChartRepository` | Helm chart repos | `hostname`, `pathprefix` |
| `NpmRegistry` | npm registries | `hostname` |
| `MavenRepository` | Maven repos | `hostname`, `pathprefix` |
| `Github` | GitHub repos | `hostname`, `pathprefix` |
| `RSA` | Signing keys | `algorithm`, `signature` |

> **Note:** Some examples in the OCM codebase use versioned types (e.g., `OCIRegistry/v1`), but for `.ocmconfig` files, the unversioned form (e.g., `OCIRegistry`) is commonly used and recommended.

### Resolution Order

When OCM needs credentials, it checks in this order:

1. **Exact match** in direct configuration
2. **Wildcard match** in direct configuration
3. **Repository fallback** (Docker config, npm config, etc.)

Example:

```yaml
consumers:
  # Specific repository (highest priority)
  - identity:
      type: OCIRegistry
      hostname: ghcr.io/myorg/special-repo
    credentials:
      - type: Credentials
        properties:
          username: special-user

  # All other repos in organization (wildcard)
  - identity:
      type: OCIRegistry
      hostname: ghcr.io/myorg/*
    credentials:
      - type: Credentials
        properties:
          username: default-user

repositories:
  # Fallback to Docker config (lowest priority)
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: "~/.docker/config.json"
```

## Common Patterns

### Single Registry

Configure credentials for one registry:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: OCIRegistry
          hostname: ghcr.io
        credentials:
          - type: Credentials
            properties:
              username: myuser
              password: ghp_mytoken
```

### Organization-Wide with Wildcards

Use wildcards for all repositories in an organization:

```yaml
type: credentials.config.ocm.software
consumers:
  - identity:
      type: OCIRegistry
      hostname: ghcr.io/my-org/*
    credentials:
      - type: Credentials
        properties:
          username: my-org-bot
          password: ghp_token
```

Matches:
- ✓ `ghcr.io/my-org/repo1`
- ✓ `ghcr.io/my-org/repo2`
- ✗ `ghcr.io/other-org/repo`

### Multiple Services

Configure different credentials for different services:

```yaml
type: credentials.config.ocm.software
consumers:
  - identity:
      type: OCIRegistry
      hostname: ghcr.io
    credentials:
      - type: Credentials
        properties:
          username: github-user
          password: ghp_token

  - identity:
      type: OCIRegistry
      hostname: docker.io
    credentials:
      - type: Credentials
        properties:
          username: docker-user
          password: dckr_token

  - identity:
      type: HelmChartRepository
      hostname: charts.example.com
    credentials:
      - type: Credentials
        properties:
          username: helm-user
          password: helm-token
```

### Using Existing Credential Stores

Integrate with Docker and npm instead of duplicating credentials:

```yaml
type: credentials.config.ocm.software
repositories:
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: "~/.docker/config.json"
      propagateConsumerIdentity: true
  
  - repository:
      type: NPMConfig/v1
      npmrcFile: "~/.npmrc"
```

**Benefits:**
- No credential duplication
- Works with credential helpers (`docker-credential-osxkeychain`)
- Reuses existing setup

### Credential Dependencies (Advanced)

Retrieve credentials from secret managers:

```yaml
type: credentials.config.ocm.software
consumers:
  # Registry credentials from Vault
  - identity:
      type: OCIRegistry
      hostname: private.example.com
    credentials:
      - type: HashiCorpVault/v1alpha1
        serverURL: "https://vault.example.com"
        path: "secret/registry"

  # Vault access credentials
  - identity:
      type: HashiCorpVault/v1alpha1
      hostname: vault.example.com
    credentials:
      - type: Credentials
        properties:
          role_id: vault-role
          secret_id: vault-secret
```

**Flow:**
1. OCM needs credentials for `private.example.com`
2. Configured to get them from Vault
3. OCM authenticates to Vault using `role_id`/`secret_id`
4. Vault returns registry credentials
5. OCM uses them to access the registry

> **Note:** Plugin availability (like `HashiCorpVault/v1alpha1`) depends on your OCM distribution.

### Merging Multiple Credential Sources

Split credentials across multiple sources (later ones override earlier):

```yaml
type: credentials.config.ocm.software
consumers:
  - identity:
      type: OCIRegistry
      hostname: example.com
    credentials:
      - type: Credentials
        properties:
          username: default-user
          password: default-pass
      - type: Credentials
        properties:
          password: override-pass  # Overrides above
```

**Result:** `username: default-user`, `password: override-pass`

## Configuration Reference

### File Location

OCM looks for credentials in:
1. `$HOME/.ocmconfig` (default)
2. Path specified via `--config` flag
3. `OCM_CONFIG` environment variable

### Full Configuration Structure

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    
    # Direct credentials (checked first)
    consumers:
      - identity:
          type: <consumer-type>
          <attribute>: <value>
        credentials:
          - type: Credentials
            properties:
              <key>: <value>
    
    # Credential repositories (fallback)
    repositories:
      - repository:
          type: <repository-type>
          <config-key>: <config-value>
```

### Credential Properties

Common credential properties by service type:

**OCI Registries:**
- `username` / `password`
- `identityToken` (for token-based auth)

**Helm Repositories:**
- `username` / `password`
- `certFile` / `keyFile` / `caFile` (for TLS)

**NPM Registries:**
- `token` or `username`/`password`
- `email`

**Signing (RSA):**
- `private_key_pem_file` or `private_key_pem`
- `public_key_pem_file` or `public_key_pem`

## Best Practices

### For Development

**Use repository plugins:**
```yaml
repositories:
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: "~/.docker/config.json"
```

**Benefits:**
- Reuses existing credentials
- No duplication
- Works with credential helpers

### For CI/CD

**Use direct configuration:**
```yaml
consumers:
  - identity:
      type: OCIRegistry
      hostname: ghcr.io
    credentials:
      - type: Credentials
        properties:
          username: $REGISTRY_USER
          password: $REGISTRY_TOKEN
```

**Benefits:**
- Predictable resolution
- Explicit configuration
- No external dependencies

### For Organizations

**Use wildcards:**
```yaml
consumers:
  - identity:
      type: OCIRegistry
      hostname: ghcr.io/myorg/*
    credentials:
      - type: Credentials
        properties:
          username: org-bot
          password: $ORG_TOKEN
```

**Benefits:**
- Configure once for all repos
- Easy maintenance
- Consistent access

### Security

1. **File-based references:**
   ```yaml
   properties:
     password_file: /path/to/secret  # Better
     # password: inline-secret       # Avoid
   ```

2. **Permissions:**
   ```bash
   chmod 600 ~/.ocmconfig
   ```

3. **Environment variables:**
   ```yaml
   properties:
     password: ${REGISTRY_PASSWORD}
   ```

## Troubleshooting

### Credentials Not Found

**Error:** `failed to resolve credentials for identity`

**Check:**
1. Consumer type is correct (e.g., `OCIRegistry`, not `oci-registry`)
2. Identity attributes match (e.g., `hostname: ghcr.io`)
3. Wildcard patterns are correct
4. Repository plugins configured if using fallback


### Wrong Credentials Used

**Issue:** Unexpected credentials being used

**Check resolution order:**
1. Exact match takes precedence over wildcard
2. Direct configuration checked before repositories
3. First match wins (order matters in config)

### Repository Plugin Not Working

**Issue:** Docker/npm credentials not found

**Verify:**
1. File paths are correct
2. Files are readable by OCM
3. `propagateConsumerIdentity: true` is set (if needed)

**Example:**
```yaml
repositories:
  - repository:
      type: DockerConfig/v1
      dockerConfigFile: ~/.docker/config.json  # Use absolute path
      propagateConsumerIdentity: true
```

## Summary

The OCM credential system provides:

✅ **Unified configuration** - One place for all credentials  
✅ **Flexible matching** - Exact, wildcard, and repository fallback  
✅ **Integration** - Works with existing tools (Docker, npm)  
✅ **Dependencies** - Credentials can retrieve other credentials  
✅ **Performance** - Automatic caching and concurrent resolution

**For most use cases:**
- **Development:** Use repository plugins (`DockerConfig/v1`)
- **CI/CD:** Use direct configuration with environment variables
- **Organizations:** Use wildcards for organization-wide access

## Related Documentation

- [Credentials in .ocmconfig File]({{< relref "creds-in-ocmconfig.md" >}}) - Practical examples for common scenarios
- [Signing and Verification]({{< relref "signing-and-verification.md" >}}) - Using credentials for cryptographic operations
- [OCM CLI Reference]({{< relref "/docs/reference/ocm-cli" >}}) - Complete command-line reference
