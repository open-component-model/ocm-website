---
title: "Installation"
description: ""
lead: ""
date: 2022-08-12T10:37:58+01:00
lastmod: 2022-08-12T10:37:58+01:00
draft: false
images: []
menu:
  docs:
    parent: ""
    identifier: "installation-4eb8cf9f3d7805b0e5196aeb3679fabf"
weight: 101
toc: true
---

#### Disclaimer
> Currently it is only possible to install the `ocm` CLI manually, in the future we plan to support the standard distribution methods.


### Prerequisites

- git
- make
- golang

### Installation Process

Clone the `open-component-model/ocm` repo:

```bash
git clone https://github.com/open-component-model/ocm
```

Enter the repository directory (`cd ocm/`) and install the cli using make:

```bash
make install
```

> Please note that the OCM CLI is installed in your `go/bin` directory, so you might need to add this directory to your `PATH`.

Verify the installation:

```bash
ocm version
```


