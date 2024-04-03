---
title: install
name: controller install
url: /docs/cli/controller/install/
date: 2024-04-03T14:21:11+02:00
draft: false
images: []
menu:
  docs:
    parent: controller
toc: true
isCommand: true
---
### Usage

```
ocm controller install controller {--version v0.0.1}
```

### Options

```
  -u, --base-url string                       the base url to the ocm-controller's release page (default "https://github.com/open-component-model/ocm-controller/releases")
      --cert-manager-base-url string          the base url to the cert-manager's release page (default "https://github.com/cert-manager/cert-manager/releases")
      --cert-manager-release-api-url string   the base url to the cert-manager's API release page (default "https://api.github.com/repos/cert-manager/cert-manager/releases")
      --cert-manager-version string           version for cert-manager (default "v1.13.2")
  -c, --controller-name string                name of the controller that's used for status check (default "ocm-controller")
  -d, --dry-run                               if enabled, prints the downloaded manifest file
  -h, --help                                  help for install
  -i, --install-prerequisites                 install prerequisites required by ocm-controller (default true)
  -n, --namespace string                      the namespace into which the controller is installed (default "ocm-system")
  -a, --release-api-url string                the base url to the ocm-controller's API release page (default "https://api.github.com/repos/open-component-model/ocm-controller/releases")
  -s, --skip-pre-flight-check                 skip the pre-flight check for clusters
  -t, --timeout duration                      maximum time to wait for deployment to be ready (default 1m0s)
  -v, --version string                        the version of the controller to install (default "latest")
```

### See Also

* [ocm controller](/docs/cli/controller)	 &mdash; Commands acting on the ocm-controller

