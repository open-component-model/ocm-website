---
title : "Security"
description: ""
lead: ""
date: 2020-10-06T08:48:23+00:00
lastmod: 2020-10-06T08:48:23+00:00
draft: false
images: []
menu:
    project:
        parent: ""
---

## OCM Security
This document defines security reporting, handling and disclosure information for the Open Component Model project.

## Security Process

### Report a Vulnerability


Please do not report security vulnerabilities through public GitHub issues.

Instead, please report them via the SAP Trust Center at [https://www.sap.com/about/trust-center/security/incident-management.html](https://www.sap.com/about/trust-center/security/incident-management.html).

If you prefer to submit via email, please send an email to secure@sap.com. If possible, encrypt your message with our PGP key; please download it from the SAP Trust Center.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- The repository name or URL
- Type of issue (buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of the source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any particular configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly

Further details may be found here: [https://github.com/open-component-model/ocm/security/policy](https://github.com/open-component-model/ocm/security/policy)

### Advisories

Advisories will be published directly on the affected repositories, e.g:

- [https://github.com/open-component-model/ocm/security/advisories](https://github.com/open-component-model/ocm/security/advisories)
- [https://github.com/open-component-model/ocm-controller/security/advisories](https://github.com/open-component-model/ocm-controller/security/advisories)
- [https://github.com/open-component-model/vscode-ocm-tools/security/advisories](https://github.com/open-component-model/vscode-ocm-tools/security/advisories)
