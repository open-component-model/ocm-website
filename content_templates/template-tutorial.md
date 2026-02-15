---
title: "TEMPLATE: Tutorial Title"
description: "A guided, learning-focused walkthrough that teaches readers how to accomplish a goal in OCM."
weight: 999
toc: true
---

## Overview

Write 2–4 sentences that set the scene and explain *why* the reader would do this.
Avoid deep background. Link to the relevant concept(s) instead.

**⏱️ Estimated time:** ~X minutes

{{< callout type="note" >}}
**✅ What you'll learn**

- What the reader can do by the end (outcome #1)
- One key concept they will understand (outcome #2)
- Optional: how to validate success (outcome #3)
{{< /callout >}}

{{< callout type="note" >}}
**🧭 Audience & assumptions**

- Who this tutorial is for (e.g., "OCM CLI users who already created a component version")
- What you assume they already know
{{< /callout >}}

## Prerequisites

- [OCM CLI]({{< relref "docs/getting-started/install.md" >}}) installed
- Access to required repositories/services (example: `ghcr.io`)
- Any required credentials (example: GitHub token with package write access)

{{< callout type="tip" >}}
**💡 Tip**

Keep prerequisites short and actionable. If setup is long, link to a separate how-to.
{{< /callout >}}

## Scenario

Describe the concrete scenario you'll use throughout the tutorial (sample component names, repository, versions).
Keep it stable across steps so readers can copy/paste.

- **Component:** `github.com/acme.org/helloworld:1.0.0`
- **Repository:** `ghcr.io//acme-ocm`
- **Working directory:** `/tmp/ocm-tutorial`

## Tutorial

### Step 1: First meaningful action

Explain *what* we're doing and *why* (1–3 short paragraphs).
Then show the command/config.

```bash
# Example command
ocm <command> <args>
```

If you expect output, include it—but collapse long output to keep the tutorial readable:

<details>
  <summary>Expected output (click to expand)</summary>

```text
... put the command output here ...
```
</details>

{{< callout type="note" >}}
**🧠 Why this matters**

Add a small conceptual nudge that helps the learner build a mental model (optional).
{{< /callout >}}

### Step 2: Next action

Repeat the pattern: short explanation → command/config → expected output (collapsed if long).

```yaml
# Example config snippet
key: value
```

<details>
  <summary>Expected output</summary>

```text
...
```
</details>

### Step 3: Validate the result

Include a verification step. Explain what "success" looks like.

```bash
ocm <command> --verify
```

<details>
  <summary>Example output</summary>

```text
SUCCESS ...
```
</details>

## What just happened

Summarize the key learning points in 3–6 bullets.

- You configured/created/updated **X**.
- OCM used **Y** to do **Z**.
- You verified **A** using **B**.

Link to concept pages for deeper reading.

## Check your understanding

Before moving on, verify you can answer these questions:

- [ ] What does [concept X] do?
- [ ] Why did we use [approach Y]?
- [ ] How would you modify this to [scenario Z]?

<details>
  <summary>💡 Answers & Explanations</summary>

- **Question 1:** [Answer + brief explanation]
- **Question 2:** [Answer + brief explanation]
- **Question 3:** [Answer + brief explanation]
</details>

## Troubleshooting

List the 3–6 most common issues readers hit in *this* tutorial and how to fix them.

### Problem: <short symptom>

**Cause:** 1 sentence.

**Fix:**

```bash
# The minimal fix command
...
```

## Cleanup (optional)

If you want to remove the resources created in this tutorial:

```bash
# Commands to clean up
<cleanup-commands>
```

{{< callout type="warning" >}}
**⚠️ Warning:** This will delete [what will be deleted].
{{< /callout >}}

## Next steps

Give the learner 3–5 concrete next actions.

- Continue with: [Next tutorial]({{< relref "docs/tutorials/next-tutorial.md" >}})
- Learn the concept: [Relevant concept]({{< relref "docs/concepts/relevant-concept.md" >}})
- Do a real task: [Relevant how-to]({{< relref "docs/how-to/relevant-task.md" >}})

## Related documentation

- [Concept: <name>]({{< relref "docs/concepts/<file>.md" >}})
- [How-to: <name>]({{< relref "docs/how-to/<file>.md" >}})
- [Reference: <command/page>]({{< relref "docs/reference/<file>.md" >}})

---

## ✓ Template completion checklist (remove before publishing)

**Tutorial compliance:**
- [ ] Title describes what the learner will achieve
- [ ] Includes learning outcomes, not just task outcomes
- [ ] Steps build knowledge progressively
- [ ] Explains "why" at key points with callouts
- [ ] Includes verification and understanding checks
- [ ] Safe, reproducible scenario with concrete examples
- [ ] Time estimate is realistic
- [ ] Cleanup instructions provided (if applicable)
- [ ] Related documentation links are complete