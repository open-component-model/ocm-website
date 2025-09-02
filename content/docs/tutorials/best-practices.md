---
title: "Best Practices"
description: "Best practices for working with the Open Component Model."
icon: "✅"
weight: 63
toc: true
---

This chapter contains guidelines for common scenarios how to work with the Open Component Model, focusing on using CI/CD, build and publishing processes.

- [Use Public Schema for Validation and Auto-Completion of Component Descriptors](#use-public-schema-for-validation-and-auto-completion-of-component-descriptors)
- [Separate Build and Publish Processes](#separate-build-and-publish-processes)
- [Pipeline Integration](#pipeline-integration)
- [Static and Dynamic Variable Substitution](#static-and-dynamic-variable-substitution)
  - [Example Substitution File](#example-substitution-file)
- [Debugging: Explain the Blobs Directory](#debugging-explain-the-blobs-directory)
- [Self-Contained Transport Archives](#self-contained-transport-archives)
- [CICD Integration](#cicd-integration)

## Use Public Schema for Validation and Auto-Completion of Component Descriptors

The Open Component Model (OCM) provides a public schema to validate and offer auto-completion of component constructor files
used to create component descriptors.
This schema is available at [https://ocm.software/schemas/configuration-schema.yaml](https://ocm.software/schemas/configuration-schema.yaml).

To use this schema in your IDE, you can add the following line to your component constructor file:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
```

This line tells the YAML language server to use the OCM schema for validation and auto-completion.

## Separate Build and Publish Processes

Traditional automated builds often have unrestricted internet access, which can lead to several challenges in enterprise environments:

- Limited control over downloaded artifacts
- Potential unavailability of required resources
- Security risks associated with write permissions to external repositories

Best practice: Implement a two-step process:
a) Build: Create artifacts in a controlled environment, using local mirrors when possible.
b) Publish: Use a separate, secured process to distribute build results.

OCM supports this approach through filesystem-based OCM repositories, allowing you to generate Common Transport Format (CTF) archives for component versions.
These archives can then be securely processed and distributed.

## Pipeline Integration

Pipeline infrastructures are heterogeneous, so there is no universal answer how to
integrate a build pipeline with OCM. Usually, the simplest way is using the OCM command line interface.
Following you will find an example using GitHub actions.

There are two repositories dealing with GitHub actions:
The [first one](https://github.com/open-component-model/ocm-action) provides various actions that can be
called from a workflow. The [second one](https://github.com/open-component-model/ocm-setup-action)
provides the required installation of the OCM CLI into the container.

An typical workflow for a build step will create a component version and a transport archive:

```yaml
jobs:
  create-ocm:
    runs-on: ubuntu-latest
    steps:
      ...
      - name: setup OCM
        uses: open-component-model/ocm-setup-action@main
      ...
      - name: create OCM component version
        uses: open-component-model/ocm-action@main
        with:
          action: create_component
          component: acme.org/demo/simpleserver
          provider: ${{ env.PROVIDER }}
          version: github.com/jensh007
      ...
```

This creates a component version for the current build. Additionally, a CTF archive
can be created or the component version along with the built container images can be uploaded to an
OCI registry, etc.

More documentation is available [here](https://github.com/open-component-model/ocm-action). A full
example can be found in the sample Github repository.

## Static and Dynamic Variable Substitution

Looking at the [settings file](/docs/tutorials/build-deploy-applications-with-helm-and-ocm/#building-the-common-transport-archive-ctf) shows that
some variables like the `version` or the `commit` change with every build
or release. In many cases, these variables will be auto-generated during the build.

Other variables like the version of 3rd-party components will just change from time to
time and are often set manually by an engineer or release manager. It is useful to separate
between static and dynamic variables. Static files can be checked-in into the source control system and
are maintained manually. Dynamic variables can be generated during the build.

### Example Substitution File

The following example shows how to separate static and dynamic variables.

Static settings, manually maintained:

```yaml
NAME: microblog
COMPONENT_NAME_PREFIX: github.com/acme.org/microblog
PROVIDER: ocm.software
ELASTIC_VERSION: 8.5.1
MARIADB_VERSION: 10.6.11
MARIADB_CHART_VERSION: 11.4.2
NGINX_VERSION: 1.5.1
NGINX_CHART_VERSION: 4.4.2
```

auto-generated from a build script:

```yaml
VERSION: 0.23.1
COMMIT: 5f03021059c7dbe760ac820a014a8a84166ef8b4
```

```shell
ocm add componentversions --create --file ../gen/ctf --settings ../gen/dynamic_settings.yaml --settings static_settings.yaml component-constructor.yaml
```

## Debugging: Explain the Blobs Directory

For analyzing and debugging the content of a CTF archive, there are some supportive commands
to analyze what is contained in the archive and what is stored in which blob:

```shell
tree ../gen/ctf
../gen/ctf
├── artifact-index.json
└── blobs
    ├── ...
    ├── sha256.59ff88331c53a2a94cdd98df58bc6952f056e4b2efc8120095fbc0a870eb0b67
    ├── ...
```

```shell
ocm get resources -r -o wide ../gen/ctf
...
---
REFERENCEPATH: github.com/acme.org/microblog/nginx-controller:1.5.1
NAME         : nginx-controller-chart
VERSION      : 1.5.1
IDENTITY     :
TYPE         : helmChart
RELATION     : local
ACCESSTYPE   : localBlob
ACCESSSPEC   : {"localReference":"sha256:59ff88331c53a2a94cdd98df58bc6952f056e4b2efc8120095fbc0a870eb0b67","mediaType":"application/vnd.oci.image.manifest.v1+tar+gzip","referenceName":"github.com/acme.org/microblog/nginx-controller/ingress-nginx:4.4.2"}
...
```

## Self-Contained Transport Archives

The transport archive created from a component constructor file, using the command `ocm add  componentversions --create ...`, does not automatically resolve image references to external OCI registries and stores them in the archive. If you want to create a self-contained transport archive with all images stored as local artifacts, you need to use the `--copy-resources` option in the `ocm transfer ctf` command. This will copy all external images to the blobs directory of the archive.

```shell
ocm transfer ctf --copy-resources <ctf-dir> <new-ctf-dir-or-oci-repo-url>
```

Note that this archive can become huge, depending on the size of the external images !

## CICD Integration

Configure rarely changing variables in a static file and generate dynamic variables
during the build from the environment. See the [Static and Dynamic Variable Substitution](#static-and-dynamic-variable-substitution) section above.
