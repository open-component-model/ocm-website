---
title: "TEMPLATE: Tutorial Title"
description: "A guided, learning-focused walkthrough that teaches you how to accomplish a goal in OCM."
weight: 999
toc: true
---

## Overview

Write 2–4 sentences that set the scene and explain *why* you would do this.
Avoid deep background. Link to the relevant concept(s) instead.

**Estimated time:** ~X minutes

{{< callout type="note" >}}
**What you'll learn**

- What you can do by the end (outcome #1)
- One key concept you will understand (outcome #2)
- How to validate your success (outcome #3)
{{< /callout >}}

{{< callout type="note" >}}
**Audience & assumptions**

- Who this tutorial is for (e.g., "You're an OCM CLI user who has already created a component version")
- What we assume you already know
{{< /callout >}}

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/install.md" >}}) installed
- Access to required repositories/services (example: `ghcr.io`)
- Any required credentials (example: GitHub token with package write access)

## Scenario

Describe the concrete scenario you'll use throughout. Use specific values consistently—readers will copy/paste these.

- **Component:** `github.com/acme.org/helloworld:1.0.0`
- **Repository:** `ghcr.io/acme-ocm`
- **Working directory:** `/tmp/ocm-tutorial`

{{< callout type="tip" >}}
**Handling variations:** If your tutorial covers multiple paths (e.g., different resource types or deployment targets), use tabs to keep the learning flow clear:

{{< tabs "example-tabs" >}}
{{< tab "Helm Chart" >}}
```yaml
type: helmChart
input:
  type: helm
  path: ./chart
```
{{< /tab >}}
{{< tab "OCI Image" >}}
```yaml
type: ociImage
input:
  type: dockermulti
  repository: ghcr.io/myorg/myimage
```
{{< /tab >}}
{{< /tabs >}}
{{< /callout >}}

## Tutorial Steps

{{< steps >}}

{{< step >}}
**Create the component constructor file**

Explain *what* you're doing and *why* in 1–2 sentences.

```bash
touch component-constructor.yaml
```

Create and save this content to `component-constructor.yaml`:

```yaml
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: github.com/acme.org/helloworld
  version: 1.0.0
  provider:
    name: acme.org
  resources:
    - name: mylocalfile
      type: blob
      input:
        type: file
        path: ./my-resource.txt
```
{{< /step >}}

{{< step >}}
**Build the component version**

Run the OCM CLI to create a CTF archive:

```bash
ocm add cv
```

You should see:

<details>
  <summary>Expected output</summary>

```text
component github.com/acme.org/helloworld/1.0.0 constructed ... done!
```
</details>

This indicates your component version was successfully created.

<details>
  <summary>What happened?</summary>

Optional: Explain *how* OCM processed your command.

The command created a CTF archive and added the component with its resources. The archive is now ready for transfer to any OCM repository.
</details>

{{< /step >}}

{{< step >}}
**Verify the result**

Check that your component was created correctly:

```bash
ocm get cv ./transport-archive//github.com/acme.org/helloworld:1.0.0
```

You should see your component listed with version 1.0.0.

<details>
  <summary>Expected output</summary>

```text
COMPONENT                      │ VERSION │ PROVIDER
───────────────────────────────┼─────────┼──────────
github.com/acme.org/helloworld │ 1.0.0   │ acme.org
```
</details>

{{< /step >}}

{{< /steps >}}

## What you've learned

Summarize key learning points in 3–6 bullets:

- You created a component constructor file that defines metadata and resources
- You used `ocm add cv` to build a transportable CTF archive
- You verified your component structure using `ocm get cv`

**For deeper understanding:**

- [Concept: Component Descriptors]({{< relref "docs/concepts/component-descriptors.md" >}})
- [Concept: Common Transfer Format]({{< relref "docs/concepts/ctf.md" >}})

## Check your understanding

Before moving on:

- [ ] What is the purpose of a component constructor file?
- [ ] Why do we store component versions in CTF archives?
- [ ] How would you add a second resource?

<details>
  <summary>Answers & Explanations</summary>

- **Question 1:** Brief answer with explanation
- **Question 2:** Brief answer with explanation  
- **Question 3:** Brief answer with explanation

</details>

## Troubleshooting

Common issues in *this tutorial*:

### Problem: Command fails with "component constructor not found"

**Cause:** The `ocm` CLI looks for `component-constructor.yaml` in your current directory.

**Fix:**

```bash
ocm add cv --file /path/to/component-constructor.yaml
```

### Problem: "Invalid version format" error

**Cause:** OCM requires semantic versioning (e.g., `1.0.0`).

**Fix:** Update your `version` field to `MAJOR.MINOR.PATCH` format.

### Getting help

If these solutions don't work:

- [OCM Troubleshooting Guide]({{< relref "docs/troubleshooting/_index.md" >}})
- [Community Support]({{< relref "docs/community/_index.md" >}})
- [Open an Issue](https://github.com/open-component-model/ocm/issues)

## Cleanup

Remove the resources created in this tutorial:

```bash
rm -rf transport-archive
rm -rf /tmp/ocm-tutorial
rm component-constructor.yaml
```

{{< callout type="warning" >}}
⚠️ This will permanently delete your CTF archive and all component versions it contains.
{{< /callout >}}

## Next steps

- [Tutorial: Transfer a Component Version]({{< relref "docs/tutorials/transfer-component.md" >}})
- [Concept: Component Versioning]({{< relref "docs/concepts/versioning.md" >}})
- [How-to: Add Multiple Resources]({{< relref "docs/how-to/add-resources.md" >}})

## Related documentation

- [Concept: <name>]({{< relref "docs/concepts/<file>.md" >}})
- [How-to: <name>]({{< relref "docs/how-to/<file>.md" >}})
- [Reference: <command>]({{< relref "docs/reference/<file>.md" >}})

---

## ✓ Before publishing

- [ ] Uses `{{< steps >}}` with `{{< step >}}` shortcodes
- [ ] Consistent "you" voice throughout
- [ ] Concrete scenario values used consistently
- [ ] Success indicators after major steps
- [ ] Use `{{< tabs >}}` for variants (resource types, platforms, options)
- [ ] "What you've learned" summary
- [ ] Troubleshooting for tutorial-specific issues
- [ ] Working relref links
- [ ] Realistic time estimate
