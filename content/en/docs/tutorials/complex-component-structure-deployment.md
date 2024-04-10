---
title: "Deployment scenario using an aggregate(d) component"
description: "Deploying a microservice architecture with components."
date: 2023-06-20T10:00:00+00:00
lastmod: 2023-06-20:00:00+00:00
draft: false
images: []
weight: 65
toc: true
---

## Prerequisite

We assume that the reader has already read all the previous guides in the component area. This guide discusses a more
complex scenario using plain Localizations and Configurations without the use of [Unpacker](https://github.com/open-component-model/unpacker-controller).

## Constructing the Component

We are going to use [podinfo](https://github.com/stefanprodan/podinfo) in microservices mode. This enables us to deploy several components and configure them
individually.

Podinfo has three services which we are going to model using individual component descriptors.
- backend
- frontend
- cache (redis)

We will use the following example application to demonstrate a multi-component structure using `podinfo`: [Podinfo Component](https://github.com/open-component-model/podinfo).

This repository contains the following items:

### Component File

The following component file describes four components: three components that represent the podinfo microservices and one  _aggregate_ component that brings together the podinfo components using _references_.  We refer to the aggregate component as the _product component_.

```yaml
components:
# -- product component
- name: ocm.software/podinfo
  version: 1.0.2
  labels:
  - name: ocm.software/labels/podinfo/purpose
    value:
      - kind: test
        type: manual
  provider:
    name: open-component-model
  componentReferences:
  - name: backend
    componentName: ocm.software/podinfo/backend
    version: 1.0.0
  - name: frontend
    componentName: ocm.software/podinfo/frontend
    version: 1.0.0
  - name: redis
    componentName: ocm.software/redis
    version: 1.0.0
  sources:
  - access:
      commit: ac0afafcf4aa333546634cba631f0090a0a4cbe3
      ref: refs/heads/main
      repoUrl: https://github.com/open-component-model/podinfo
      type: github
    name: github_com_open_component_model_podinfo
    type: git
    version: 1.0.0
# -- backend component
- name: ocm.software/podinfo/backend
  version: 1.0.0
  provider:
    name: open-component-model
  labels:
  - name: ocm.software/labels/podinfo/service
    value: backend
  resources:
  - name: config
    type: configdata.ocm.software
    input:
      type: file
      mediaType: application/yaml
      path: backend/config.yaml
      compress: true
  - name: image
    relation: external
    type: ociImage
    version: 6.2.0
    access:
      type: ociArtifact
      imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
  - name: manifests
    type: kustomize.ocm.fluxcd.io
    input:
      type: dir
      path: backend/manifests
      compress: true
  sources:
  - access:
      commit: 9d294e85d8d3fe7803d1eccbf009619078d30cb9
      ref: refs/heads/main
      repoUrl: https://github.com/open-component-model/podinfo
      type: github
    name: github_com_open_component_model_podinfo
    type: git
    version: 1.0.0
# -- frontend component
- name: ocm.software/podinfo/frontend
  version: 1.0.0
  provider:
    name: open-component-model
  labels:
  - name: ocm.software/labels/podinfo/service
    value: frontend
  resources:
  - name: config
    type: configdata.ocm.software
    input:
      type: file
      mediaType: application/yaml
      path: frontend/config.yaml
      compress: true
  - name: image
    relation: external
    type: ociImage
    version: 6.2.0
    access:
      type: ociArtifact
      imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
  - name: manifests
    type: kustomize.ocm.fluxcd.io
    input:
      type: dir
      path: frontend/manifests
      compress: true
  sources:
  - access:
      commit: 9d294e85d8d3fe7803d1eccbf009619078d30cb9
      ref: refs/heads/main
      repoUrl: https://github.com/open-component-model/podinfo
      type: github
    name: github_com_open_component_model_podinfo
    type: git
    version: 1.0.0
# -- redis component
- name: ocm.software/redis
  version: 1.0.0
  provider:
    name: open-component-model
  labels:
  - name: ocm.software/labels/podinfo/service
    value: redis
  resources:
  - name: config
    type: configdata.ocm.software
    input:
      type: file
      mediaType: application/yaml
      path: redis/config.yaml
      compress: true
  - name: image
    relation: external
    type: ociImage
    version: 6.0.1
    access:
      type: ociArtifact
      imageReference: redis:6.0.1
  - name: manifests
    type: kustomize.ocm.fluxcd.io
    input:
      type: dir
      path: redis/manifests
      compress: true
  sources:
  - access:
      commit: 9d294e85d8d3fe7803d1eccbf009619078d30cb9
      ref: refs/heads/main
      repoUrl: https://github.com/open-component-model/podinfo
      type: github
    name: github_com_open_component_model_podinfo
    type: git
    version: 1.0.0

```

With the components modeled we can start to build a component archive using the `ocm`  cli:

```
ocm add componentversions --create --file component-archive component-constructor.yaml
processing component-constructor.yaml...
  processing document 1...
    processing index 1
    processing index 2
    processing index 3
    processing index 4
found 4 components
adding component ocm.software/podinfo:1.0.2...
  adding reference ocm.software/podinfo/backend: "name"="backend","version"="1.0.0"...
  adding reference ocm.software/podinfo/frontend: "name"="frontend","version"="1.0.0"...
  adding reference ocm.software/redis: "name"="redis","version"="1.0.0"...
adding component ocm.software/podinfo/backend:1.0.0...
  adding resource configdata.ocm.software: "name"="config","version"="<componentversion>"...
  adding resource ociImage: "name"="image","version"="6.2.0"...
  adding resource kustomize.ocm.fluxcd.io: "name"="manifests","version"="<componentversion>"...
adding component ocm.software/podinfo/frontend:1.0.0...
  adding resource configdata.ocm.software: "name"="config","version"="<componentversion>"...
  adding resource ociImage: "name"="image","version"="6.2.0"...
  adding resource kustomize.ocm.fluxcd.io: "name"="manifests","version"="<componentversion>"...
adding component ocm.software/redis:1.0.0...
  adding resource configdata.ocm.software: "name"="config","version"="<componentversion>"...
  adding resource ociImage: "name"="image","version"="6.0.1"...
  adding resource kustomize.ocm.fluxcd.io: "name"="manifests","version"="<componentversion>"...
```

This will create a folder called `component-archive`. The structure of that should look something like this:
```
tree .
.
├── artifact-index.json
└── blobs
    ├── sha256.03ac3a7611e118d08fcf70e9b7be263c4a7082066f9763f71d8901d7fa2afc9d
    ├── sha256.118b6e8282ee1d335b1638a76a20022b6acc319177dbbce3089700da835afb6a
    ├── sha256.12073781e4fba95f19f046c51c90f0c4e1338d47afe4795bf6fcca163ae46eb8
    ├── sha256.1f239399104ec0cc7680956eb60960d212b3368609feb83dac2c95040d24b480
    ├── sha256.3c9c902ce013ca070a29634e4603c90063c96df632ef2c8e6b4447aaeb70b67e
    ├── sha256.3dc6209959eb782fa6f5f44892f66e9657276735bfb40407bd00ddca30d0a9d1
    ├── sha256.654debd65dbadbcee73e55b675980865ddf22acffcec166c59a5e48a213e4dd5
    ├── sha256.699ea8628e39256048cd1687c496fe64999a41f16f200ef5ce938ee9f19c37f0
    ├── sha256.70a47378c043721e3099801dec02c44b1dd9cdef0ebf79c55784eb4666bdbc29
    ├── sha256.773b28fb63f1195ff73e328744639ddc1c574d58c1e723d6e386fcd66b45bd9c
    ├── sha256.893be914eebd8230ef848ea82b3433c6201152f5d9925e7b5b8d68e0cec7133e
    ├── sha256.92991cf391167c928f3afe6891001f3dd325b64ce800cf34fad4c038141fc57f
    ├── sha256.98ca4d46130f5c09a704b3d8ee9af94de3c0ac73d7e990df53e64606c418fea8
    ├── sha256.a779270c2fea310835d3125de90e089e423c9730a98f1acdda328470d21fced0
    ├── sha256.a7dd532f80e8417ed33cf0c97328582847017895fc5146e499bdf4c94a9d17b5
    ├── sha256.cae4365f264251c616210707aa4765bd95f23fd22f98abc68bae9f58d6e4506d
    ├── sha256.ee79c92bbcce9e7a98f07c6577fd56dd45cf6f7c2d3115216ee249f42119030e
    └── sha256.f6a82a23220752c232e5f66ce46f0be28b27a5af19474072c77dac6d1feb0c16

2 directories, 19 files
```

These blobs contain the resources we described when modelling our podinfo application. If we `cat `a random blob we get
something like this:
```
cat sha256.3c9c902ce013ca070a29634e4603c90063c96df632ef2c8e6b4447aaeb70b67e
{"componentDescriptorLayer":{"mediaType":"application/vnd.ocm.software.component-descriptor.v2+yaml+tar","digest":"sha256:699ea8628e39256048cd1687c496fe64999a41f16f200ef5ce938ee9f19c37f0","size":2560}}%
```

Next, we transfer this component to a location of your choice. Here `<your-location>` for me was `ghcr.io/skarlso/demo-component`.

```
ocm transfer component ./component-archive <your-location>
transferring version "ocm.software/podinfo:1.0.2"...
...adding component version...
transferring version "ocm.software/podinfo/backend:1.0.0"...
...resource 0...
...resource 2...
...adding component version...
transferring version "ocm.software/podinfo/frontend:1.0.0"...
...resource 0...
...resource 2...
...adding component version...
transferring version "ocm.software/redis:1.0.0"...
...resource 0...
...resource 2...
...adding component version...
4 versions transferred
```

With the transfer completed, we now have a component version that we can use and deploy throughout this example.

### Podinfo Components

#### Backend

The backend files contain the following relevant data:

- manifests
    - `configmap.yaml`
        - contains configuration options such as `PODINFO_UI_COLOR`
    - `deploy.yaml`
        - the deployment configuration. __Note__ that this deployment yaml contains an attribute `image` that will be configured using the config.yaml explained below.
        ```yaml
            spec:
            containers:
            - name: backend
                image: not-an-image
        ```
    - `kustomization.yaml` makes sure only the relevant files are applied
    - `service.yaml` to expose the service endpoint and make discoverable
- `config.yaml`
    - contains the configuration and localization rules which will be applied to the deployment file.
        - Localization
            - will use an `image` resource to replace the above value for the atribute `image` with the correct one
        - Configuration
            - will use the config information to configure some default values for those values such as color and message.

#### Frontend

Frontend contains the same file structure as backend. The only differences are the deployed services.

#### Cache

The cache contains the same resources as backend. The only differences are the values of those deployments.

## Constructing the Kubernetes Objects

### ComponentVersion

We start by creating an image pull secret since the component that we just transferred was placed in a private OCI registry. The pull secret will be
used by the OCM client or OCM controller to access this package in ghcr. To create the secret, run:

```
kubectl create secret docker-registry pull-secret -n ocm-system \
    --docker-server=ghcr.io \
    --docker-username=$GITHUB_USER \
    --docker-password=$GITHUB_TOKEN \
    --docker-email=$GITHUB_EMAIL
```

Now we create a `ComponentVersion` custom resource that will trigger a reconcile of the podinfo component.

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfocomponent-version
  namespace: ocm-system
spec:
  component: ocm.software/podinfo
  interval: 10m0s
  references:
    expand: true
  repository:
    url: <your-location> # this is where you transferred the component to
    secretRef:
      name: pull-secret
  version:
    semver: 1.0.2
```

This will reconcile the `ComponentDescriptor` for the specific version, making the component metadata available for
other Kubernetes resources to consume. If everything was successful, we can inspect the created component version:

```
kubectl describe componentversion -n ocm-system podinfocomponent-version
```

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentVersion
metadata:
  name: podinfocomponent-version
  namespace: ocm-system
spec:
  component: ocm.software/podinfo
  interval: 10m0s
  references:
    expand: true
  repository:
    url: <your-location>
  serviceAccountName: admin-account
  version:
    semver: 1.0.2
status:
  componentDescriptor:
    componentDescriptorRef:
      name: ocm.software-podinfo-1.0.2-2456627037531301773
      namespace: ocm-system
    name: ocm.software/podinfo
    references:
    - componentDescriptorRef:
        name: ocm.software-podinfo-backend-1.0.0-3945706267509967991
        namespace: ocm-system
      name: backend
      version: 1.0.0
    - componentDescriptorRef:
        name: ocm.software-podinfo-frontend-1.0.8-11612684200430752646
        namespace: ocm-system
      name: frontend
      version: 1.0.8
    - componentDescriptorRef:
        name: ocm.software-redis-1.0.0-6199010409340612397
        namespace: ocm-system
      name: redis
      version: 1.0.0
    version: 1.0.2
  conditions:
  - lastTransitionTime: "2023-06-21T10:59:22Z"
    message: 'Applied version: '
    observedGeneration: 1
    reason: Succeeded
    status: "True"
    type: Ready
  observedGeneration: 1
  reconciledVersion: 1.0.2

```

The important bits here are the `references`. These are all the components that the top component contains. These references are used to fetch and identify component dependencies. This component will also contain which version was last reconciled.

### ComponentDescriptor

We can also examine the component descriptors using the following command:
```kubectl get componentdescriptors```

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: ComponentDescriptor
metadata:
  name: ocm.software-podinfo-backend-1.0.0-3945706267509967991
  namespace: ocm-system
spec:
  resources:
  - access:
      globalAccess:
        digest: sha256:4a9fd7d9d861aff437746c170b199d15539044405f1b822e316ef49ac5f99db8
        mediaType: application/yaml
        ref: ghcr.io/skarlso/podify/component-descriptors/ocm.software/podinfo/backend
        size: 354
        type: ociBlob
      localReference: sha256:4a9fd7d9d861aff437746c170b199d15539044405f1b822e316ef49ac5f99db8
      mediaType: application/yaml
      type: localBlob
    name: config
    relation: local
    type: configdata.ocm.software
    version: 1.0.0
  - access:
      imageReference: ghcr.io/stefanprodan/podinfo:6.2.0
      type: ociArtifact
    name: image
    relation: external
    type: ociImage
    version: 6.2.0
  - access:
      globalAccess:
        digest: sha256:c61bc74d0b5ecfcca20b447c10d97d07a3cec649e1fc57a25f08fc93fcf42fde
        mediaType: application/x-tgz
        ref: ghcr.io/skarlso/podify/component-descriptors/ocm.software/podinfo/backend
        size: 963
        type: ociBlob
      localReference: sha256:c61bc74d0b5ecfcca20b447c10d97d07a3cec649e1fc57a25f08fc93fcf42fde
      mediaType: application/x-tgz
      type: localBlob
    name: manifests
    relation: local
    type: kustomize.ocm.fluxcd.io
    version: 1.0.0
  version: 1.0.0
```

This descriptor specifies the location of the component's resource based on the current context (`globalAccess`). We can use this information to retrieve the resource from a storage layer that is accessible within our current environment.

### Localizations, Configurations and FluxDeployer

Here, we will create the localization and configuration YAML by hand and then apply it to the cluster.

We have to create three of each of these components. Localization, Configuration and a FluxDeployer. One for each
component version.

#### Backend

Both, localization and configuration, are in the ConfigData object. So we point to that. The controller will use the
`image` resource to localize the backend image. This is how it's defined in the localizations rule:

```yaml
localization:
- resource:
    name: image
  file: deploy.yaml
  image: spec.template.spec.containers[0].image
```

Now, let's construct these objects:

```yaml
# Localization
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: backend-localization
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: backend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: manifests
      referencePath:
      - name: backend
      version: 1.0.0
```

```yaml
# Configuration
apiVersion: delivery.ocm.software/v1alpha1
kind: Configuration
metadata:
  name: backend-configuration
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: backend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Localization
    name: backend-localization
    namespace: ocm-system
```

Finally, let's add the FluxDeployer too, which makes sure that this component is deployed to the target location.

```yaml
# FluxDeployer
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: backend-kustomization
  namespace: ocm-system
spec:
  kustomizationTemplate:
    prune: true
    targetNamespace: default
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Configuration
    name: backend-configuration
    namespace: ocm-system
```

And that's it.

The components can be found under [podinfo/backend/components](https://github.com/open-component-model/podinfo/tree/f6fd27a94a5cf39784754858bd2a139bd90e0ad9/backend/components).

To apply them, simply run this command from the podinfo root:

```
kubectl apply -f backend/components
```

#### Frontend

We do the same for the Frontend component:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: frontend-localization
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: frontend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: manifests
      referencePath:
      - name: frontend
      version: 1.0.0
```

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Configuration
metadata:
  name: frontend-configuration
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: frontend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Localization
    name: frontend-localization
    namespace: ocm-system
```

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: frontend-kustomization
  namespace: ocm-system
spec:
  kustomizationTemplate:
    prune: true
    targetNamespace: default
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Configuration
    name: frontend-configuration
    namespace: ocm-system
```

To apply them, simply run this command from the podinfo root:

```
kubectl apply -f frontend/components
```

#### Redis

Redis is exactly the same as the above two. Just with different names and pointing to the redis resource. Try creating
these yourself to see if you understood the structure. If you get stuck, you can always take a peek under
[podinfo/redis/components](https://github.com/open-component-model/podinfo/tree/f6fd27a94a5cf39784754858bd2a139bd90e0ad9/redis/components).

To apply them, simply run this command from the podinfo root:

```
kubectl apply -f redis/components
```

## Understanding the moving parts

How does the whole flow work?

![flow](/images/demo-workflow.png)

The `ocm-controller` creates `ComponentDescriptor` resources for each referenced component version. Those component descriptors
contain all the resources that those versions have, such as manifest files, configuration files, deployment files, etc.

It will use this dependency graph to lookup resource data in the right component version.

Let's take a look at each object in the cluster next.

```shell
kubectl get localizations -A
NAMESPACE    NAME                    READY   SOURCE VERSION   CONFIG VERSION   AGE
ocm-system   backend-localization    True    1.0.16           1.0.16           5m
ocm-system   cache-localization      True    1.0.16           1.0.16           5m
ocm-system   frontend-localization   True    1.0.16           1.0.16           5m
➜  k get configuration -A
NAMESPACE    NAME                     READY   SOURCE VERSION   CONFIG VERSION   AGE
ocm-system   backend-configuration    True    1.0.16           1.0.16           4m25s
ocm-system   cache-configuration      True    1.0.16           1.0.16           4m25s
ocm-system   frontend-configuration   True    1.0.16           1.0.16           4m25s
➜  k get fluxdeployer -A
NAMESPACE    NAME                     READY   AGE
ocm-system   backend-kustomization    True    3m55s
ocm-system   cache-kustomization      True    3m45s
ocm-system   frontend-kustomization   True    3m35s
➜  k get snapshot -A
NAMESPACE    NAME                             READY   STATUS
ocm-system   backend-configuration-v5l2oag    True    Snapshot with name 'backend-configuration-v5l2oag' is ready
ocm-system   backend-localization-uvnrzql     True    Snapshot with name 'backend-localization-uvnrzql' is ready
ocm-system   cache-configuration-kcjiqzy      True    Snapshot with name 'cache-configuration-kcjiqzy' is ready
ocm-system   cache-localization-u2h3old       True    Snapshot with name 'cache-localization-u2h3old' is ready
ocm-system   frontend-configuration-ut3u6pm   True    Snapshot with name 'frontend-configuration-ut3u6pm' is ready
ocm-system   frontend-localization-tgqfwwk    True    Snapshot with name 'frontend-localization-tgqfwwk' is ready
➜  k get componentversion -A
NAMESPACE    NAME                       READY   VERSION   AGE    STATUS
ocm-system   podinfocomponent-version   True    1.0.16    9m8s   Applied version: 1.0.16
➜  k get componentdescriptor -A
NAMESPACE    NAME                                                       AGE
ocm-system   ocm.software-podinfo-1.0.16-2456627037531301773            9m27s
ocm-system   ocm.software-podinfo-backend-1.0.0-3945706267509967991     9m25s
ocm-system   ocm.software-podinfo-frontend-1.0.8-11612684200430752646   9m23s
ocm-system   ocm.software-redis-1.0.0-6199010409340612397               9m21s
```

All of the components should have their Localization, Configuration, and FluxDeployer.

### Localization

A localization should look something like this:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Localization
metadata:
  name: backend-localization
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: backend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: manifests
      referencePath:
      - name: backend
      version: 1.0.0
status:
  conditions:
  - lastTransitionTime: "2023-06-20T12:28:47Z"
    message: Reconciliation success
    observedGeneration: 1
    reason: Succeeded
    status: "True"
    type: Ready
  latestConfigVersion: 1.0.16
  latestSourceVersion: 1.0.16
  observedGeneration: 1
  snapshotName: backend-localization-uvnrzql
```

The important fields are `configRef` and `sourceRef`. The `configRef` points to the resource that contains our
localization rules:

```yaml
localization:
- resource:
    name: image
  file: deploy.yaml
  image: spec.template.spec.containers[0].image
```

This will change the image in our deployment in the file `deploy.yaml` to the `image` resource we have in the podinfo
example.

The `sourceRef` is pointing to the component version to fetch the manifests from.

### Configuration

Let's take a look at the configuration object next (very similar to localization):

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Configuration
metadata:
  name: backend-configuration
  namespace: ocm-system
spec:
  configRef:
    kind: ComponentVersion
    name: podinfocomponent-version
    namespace: ocm-system
    resourceRef:
      name: config
      referencePath:
      - name: backend
      version: 1.0.0
  interval: 10m0s
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Localization
    name: backend-localization
    namespace: ocm-system
status:
  conditions:
  - lastTransitionTime: "2023-06-20T12:28:47Z"
    message: Reconciliation success
    observedGeneration: 2
    reason: Succeeded
    status: "True"
    type: Ready
  latestConfigVersion: 1.0.16
  latestSourceVersion: 1.0.16
  observedGeneration: 2
  snapshotName: backend-configuration-v5l2oag
```

The important details here are the `configRef` field and the `sourceRef` field. The `configRef` field defines where the
configuration values are located at:

```yaml
configuration:
  defaults:
    message: "Welcome to the backend service"
  schema:
    type: object
    additionalProperties: false
    properties:
      replicas:
        type: string
      message:
        type: string
  rules:
  - value: (( message ))
    file: configmap.yaml
    path: data.PODINFO_UI_MESSAGE
```

**Note**. This configuration has a source that is pointing at the `Localization` resource that we created. This is
important because the configuration needs to work on the localized entities. Once reconciled, it will create a
`Snapshot`. That snapshot contains the input resources that have been transformed using the supplied configuration rules.

### FluxDeployer

Next, comes the `FluxDeployer`. The `FluxDeployer` will point to the last Snapshot in the chain of transformations
which is the `Configuration`. It looks something like this:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: FluxDeployer
metadata:
  name: backend-kustomization
  namespace: ocm-system
spec:
  kustomizationTemplate:
    prune: true
    targetNamespace: default
  sourceRef:
    apiVersion: delivery.ocm.software/v1alpha1
    kind: Configuration
    name: backend-configuration
    namespace: ocm-system
status:
  conditions:
  - lastTransitionTime: "2023-06-20T12:29:23Z"
    message: FluxDeployer 'backend-kustomization' is ready
    observedGeneration: 2
    reason: Succeeded
    status: "True"
    type: Ready
  kustomization: ocm-system/backend-kustomization
  observedGeneration: 2
```

This creates a [Kustomization](https://fluxcd.io/flux/components/kustomize/kustomization/) object. The Kustomization
object is used to reconcile the created component into the target namespace. We have three of these for each component
for which we would like to apply the results.

## Troubleshooting

Once all objects are applied, we should see `podinfo` deployed in the `default` namespace:

```
kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
backend-6dd8f5fbf8-xfdmq    1/1     Running   0          54m
frontend-56ff5b9864-h8fgh   1/1     Running   0          54m
redis-7475dd84c4-hzp2b      1/1     Running   0          54m
```

__Note__: pod count might vary based on the default settings in the configuration data.

If the deployment isn't appearing, there are several places to check for errors:

**Flux**:

Maybe Flux didn't kick in yet. Try to force a reconcile by running:

```
flux reconcile source git flux-system -n flux-system
```

**Events**:

Kubernetes Events could hold some extra information. List the most recent ones with:

```
kubectl events -A
```

**Logs**:

Sometimes, you can see errors in the `source-controller` failing to get the right resources. Or `kustomize-controller`
doesn't understand something. We'll go into getting logs in [Controller Logs](#controller-logs) section.

**Object Status**:

Many of the objects have a status with the most recent error on them. The relevant objects in this case are the
`FluxDeployer` and the `OCIRepository` objects. Make sure they have successful statuses.

```
kubectl get ocirepositories -A
NAMESPACE    NAME                     URL                                                                        READY   STATUS                                                                                                      AGE
ocm-system   backend-kustomization    oci://registry.ocm-system.svc.cluster.local:5000/sha-3644589785534619751   True    stored artifact for digest '2234@sha256:12100267c60d3eb5acfc564b56eb94288e33fa875c7f2191ec0a662594283ad0'   5m17s
ocm-system   cache-kustomization      oci://registry.ocm-system.svc.cluster.local:5000/sha-3644589785534619751   True    stored artifact for digest '2393@sha256:f12873dff8d8f91b5d917711f0d7d20ebc85dbfc1652bf01c8b50dc198d7f32d'   4m57s
ocm-system   frontend-kustomization   oci://registry.ocm-system.svc.cluster.local:5000/sha-3644589785534619751   True    stored artifact for digest '2539@sha256:1a37fdfbf0f109498b813bbd784a81c8b1a818d4770a49a319cc2562621dcf40'   4m47s
```

```
kubectl get fluxdeployer -A
NAMESPACE    NAME                     READY   AGE
ocm-system   backend-kustomization    True    8m13s
ocm-system   cache-kustomization      True    7m53s
ocm-system   frontend-kustomization   True    7m43s
```

### Controller Logs

There are several controllers to sift through in case something doesn't happen the way it should.

#### ocm-controller

To get the `ocm-controller` logs run:

```
kubectl logs `k get pods --template '{{range .items}}{{.metadata.name}}{{end}}' --selector=app=ocm-controller -n ocm-system` -n ocm-system
```

If everything goes according to plan, there should be no errors in the logs.

#### Flux controllers

Flux has a couple of controllers we can check if things don't start up (especially if we don't see any resources in the
cluster, or if we don't see the podinfo deployment being started).

**source-controller**:
  This controller will contain information about the latest applied code from the repository. If there is an error here
  it means that the source, or rather our modifications, weren't applied.

**kustomize-controller**:
  This controller will contain information about reconciled objects. A Kustomization source is usually either a
  GitRepository or an OCIRepository. In this case, the source will be an OCIRepositoy. That repository is pointing to
  the in-cluster OCI repository. A snapshot creates these entries and that's where it loads the data from.

The **helm-controller** and **notification-controller** aren't relevant.

### Object statuses

**ComponentVersion**:

The `ComponentVersion` object contains information about what components have been reconciled. We talked about that
earlier at [Component Version](#componentversion). The `Status` section contains any errors that could have
occurred when reconciling information. If you find that the references section is empty, your component version is missing
`expand: true` setting.

**ComponentDescriptor**:

The `ComponentDescriptor` holds information about each component and their resources. Read more at [ComponentDescriptors](#componentdescriptor).

If the resources section is empty in the `status`, there is something wrong reconciling the individual items.

**Localization**:

The status section contains information about the snapshot that this object created. The snapshot is used to point
to the right repository in the internal OCI cache. It also contains the last applied version. The conditions
section will contain any errors while reconciling the resource.

**Configuration**:

The status section contains information about the snapshot that this object created. The snapshot is used to point
to the right repository in the internal OCI cache. It also contains the last applied version. The conditions
section will contain any errors while reconciling the resource.

**Snapshots**:

The Snapshot, most of the time, is transparent to the user. The sources are Snapshot providers. That means any object
that can produce a Snapshot can be a source to a Localization, Configuration or a Resource object. A Source is a thing
from which to fetch resource data such as Manifests, rules, Markdown files, descriptors, etc.

We can also use Snapshots to look for errors in reconciling resource data. A Snapshot's status contains information.

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Snapshot
metadata:
  creationTimestamp: "2023-06-21T10:49:35Z"
  finalizers:
  - finalizers.snapshot.ocm.software
  generation: 2
  name: backend-configuration-2agwrnt
  namespace: ocm-system
  ownerReferences:
  - apiVersion: delivery.ocm.software/v1alpha1
    kind: Configuration
    name: backend-configuration
    uid: dfb8dede-5234-406c-8077-fc5e382ec8fd
  resourceVersion: "4591"
  uid: b8c0b983-9c27-4597-92b1-fe19aad2abca
spec:
  digest: sha256:1f5f6173f3180c2fda00dd1267ca190628a2e8b5fa707232cebc9059f7845e29
  identity:
    component-name: ocm.software-podinfo-1.0.16-2456627037531301773
    component-version: 1.0.16
    resource-name: config
    resource-version: 1.0.0
  tag: "1533"
status:
  conditions:
  - lastTransitionTime: "2023-06-21T10:49:35Z"
    message: Snapshot with name 'backend-configuration-2agwrnt' is ready
    observedGeneration: 2
    reason: Succeeded
    status: "True"
    type: Ready
  digest: sha256:1f5f6173f3180c2fda00dd1267ca190628a2e8b5fa707232cebc9059f7845e29
  observedGeneration: 2
  repositoryURL: http://registry.ocm-system.svc.cluster.local:5000/sha-2819236492453137798
  tag: "1533"
```

This Snapshot contains a lot of information about what has been replicated in the internal registry. We can use `crane`
to fetch it and check the generated content.

**FluxDeployer**:

FluxDeployer is used to apply the generated objects to a cluster. In the background, it's leveraging Flux's
Kustomization object. This object's status will contain any errors that could occur during applying generated content,
like invalid data, invalid CRDs, invalid yaml, no access to the cluster, permission issues, etc. Each component has a
`FluxDeployer` applying some kind of component data to the cluster such as, Deployments, ConfigMaps,
ReplicaSets, etc.

**OCIRepository**:

There should be one OCIRepository resource per component. The OCIRepository is created by the FluxDeployer. OCIRepository will
contain any errors regarding the content of the internal registry.

**Kustomization**:

Kustomization objects are also created by the FluxDeployer. These objects will contain applying errors.

### Common issues

**tar header invalid**:

Usually, this means that the content we are trying to sync from the OCIRepository is not a tar file. This can happen if
the resource wasn't a `Directory` or if the fetching of the data somehow failed.

To verify, we can use [crane](https://github.com/google/go-containerregistry/blob/main/cmd/crane/doc/crane.md) to check the content.

To run crane, first, expose the internal registry using `port-forward` like this:
```
kubectl port-forward service/registry -n ocm-system 5000:5000
```

Then, verify that the connection is working by running a `catalog` command:
```
crane catalog http://127.0.0.1:5000
```

This should list something like this:
```
crane catalog 127.0.0.1:5000
sha-10883673987458280187
sha-16809550111814969680
sha-1990151198423805921
sha-2092408510764941850
sha-2819236492453137798
sha-6687852683187729914
sha-9139473762086563639
```

To identify which of these contains our failed resource, check the failing OCIRepository object.

```
kubectl get ocirepository -A
NAMESPACE    NAME      URL                                                                         READY   STATUS                                                                                       AGE
ocm-system   podinfo   oci://registry.ocm-system.svc.cluster.local:5000/sha-10883673987458280187   False   failed to extract layer contents from artifact: tar error: archive/tar: invalid tar header   21h
```

Now we know which of these contains the invalid resource. We can further identify which blob it is by either, describing the
relevant snapshot, or by running a `manifest` command with crane.

```
crane manifest 127.0.0.1:5000/sha-10883673987458280187:1.0.0|jq
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
  "config": {
    "mediaType": "application/vnd.docker.container.image.v1+json",
    "size": 233,
    "digest": "sha256:6e3b5d3bfbd044c33125f20d83c2b82cd1c348b58422df4859678bc0e6c8aed5"
  },
  "layers": [
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "size": 1044,
      "digest": "sha256:eae39564a446ee92d1fec8728ef0c27077995d01bbedc25e0688a1cbb7582adc"
    }
  ]
}
```

One of these will not be what they seem. To fetch a blob run:

```
crane blob 127.0.0.1:5000/sha-10883673987458280187@sha256:eae39564a446ee92d1fec8728ef0c27077995d01bbedc25e0688a1cbb7582adc > temp.tar
```

And then check what that `temp.tar` looks like. If the content is human-readable, there is a problem. If you encounter
the `component descriptor` file, you can skip that. That's not what you are looking for.

## Conclusion

We saw how to deploy a complex, multi-service architecture using the podinfo application.
