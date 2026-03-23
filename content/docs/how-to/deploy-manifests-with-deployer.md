---
title: "Deploy Manifests with Deployer"
description: "Deploy raw Kubernetes manifests from an OCM component version using the Deployer controller."
icon: "🚀"
weight: 35
toc: true
---

This guide shows how to deploy raw Kubernetes manifests from an OCM component version using the OCM Controllers' built-in Deployer. This approach requires only the OCM Controllers—no kro or Flux needed.

{{< callout context="tip" title="What you'll deploy" icon="outline/package" >}}
A Podinfo application (single pod) deployed directly from a Kubernetes Deployment manifest stored in an OCM component.
{{< /callout >}}

## Prerequisites

- [Controller environment]({{< relref "setup-controller-environment.md" >}}) with OCM Controllers installed
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- Access to an OCI registry (e.g., [ghcr.io](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages))
- A GitHub account with a personal access token
- Any extra RBAC configured by following [Custom RBAC guide]({{< relref "custom-rbac.md" >}})

{{< callout context="note" title="Private registries" icon="outline/lock" >}}
By default, packages in GitHub Container Registry are private. Either make your package public after upload, or [configure credentials]({{< relref "configure-credentials-for-controllers.md" >}}) for the OCM controller resources before deploying.
{{< /callout >}}

## Environment Setup

Set environment variables for your GitHub username and OCM repository:

```bash
export GITHUB_USERNAME=<your-github-username>
export OCM_REPO=ghcr.io/$GITHUB_USERNAME/ocm-tutorial
```

## Create the Component Version

Create a working directory:

```shell
mkdir /tmp/manifest-deploy && cd /tmp/manifest-deploy
```

### Create the Deployment Manifest

Create a `deployment.yaml` file:

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

### Create the Component Constructor

Create a `component-constructor.yaml` file:

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

### Build and Push

```shell
ocm add cv --repository $OCM_REPO
```

<details>
<summary>Expected output</summary>

```text
COMPONENT                           │ VERSION │ PROVIDER
────────────────────────────────────┼─────────┼──────────────
ocm.software/ocm-k8s-toolkit/simple │ 1.0.0   │ ocm.software
```

</details>

### Verify the Upload

```shell
ocm get cv $OCM_REPO//ocm.software/ocm-k8s-toolkit/simple:1.0.0
```

## Deploy with the OCM Controllers

Create a `bootstrap.yaml` file with the controller resources:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: bootstrap-repository
spec:
  repositorySpec:
    baseUrl: $OCM_REPO
    type: OCIRegistry
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

The resource chain works as follows:
- **Repository** — points to the OCM repository
- **Component** — references a specific component version
- **Resource** — selects the manifest resource from the component
- **Deployer** — downloads, verifies, and applies the manifest using server-side apply with ApplySets

{{< callout context="note" >}}
For details on how the Deployer uses ApplySets, see [OCM Controllers]({{< relref "/docs/concepts/ocm-controllers.md" >}}).
{{< /callout >}}

### Substitute and Apply

Replace the `$OCM_REPO` placeholder with your actual repository URL and apply:

```shell
envsubst < bootstrap.yaml > deployment-subst.yaml
kubectl apply -f deployment-subst.yaml
```

### Verify the Deployment

Check the controller resources:

```shell
kubectl get resource,deployer,component,repository -owide
```

```text
NAME                                                  READY                   AGE
resource.delivery.ocm.software/bootstrap-deployment   Applied version 1.0.0   20s

NAME                                                AGE
deployer.delivery.ocm.software/bootstrap-deployer   20s

NAME                                                  READY                   AGE
component.delivery.ocm.software/bootstrap-component   Applied version 1.0.0   20s

NAME                                                    READY                                    AGE
repository.delivery.ocm.software/bootstrap-repository   Successfully reconciled OCM repository   20s
```

Check the deployed pod:

```shell
kubectl get pods -l app=podinfo
```

```text
NAME                       READY   STATUS    RESTARTS   AGE
podinfo-86b758c4bf-c44qk   1/1     Running   0          109s
```

## Troubleshooting

### Authentication Errors

If you see `401: unauthorized` errors, your registry package is private. Either:
- Make the package public in GitHub Package settings
- [Configure credentials]({{< relref "configure-credentials-for-controllers.md" >}}) for the controller resources

### Resource Not Reconciling

If resources stay in a pending state, check controller logs:

```shell
kubectl logs -n ocm-k8s-toolkit-system deployment/ocm-k8s-toolkit-controller-manager
```

## Cleanup

Delete the controller resources to remove all tracked objects:

```shell
kubectl delete -f deployment-subst.yaml
```

The Deployer uses ApplySets, so deleting the resources automatically cleans up the deployed manifest:

```shell
kubectl get pods -l app=podinfo
# No resources found in default namespace.
```

## Next Steps

- [Tutorial: Deploy Helm Charts with Bootstrap]({{< relref "/docs/tutorials/deploy-helm-chart-bootstrap.md" >}}) — Advanced deployment with kro and Flux orchestration
- [How-to: Configure Credentials for Controllers]({{< relref "configure-credentials-for-controllers.md" >}}) — Set up private registry access
- [How-to: Custom RBAC]({{< relref "custom-rbac.md" >}}) — Configure permissions for Deployer
