---
title: hash
name: sign hash
url: /docs/cli/sign/hash/
date: 2024-03-08T16:14:19Z
draft: false
images: []
menu:
  docs:
    parent: sign
toc: true
isCommand: true
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

* [ocm sign](/docs/cli/sign)	 &mdash; Sign components or hashes

