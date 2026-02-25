---
title: "Configure Credentials for OCM Controllers"
description: "Configure authentication for OCM Controllers to access private OCM repositories."
weight: 10
toc: true
---

Configure credentials to allow OCM Controllers to access OCM components stored in private OCI registries.

## You will end up with

- A Kubernetes secret containing registry credentials
- OCM Controller resources configured to use these credentials
- Verified access to private OCM repositories

## Estimated time: ~5 minutes

## Prerequisites

- [Controller environment]({{< relref "setup-controller-environment.md" >}}) set up (OCM Controllers, kro and Flux in a Kubernetes cluster)
- [OCM CLI]({{< relref "ocm-cli-installation.md" >}}) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) installed
- Credentials for your private OCI registry (username and password, Docker config file, or OCM CLI config file)
- The registry URL where your OCM components are stored

{{< callout context="caution" title="Security Warning" icon="outline/alert-triangle" >}}
Kubernetes secrets are only base64-encoded, not encrypted.
Ensure proper RBAC policies to restrict access to secrets containing credentials.
{{< /callout >}}

## Configure and propagate credentials for OCM resources

{{< steps >}}
{{< step >}}

### Create a Kubernetes secret with credentials

Choose one of two methods to create the secret:

{{< tabs "credential-methods" >}}
{{< tab "OCM Config (.ocmconfig)" >}}

Use this method if you already use the OCM CLI and have an `.ocmconfig` file configured with credentials. [Configure Credentials in .ocmconfig]({{< relref "creds-in-ocmconfig.md" >}}) supports with creating this file.

#### Create the secret from your existing `.ocmconfig` file

Point the command to your existing `.ocmconfig` file. The secret key must be named `.ocmconfig` (with the dot).
The `--from-file` command automatically uses the filename as the key.

```bash
kubectl create secret generic ocm-secret --from-file=<path-to-your-.ocmconfig-file>
```

<details>
<summary>You should see this output</summary>

```text
secret/ocm-secret created
```
</details>

{{< /tab >}}

{{< tab "Docker Config (dockerconfigjson)" >}}

#### Option A: From existing Docker config file

```bash
kubectl create secret docker-registry ocm-secret --from-file=<path-to-your-docker-config-file>
```

<details>
<summary>You should see this output</summary>

```text
secret/ocm-secret created
```
</details>

#### Option B: Create from command line

```bash
kubectl create secret docker-registry ocm-secret \
  --docker-username=<your-username> \
  --docker-password=<your-password> \
  --docker-server=<your-registry-url>
```

<details>
<summary>You should see this output</summary>

```text
secret/ocm-secret created
```
</details>

{{< /tab >}}
{{< /tabs >}}
{{< /step >}}

{{< step >}}

### Reference the secret in OCM Controller resources

Add the `spec.ocmConfig` field to your OCM Controller resources to use the credentials.
Create a `repository.yaml` with a `Repository` resource.
Replace `<your-namespace>` with your actual namespace in the registry URL.

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Repository
metadata:
  name: my-repository
spec:
  repositorySpec:
    baseUrl: ghcr.io/<your-namespace>
    type: OCIRegistry
  interval: 1m
  ocmConfig:
    - kind: Secret
      name: ocm-secret
```

Apply the resource:

```bash
kubectl apply -f repository.yaml
```

<details>
<summary>You should see this output</summary>

```text
repository.delivery.ocm.software/my-repository created
```
</details>
<br>

Verify the resource is ready and can access your registry (due to the complex status field of OCM resources, to show the status, we need to use `custom-columns`)

```shell
kubectl get repository my-repository -o 'custom-columns=NAME:.metadata.name,READY:.status.conditions[0].message,AGE:.metadata.creationTimestamp'
```

<details>
<summary>You should see this output</summary>

```text
NAME            READY                                    AGE
my-repository   Successfully reconciled OCM repository   2026-02-25T15:45:49Z
```
</details>

{{< /step >}}

{{< step >}}

### Propagate credentials to dependent resources (optional)

OCM Controller resources can inherit credentials from referenced resources, reducing duplication.
Create a `component.yaml` with a component referencing the OCM config from the `Repository` resource you just created.
Specify the component reference to an existing component in your registry.

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Component
metadata:
  name: my-component
spec:
  component: <your-namespace>/my-component
  repositoryRef:
    name: my-repository
  semver: 1.0.0
  interval: 1m
  ocmConfig:
    - kind: Repository
      apiVersion: delivery.ocm.software/v1alpha1
      name: my-repository
```

The `Component` resource inherits credentials from the `Repository` resource named `my-repository`.

Apply the resource:

```shell
kubectl apply -f component.yaml
```

<details>
<summary>You should see this output</summary>

```text
component.delivery.ocm.software/my-component created
```
</details>
<br>

Verify the resource is ready and can access your registry (due to the complex status field of OCM resources, to show the status, we need to use `custom-columns`)

```shell
kubectl get component my-component -o 'custom-columns=NAME:.metadata.name,READY:.status.conditions[0].message,AGE:.metadata.creationTimestamp'
```

<details>
<summary>You should see this output</summary>

```text
NAME           READY                   AGE
my-component   Applied version 1.0.0   2026-02-25T15:49:58Z
```
</details>

### Credential propagation

- Credentials are propagated by default when referencing other OCM Controller resources
- You must still specify the `ocmConfig` field on each resource that needs credentials
- Credentials are not automatically inherited across all resources in the cluster

{{< /step >}}

{{< /steps >}}

## Advanced: Prevent credential propagation

To prevent a resource from propagating its credentials to dependent resources, set the `policy` to `DoNotPropagate`:

```yaml
apiVersion: delivery.ocm.software/v1alpha1
kind: Component
metadata:
  name: my-component
spec:
  component: <your-namespace>/my-component
  repositoryRef:
    name: my-repository
  semver: 1.0.0
  interval: 1m
  ocmConfig:
    - kind: Repository
      apiVersion: delivery.ocm.software/v1alpha1
      name: my-repository
      policy: DoNotPropagate
```

## Troubleshooting

### Symptom: "failed to list versions: response status code 401: unauthorized"

**Cause:** The credentials are incorrect, missing, or the secret is not referenced in the resource.

**Fix:**

1. Verify the secret exists:
   ```bash
   kubectl get secret ocm-secret
   ```

2. Check the secret contains the correct credentials:
   ```bash
   kubectl get secret ocm-secret -o yaml
   ```

3. Ensure the `ocmConfig` field references the correct secret name in your resource.

### Symptom: "failed to read OCM config: key .ocmconfig not found in secret"

**Cause:** When using the OCM config method, the secret key must be named `.ocmconfig`.

**Fix:**

Recreate the secret with the correct key name, e.g., referencing an `.ocmconfig` file in the same folder:

```bash
kubectl delete secret ocm-secret
kubectl create secret generic ocm-secret --from-file=./.ocmconfig
```

The filename in `--from-file` must be `.ocmconfig` (with the dot).

### Symptom: "Component shows `Not Ready` with credential errors"

**Cause:** The `ocmConfig` is not specified or references a non-existent resource.

**Fix:**

Add the `ocmConfig` field to your Component resource:

```yaml
spec:
  # ...existing configuration...
  ocmConfig:
    - kind: Repository
      apiVersion: delivery.ocm.software/v1alpha1
      name: my-repository
```

Or reference the secret directly:

```yaml
spec:
  # ...existing configuration...
  ocmConfig:
    - kind: Secret
      name: ocm-secret
```

## Next Steps

- [Tutorial: Deploy a Helm Chart]({{< relref "deploy-helm-chart.md" >}}) - Use the OCM Controllers to deploy applications from component versions

## Related documentation

- [Concept: OCM Controllers]({{< relref "ocm-controllers.md" >}})
- [Tutorial: Configure Credentials in .ocmconfig]({{< relref "creds-in-ocmconfig.md" >}})
