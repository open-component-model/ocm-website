---
title: "Replication Controller API v1"
description: ""
lead: ""
date: 2023-07-10T11:34:56+01:00
lastmod: 2023-07-10T11:34:56+01:00
draft: false
images: []
weight: 25
toc: true
---

<p>Packages:</p>
<ul class="simple">
<li>
<a href="#delivery.ocm.software%2fv1alpha1">delivery.ocm.software/v1alpha1</a>
</li>
</ul>
<h2 id="delivery.ocm.software/v1alpha1">delivery.ocm.software/v1alpha1</h2>
<p>Package v1alpha1 contains API Schema definitions for the delivery v1alpha1 API group</p>
Resource Types:
<ul class="simple"></ul>
<h3 id="delivery.ocm.software/v1alpha1.ComponentSubscription">ComponentSubscription
</h3>
<p>ComponentSubscription is the Schema for the componentsubscriptions API</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>metadata</code><br>
<em>
<a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#objectmeta-v1-meta">
Kubernetes meta/v1.ObjectMeta
</a>
</em>
</td>
<td>
Refer to the Kubernetes API documentation for the fields of the
<code>metadata</code> field.
</td>
</tr>
<tr>
<td>
<code>spec</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscriptionSpec">
ComponentSubscriptionSpec
</a>
</em>
</td>
<td>
<br/>
<br/>
<table>
<tr>
<td>
<code>component</code><br>
<em>
string
</em>
</td>
<td>
<p>Component specifies the name of the Component that should be replicated.</p>
</td>
</tr>
<tr>
<td>
<code>semver</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>Semver specifies an optional semver constraint that is used to evaluate the component
versions that should be replicated.</p>
</td>
</tr>
<tr>
<td>
<code>source</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.OCMRepository">
OCMRepository
</a>
</em>
</td>
<td>
<p>Source holds the OCM Repository details for the replication source.</p>
</td>
</tr>
<tr>
<td>
<code>destination</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.OCMRepository">
OCMRepository
</a>
</em>
</td>
<td>
<em>(Optional)</em>
<p>Destination holds the destination or target OCM Repository details. The ComponentVersion
will be transfered into this repository.</p>
</td>
</tr>
<tr>
<td>
<code>interval</code><br>
<em>
<a href="https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Duration">
Kubernetes meta/v1.Duration
</a>
</em>
</td>
<td>
<p>Interval is the reconciliation interval, i.e. at what interval shall a reconciliation happen.
This is used to requeue objects for reconciliation in case of success as well as already reconciling objects.</p>
</td>
</tr>
<tr>
<td>
<code>serviceAccountName</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>ServiceAccountName can be used to configure access to both destination and source repositories.
If service account is defined, it&rsquo;s usually redundant to define access to either source or destination, but
it is still allowed to do so.
<a href="https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#add-imagepullsecrets-to-a-service-account">https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#add-imagepullsecrets-to-a-service-account</a></p>
</td>
</tr>
<tr>
<td>
<code>verify</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.Signature">
[]Signature
</a>
</em>
</td>
<td>
<em>(Optional)</em>

<p>Verify specifies a list signatures that must be verified before a ComponentVersion is replicated.</p>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td>
<code>status</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscriptionStatus">
ComponentSubscriptionStatus
</a>
</em>
</td>
<td>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<h3 id="delivery.ocm.software/v1alpha1.ComponentSubscriptionSpec">ComponentSubscriptionSpec
</h3>
<p>
(<em>Appears on:</em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscription">ComponentSubscription</a>)
</p>
<p>ComponentSubscriptionSpec defines the desired state of ComponentSubscription. It specifies
the parameters that the replication controller will use to replicate a desired Component from
a source OCM repository to a destination OCM repository.</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>component</code><br>
<em>
string
</em>
</td>
<td>
<p>Component specifies the name of the Component that should be replicated.</p>
</td>
</tr>
<tr>
<td>
<code>semver</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>Semver specifies an optional semver constraint that is used to evaluate the component
versions that should be replicated.</p>
</td>
</tr>
<tr>
<td>
<code>source</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.OCMRepository">
OCMRepository
</a>
</em>
</td>
<td>
<p>Source holds the OCM Repository details for the replication source.</p>
</td>
</tr>
<tr>
<td>
<code>destination</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.OCMRepository">
OCMRepository
</a>
</em>
</td>
<td>
<em>(Optional)</em>
<p>Destination holds the destination or target OCM Repository details. The ComponentVersion
will be transfered into this repository.</p>
</td>
</tr>
<tr>
<td>
<code>interval</code><br>
<em>
<a href="https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Duration">
Kubernetes meta/v1.Duration
</a>
</em>
</td>
<td>
<p>Interval is the reconciliation interval, i.e. at what interval shall a reconciliation happen.
This is used to requeue objects for reconciliation in case of success as well as already reconciling objects.</p>
</td>
</tr>
<tr>
<td>
<code>serviceAccountName</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>ServiceAccountName can be used to configure access to both destination and source repositories.
If service account is defined, it&rsquo;s usually redundant to define access to either source or destination, but
it is still allowed to do so.
<a href="https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#add-imagepullsecrets-to-a-service-account">https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#add-imagepullsecrets-to-a-service-account</a></p>
</td>
</tr>
<tr>
<td>
<code>verify</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.Signature">
[]Signature
</a>
</em>
</td>
<td>
<em>(Optional)</em>
<p>Verify specifies a list signatures that should be validated before the ComponentVersion
is marked Verified.</p>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<h3 id="delivery.ocm.software/v1alpha1.ComponentSubscriptionStatus">ComponentSubscriptionStatus
</h3>
<p>
(<em>Appears on:</em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscription">ComponentSubscription</a>)
</p>
<p>ComponentSubscriptionStatus defines the observed state of ComponentSubscription</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>lastAttemptedVersion</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>LastAttemptedVersion defines the latest version encountered while checking component versions.
This might be different from last applied version which should be the latest applied/replicated version.
The difference might be caused because of semver constraint or failures during replication.</p>
</td>
</tr>
<tr>
<td>
<code>observedGeneration</code><br>
<em>
int64
</em>
</td>
<td>
<em>(Optional)</em>
<p>ObservedGeneration is the last reconciled generation.</p>
</td>
</tr>
<tr>
<td>
<code>lastAppliedVersion</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>LastAppliedVersion defines the final version that has been applied to the destination component version.</p>
</td>
</tr>
<tr>
<td>
<code>replicatedRepositoryURL</code><br>
<em>
string
</em>
</td>
<td>
<em>(Optional)</em>
<p>ReplicatedRepositoryURL defines the final location of the reconciled Component.</p>
</td>
</tr>
<tr>
<td>
<code>conditions</code><br>
<em>
<a href="https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Condition">
[]Kubernetes meta/v1.Condition
</a>
</em>
</td>
<td>
<em>(Optional)</em>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<h3 id="delivery.ocm.software/v1alpha1.OCMRepository">OCMRepository
</h3>
<p>
(<em>Appears on:</em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscriptionSpec">ComponentSubscriptionSpec</a>)
</p>
<p>OCMRepository specifies access details for an OCI based OCM Repository.</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>url</code><br>
<em>
string
</em>
</td>
<td>
<p>URL specifies the URL of the OCI registry.</p>
</td>
</tr>
<tr>
<td>
<code>secretRef</code><br>
<em>
<a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#localobjectreference-v1-core">
Kubernetes core/v1.LocalObjectReference
</a>
</em>
</td>
<td>
<em>(Optional)</em>
<p>SecretRef specifies the credentials used to access the OCI registry.</p>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<h3 id="delivery.ocm.software/v1alpha1.SecretRef">SecretRef
</h3>
<p>
(<em>Appears on:</em>
<a href="#delivery.ocm.software/v1alpha1.Signature">Signature</a>)
</p>
<p>SecretRef clearly denotes that the requested option is a Secret.</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>secretRef</code><br>
<em>
<a href="https://pkg.go.dev/github.com/fluxcd/pkg/apis/meta#LocalObjectReference">
github.com/fluxcd/pkg/apis/meta.LocalObjectReference
</a>
</em>
</td>
<td>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<h3 id="delivery.ocm.software/v1alpha1.Signature">Signature
</h3>
<p>
(<em>Appears on:</em>
<a href="#delivery.ocm.software/v1alpha1.ComponentSubscriptionSpec">ComponentSubscriptionSpec</a>)
</p>
<p>Signature defines the details of a signature to use for verification.</p>
<div class="md-typeset__scrollwrap">
<div class="md-typeset__table">
<table>
<thead>
<tr>
<th>Field</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>
<code>name</code><br>
<em>
string
</em>
</td>
<td>
<p>Name specifies the name of the signature. An OCM component may have multiple
signatures.</p>
</td>
</tr>
<tr>
<td>
<code>publicKey</code><br>
<em>
<a href="#delivery.ocm.software/v1alpha1.SecretRef">
SecretRef
</a>
</em>
</td>
<td>
<p>PublicKey provides a reference to a Kubernetes Secret that contains a public key
which will be used to validate the named signature.</p>
</td>
</tr>
</tbody>
</table>
</div>
</div>
<div class="admonition note">
<p class="last">This page was automatically generated with <code>gen-crd-api-reference-docs</code></p>
</div>
