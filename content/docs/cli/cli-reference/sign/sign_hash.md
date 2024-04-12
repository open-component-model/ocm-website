---
title: hash
name: sign hash
url: /docs/cli/cli-reference/sign/hash/
date: 2024-04-11T12:48:04+02:00
draft: false
images: []
toc: true
---
### Usage

```
ocm sign hash <private key file> <hash> [<issuer>]
```

### Options

```
  -S, --algorithm string   signature algorithm (default "RSASSA-PKCS1-V1_5")
  -h, --help               help for hash
      --publicKey string   public key certificate file
      --rootCerts string   root certificates file
```

### Description


Print the signature for a dedicated digest value.
	

### Examples

```

$ ocm sign hash key.priv SHA-256:810ff2fb242a5dee4220f2cb0e6a519891fb67f2f828a6cab4ef8894633b1f50

```

### See Also

* [ocm sign](/docs/cli/cli-reference/sign)	 &mdash; Sign components or hashes

