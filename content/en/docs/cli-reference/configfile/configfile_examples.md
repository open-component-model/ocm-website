---
title: Config File Examples
name: Config File Examples
url: /docs/cli/configfile/examples/
date: 2023-12-11T10:43:19Z
draft: false
images: []
menu:
  docs:
    parent: configfile
toc: true
isCommand: false
---

### Reference an existing Docker config.json:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: "~/.docker/config.json"
          propagateConsumerIdentity: true
```

### Configure multiple Consumers, Cache and Signing

Configuring an existing Docker config json and two additional consumers
for a Github repository and a Helm chart repository.
Caching for OCM component versions is switched on.
A key pair for signing / verifiying OCM component versions has been configured, too.

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software
    consumers:
      - identity:
          type: HelmChartRepository
          hostname: my.repository.mycomp.com
          pathprefix: artifactory/myhelm-repo
          port: "443"
        credentials:
          - type: Credentials
            properties:
              username: myuser
              password: 8eYwL5Ru44L6ZySyLUcyP
      - identity:
          type: Github
          hostname: github.com
        credentials:
          - type: Credentials
            properties:
              token: ghp_QRP489abcd1234A9q3x17a8BlD42kabv65
    repositories:
      - repository:
          type: DockerConfig/v1
          dockerConfigFile: ~/.docker/config.json
          propagateConsumerIdentity: true
  - type: attributes.config.ocm.software
    attributes:
      cache: ~/.ocm/cache
  - type: keys.config.ocm.software
    privateKeys:
      sap.com:
        path: /Users/myuser/.ocm/keys/mycomp.com.key
    publicKeys:
      sap.com:
        path: /Users/myuser/.ocm/keys/mycomp.com.pub
```

### See Also

* [Config File](/docs/cli/configfile)	 &mdash; OCM CLI configuration file