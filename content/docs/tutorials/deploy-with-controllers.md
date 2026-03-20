---
title: "Deploy with Controllers"
description: "Deploy a simple manifest using an OCM component version and the Deployer controller object."
icon: "🚀"
weight: 55
toc: true
---

This tutorial walks you through deploying a Helm chart from an OCM component version to a Kubernetes cluster
using the OCM Controllers.

## Prerequisites

- [Controller environment]({{< relref "setup-controller-environment.md" >}})
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- Access to an OCI registry (e.g., [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages))
- A GitHub account with a personal access token
- Any extra RBAC has been configured by following [Custom RBAC guide]({{<relref "custom-rbac.md">}})

## Environment Setup

Before starting, set environment variables for your GitHub username and OCM repository name:

```bash
export GITHUB_USERNAME=<your-github-username>
export OCM_REPO=ghcr.io/$GITHUB_USERNAME/ocm-tutorial
```

These variables will be used in registry paths throughout the tutorial.

In this approach we will use a simple Deployer to deploy an `deployment.yaml` manifest that contains installation
files for the simple [podinfo](https://github.com/stefanprodan/podinfo) application.

## Create a component

Let's start by creating a temporary directory:

```shell
mkdir /tmp/helm-deploy && cd /tmp/helm-deploy
```

This will be our working folder.

### Define the component

Create a `deployment.yaml` file with the following content:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: podinfo
spec:
  minReadySeconds: 3
  revisionHistoryLimit: 5
  progressDeadlineSeconds: 60
  strategy:
    rollingUpdate:
      maxUnavailable: 0
    type: RollingUpdate
  selector:
    matchLabels:
      app: podinfo
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9797"
      labels:
        app: podinfo
    spec:
      containers:
      - name: podinfod
        image: ghcr.io/stefanprodan/podinfo:6.11.1
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 9898
          protocol: TCP
        - name: http-metrics
          containerPort: 9797
          protocol: TCP
        - name: grpc
          containerPort: 9999
          protocol: TCP
        command:
        - ./podinfo
        - --port=9898
        - --port-metrics=9797
        - --grpc-port=9999
        - --grpc-service-name=podinfo
        - --level=info
        - --random-delay=false
        - --random-error=false
        env:
        - name: PODINFO_UI_COLOR
          value: "#34577c"
        livenessProbe:
          exec:
            command:
            - podcli
            - check
            - http
            - localhost:9898/healthz
          initialDelaySeconds: 5
          timeoutSeconds: 5
        readinessProbe:
          exec:
            command:
            - podcli
            - check
            - http
            - localhost:9898/readyz
          initialDelaySeconds: 5
          timeoutSeconds: 5
        resources:
          limits:
            cpu: 2000m
            memory: 512Mi
          requests:
            cpu: 100m
            memory: 64Mi
        volumeMounts:
          - name: data
            mountPath: /data
      volumes:
        - name: data
          emptyDir: {}

```

Next, create a `component-constructor.yaml` file that includes the above manifest. This tells OCM what software artifact (in this case a Deployment) to track as part of this component version:

```yaml
components:
  - name: ocm.software/ocm-k8s-toolkit/simple
    provider:
      name: ocm.software
    version: "1.0.0"
    resources:
      - name: deployment-resource
        type: blob
        version: "1.0.0"
        input:
          type: file
          path: ./deployment.yaml
```

### Build and push the component version

The `--repository` flag pushes the component version directly to the OCI registry, so no separate transfer step is needed.

```shell
ocm add cv --repository $OCM_REPO
```

By default, this looks for `component-constructor.yaml` in the current directory. If you wish to use a different filename,
you can define a name with the `--constructor` flag.

<details>
<summary>Expected output</summary>

```text
COMPONENT                           │ VERSION │ PROVIDER
────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/simple │ 1.0.0   │ ocm.software
```

</details>

### Verify the upload

```shell
ocm get cv $OCM_REPO//ocm.software/ocm-k8s-toolkit/simple:1.0.0
```

<details>
<summary>Expected output</summary>

```text
COMPONENT                           │ VERSION │ PROVIDER
────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/simple │ 1.0.0   │ ocm.software
```

</details>

{{<callout context="note">}}
By default, packages created in GitHub Container Registry are _private_. Either make them public or [configure credentials]({{<relref "configure-credentials-for-controllers.md">}}) for the OCM controller resources.
{{</callout>}}

## Create Resources for the controller

Now, we are going to apply for objects for the controller to be able to pick up and deploy the above resource.

Put them together into one file for convenience. Create `bootstrap.yaml` file with the following content:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: bootstrap-repository
spec:
  repositorySpec:
    baseUrl: $OCM_REPO
    type: OCIRepository
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Component
metadata:
  name: bootstrap-component
spec:
  component: ocm.software/ocm-k8s-toolkit/simple
  repositoryRef:
    name: bootstrap-repository
  semver: 1.0.0
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Resource
metadata:
  name: bootstrap-deployment
  namespace: default
spec:
  componentRef:
    name: bootstrap-component
  resource:
    byReference:
      resource:
        name: deployment-resource
  interval: 1m
---
apiVersion: delivery.ocm.software/v1alpha1
kind: Deployer
metadata:
  name: bootstrap-deployer
  namespace: default
spec:
  resourceRef:
    name: bootstrap-deployment
    namespace: default
```

Make sure to update the `OCM_REPO_PLACEHOLDER` with your actual repository:

```shell
envsubst < bootstrap.yaml > deployment-subst.yaml
```

Let's step through what these are:

`Repository` defines where the component version lives. `Component` represents the above created component. `Resource` is the actual resource that we are looking for. And last, but not least, we have the `Deployer` object.

This object uses the referenced `deployment-resource` resource. Downloads and verifies it, and using server-side apply with ApplySets, applies it to the cluster.

{{<callout context="note">}}
To understand and know more about how the deployer uses `ApplySets` please visit the `<deployer concept placeholder>`.
{{</callout>}}

### Apply the objects

```shell
kubectl apply -f deployment-subst.yaml
```

### Verify the result

Now, we should see the following resources:

```shell
kubectl get resource,deployer,component,repository -owide
NAME                                                  READY                   AGE
resource.delivery.ocm.software/bootstrap-deployment   Applied version 1.0.0   20s

NAME                                                AGE
deployer.delivery.ocm.software/bootstrap-deployer   20s

NAME                                                  READY                   AGE
component.delivery.ocm.software/bootstrap-component   Applied version 1.0.0   20s

NAME                                                    READY                                    AGE
repository.delivery.ocm.software/bootstrap-repository   Successfully reconciled OCM repository   20s
```

And if we take a look at the pods, we should see podinfo running in our cluster.

```shell
kubectl get pods -l app=podinfo
NAME                       READY   STATUS    RESTARTS   AGE
podinfo-86b758c4bf-c44qk   1/1     Running   0          109s
```

### Cleanup

One of the benefits of using `ApplySets` is that we can clean up after this. By deleting the deployment file, the controller will remove all tracked objects from the cluster.

```shell
kubectl delete -f deployment-subst.yaml
```

After a little while, we should observe the podinfo and the other objects, are all gone.

```shell
kubectl get pods -l app=podinfo
No resources found in default namespace.

kubectl get resource,deployer,component,repository -owide
No resources found
```

## Conclusion

This concludes deployment with simple objects using the controller's built-in capabilities.

For a more advanced scenario using Kro and Flux, please read on [Advanced Deployment using Kro and Flux]({{< relref "docs/tutorials/deploy-with-controllers-advanced.md" >}}).
