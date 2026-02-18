---
title: "TEMPLATE: How-to Title"
description: "A task-focused recipe: do X in OCM."
weight: 999
toc: true
---

## Goal

One sentence: what you will achieve.

{{< callout type="note" >}}
**You will end up with**

- A concrete outcome (artifact/config/state)
- A verifiable success condition
{{< /callout >}}

**Estimated time:** ~X minutes

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/install.md" >}}) installed
- Access to the required repository/service
- Required credentials/keys available

{{< callout type="warning" >}}
⚠️ **Preconditions:** Mention anything that would cause data loss or unexpected changes.
{{< /callout >}}

## Steps

1. **Do the first thing**

   Brief explanation (1–2 sentences max). Link to concepts for "why"—don't explain inline.

   ```bash
   ocm <command> <args>
   ```

   {{< callout type="tip" >}}
   **Handling variants:** If your how-to covers multiple approaches or platforms, use tabs to show alternatives:

   {{< tabs "signing-methods" >}}
   {{< tab "RSA Key" >}}
   ```bash
   ocm sign cv --private-key private.key
   ```
   {{< /tab >}}
   {{< tab "Sigstore" >}}
   ```bash
   ocm sign cv --sigstore
   ```
   {{< /tab >}}
   {{< /tabs >}}
   {{< /callout >}}

   You should see: `[specific success indicator]`.

   <details>
     <summary>Output</summary>

   ```text
   ...
   ```
   </details>

2. **Do the next thing**

   If needed, show the minimal config:

   ```yaml
   # Key fields only
   key: value
   required: field
   ```

3. **Verify**

   Show the shortest check that proves success:

   ```bash
   ocm <command> --check
   ```

   You should see: `[expected output]`. This confirms your setup is correct.

   <details>
     <summary>Expected output</summary>

   ```text
   OK ...
   ```
   </details>

## Troubleshooting

### Symptom: [Specific error message]

**Cause:** One sentence explaining why.

**Fix:**

```bash
# Fix command
...
```

### Symptom: [Another issue]

**Cause:** ...

**Fix:** ...

### Getting help

If these solutions don't work:

- [OCM Troubleshooting Guide]({{< relref "docs/troubleshooting/_index.md" >}})
- [Community Support](link)
- [Open an Issue](https://github.com/open-component-model/ocm/issues)

## Cleanup (optional)

Remove resources created:

```bash
# Cleanup commands
...
```

{{< callout type="warning" >}}
⚠️ This will delete [what will be deleted].
{{< /callout >}}

## Next steps

{{< card-grid >}}
{{< card link="docs/concepts/signing" title="Signing Concept" icon="shield-check" >}}
Understand signature verification in OCM
{{< /card >}}
{{< card link="docs/tutorials/secure-supply-chain" title="Secure Supply Chain Tutorial" icon="graduation-cap" >}}
Build a complete signing workflow
{{< /card >}}
{{< /card-grid >}}

## Related documentation

- [Concept: <name>]({{< relref "docs/concepts/<file>.md" >}})
- [Tutorial: <name>]({{< relref "docs/tutorials/<file>.md" >}})
- [Reference: <command>]({{< relref "docs/reference/<file>.md" >}})

---

## ✓ Before publishing

- [ ] Action verb title (Configure/Deploy/Create)
- [ ] Simple numbered lists (use `{{< steps >}}` only if 5+ complex steps)
- [ ] Success indicators after each step
- [ ] Links to concepts (never inline "why" explanations)
- [ ] Use `{{< tabs >}}` for variants (different approaches, platforms, configurations)
- [ ] `{{< card-grid >}}` for "Next steps" navigation
- [ ] Troubleshooting with symptom-cause-fix
- [ ] Working relref links
- [ ] Realistic time estimate
