---
title: "Secure Software Delivery with Flux and OCM"
description: "A fully guided walkthrough of a secure software delivery scenario."
weight: 14
toc: true
---

The source code for the demo can be found at [https://github.com/open-component-model/demo-secure-delivery](https://github.com/open-component-model/demo-secure-delivery).
A video guide can be found [here](https://share.vidyard.com/watch/NjNrZF2926RUTSUvkU4MdR).

## Fully guided walkthrough

![workflow](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/new_diagram.png)

This walkthrough deploys a full end-to-end scenario demonstrating how OCM and Flux can be employed to continuously deploy applications in air-gapped environments.

The demo environment consists of Gitea, Tekton, Flux and the OCM controller.

To be able to show that provider and consumer are really disconnected, two distinct Gitea organizations are created:

- [software-provider](https://gitea.ocm.dev/software-provider)
- [software-consumer](https://gitea.ocm.dev/software-consumer)

## Software Provider

The provider organization contains a repository which models the `podinfo` application. When a new release is created a Tekton pipeline will be triggered that builds the OCM component and pushes it to the [software provider's OCI registry](https://gitea.ocm.dev/software-provider/-/packages).

## Software Consumer

The software consumer organization models an air-gapped scenario where applications are deployed from a secure OCI registry rather than directly from an arbitrary public upstream source.

The software consumer organization contains a repository named [ocm-applications](https://gitea.ocm.dev/software-consumer/ocm-applications). During the setup of the demo a PR is created which contains a set of Kubernetes manifests required to deploy the OCM component published by the software provider.

Once this pull request is merged the Flux machinery will deploy `podinfo` component. [Capacitor](https://capacitor.ocm.dev) can be used to understand the state of the cluster.

### Walkthrough

Instructions are provided to guide you through the process of deploying the demo environment, cutting a release for "podinfo," verifying the release automation, installing the component, viewing the Capacitor GitOps dashboard, accessing the deployed application, applying configuration changes, monitoring the application update, and cutting a new release with updated features.

#### 1. Setup demo environment

To deploy the demo environment execute the following:

`make run`

Once the environment has been created, login to Gitea using the following credentials:

```bash
username: ocm-admin
password: password
```

#### 2. Cut a release for `podinfo`

Next navigate to the [gitea releases](https://gitea.ocm.dev/software-provider/podinfo-component/releases) page and click "New Release".

Enter "v1.0.0" for both the tag name and release name, and then click "Publish Release".

![release](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/publish.png)

#### 3. Verify the release

Once the release is published, navigate to [Tekton pipeline runs](https://ci.ocm.dev/#/namespaces/tekton-pipelines/pipelineruns) and follow the progress of the release automation.

![ci](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/release_automation.png)

#### 4. Install the Component

When the release pipeline has been completed we can install the component. Navigate to [gitea pull request](https://gitea.ocm.dev/software-consumer/ocm-applications/pulls/1) page and merge the pull request.

![install](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/install.png)

#### 5. View the Capacitor Dashboard

After certificates are created the Capacitor component and the dashboard will be accessible in [Capacitor](https://capacitor.ocm.dev). Give it a minute to spin up...

![capacitor](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/capacitor.png)

#### 5. View the application

We can view the `podinfo` Helm release that's been deployed in the [default namespace](https://capacitor.ocm.dev/)

We can also view the running application [here](https://podinfo.ocm.dev)

![podinfo](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/application.png)

#### 6. Apply configuration

The application can be configured using the parameters exposed in `values.yaml`. Now that podinfo is deployed we can tweak a few parameters.
Navigate to the [values.yaml in gitea](https://gitea.ocm.dev/software-consumer/ocm-applications/_edit/main/values.yaml)

![configure](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/configure.png)

and add the following:

```yaml
podinfo:
  replicas: 2
  message: "Hello Open Component Model!"
  serviceAccountName: ocm-ops
```

#### 7. View the configured application

The changes will soon be reconciled by Flux and visible in the [podinfo UI](https://podinfo.ocm.dev). Note how the pod id changes now that we have 2 replicas of our application running.

![update](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/update.png)

#### 8. Cut a new release

Let's jump back to the provider repository and cut another release. This release will contain a new feature that changes the image displayed by the podinfo application. Follow the same process as before to create a release, bumping the version to `v1.1.0`.

#### 9. Verify the release

Once the release is published, navigate to [Tekton pipeline runs](https://ci.ocm.dev/#/namespaces/tekton-pipelines/pipelineruns) and follow the progress of the release automation.

#### 10. Monitor the application update

Jump back to [Capacitor](https://capacitor.ocm.dev) to view the rollout of the new release.

![update-wego](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/update-wego.png)

#### 11. View the updated application

Finally, navigate to [podinfo UI](https://podinfo.ocm.dev) which now displays the OCM logo in place of the cuttlefish and the updated application version of 6.3.6

![update-ocm](https://raw.githubusercontent.com/open-component-model/demo-secure-delivery/refs/heads/main/docs/images/update-ocm.png)

### Conclusion

By leveraging the capabilities of Gitea, Tekton, Flux, and the OCM controller, this demo showcases the seamless deployment of components and dependencies in a secure manner. The use of secure OCI registries and automated release pipelines ensures the integrity and reliability of the deployment process.

Users can easily set up the demo environment, cut releases, monitor release automation, view the Capacitor GitOps dashboard and observe the deployment and update of applications. We have presented a practical illustration of how OCM and Flux can be employed to facilitate the deployment and management of applications in air-gapped environments, offering a robust and efficient solution for secure software delivery.

## Contributing

Code contributions, feature requests, bug reports, and help requests are very welcome. Please refer to the [Contributing Guide in the Community repository](https://github.com/open-component-model/community/blob/main/CONTRIBUTING.md) for more information on how to contribute to OCM.

OCM follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

## Licensing

Copyright SAP SE or an SAP affiliated Company and Open Component Model contributors.
