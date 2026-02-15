---
title: "TEMPLATE: How-to Title"
description: "A task-focused recipe: do X in OCM."
weight: 999
toc: true
---

## Goal

One sentence: what the reader will achieve.

{{< callout type="note" >}}
**✅ You will end up with**

- A concrete outcome (artifact/config/state)
- A verifiable success condition
{{< /callout >}}

**⏱️ Estimated time:** ~X minutes

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/install.md" >}}) installed
- Access to the required repository/service
- Required credentials/keys available

{{< callout type="warning" >}}
**⚠️ Preconditions**

Mention anything that would cause data loss or unexpected changes.
{{< /callout >}}

## Steps

1. **Do the first thing**

   ```bash
   ocm <command> <args>
   ```

   <details>
     <summary>Output</summary>

   ```text
   ...
   ```
   </details>

2. **Do the next thing**

   If you need a config file, show the minimal required snippet:

   ```yaml
   key: value
   ```

3. **Verify**

   Show the shortest check that proves success:

   ```bash
   ocm <command> --check
   ```

   <details>
     <summary>Expected output</summary>

   ```text
   OK ...
   ```
   </details>

## Troubleshooting

### Common issues

**Symptom:** …
- **Cause:** …
- **Fix:** …

### Getting help

If none of these solutions work:
- Check the [OCM Troubleshooting Guide]({{< relref "docs/troubleshooting/_index.md" >}})
- Ask in the community (Slack/Discord link)
- [Open an issue](https://github.com/open-component-model/ocm/issues)

## Next steps

- Link to the related concept page for "why"
- Link to a tutorial for "learn by doing"
- Link to reference docs for complete options

## Related documentation

- [Concept: <name>]({{< relref "docs/concepts/<file>.md" >}})
- [Tutorial: <name>]({{< relref "docs/tutorials/<file>.md" >}})
- [Reference: <command/page>]({{< relref "docs/reference/<file>.md" >}})

---

## ✓ Template completion checklist (remove before publishing)

**How-to compliance:**
- [ ] Title starts with action verb (e.g., "Configure", "Deploy", "Create")
- [ ] Focus is on practical steps, not explanation
- [ ] Each step is minimal and focused
- [ ] Assumptions are explicitly stated in Prerequisites
- [ ] Links to concepts for "why", not explained inline
- [ ] Time estimate is realistic
- [ ] Troubleshooting covers common issues
- [ ] Related documentation links are complete