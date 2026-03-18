# layouts/ — Custom Templates and Overrides

Local Hugo templates that shadow or extend the Doks theme
(`@thulite/doks-core`). Hugo's module mount order (see
`config/_default/module.toml`) places local files after the theme's, so any
file here with a matching path overrides the Doks default.

> **Maintenance rule:** only override when the theme default is insufficient.
> Keep diffs minimal and document the *reason* in the template itself.

---

## Overrides (shadow a theme template)

| Local file | Theme original | What changed and why |
|---|---|---|
| `_default/baseof.html` | `@thulite/doks-core` `baseof.html` | Custom header partial instead of Doks header; home page gets unwrapped content (no `container-*` wrapper); footer only on home; conditional script loading for Mermaid (`.Page.Store "hasMermaid"`) and Schema Reference JS (`.Page.Store "hasSchemaReference"`). |
| `_default/single.html` | `@thulite/doks-core` `single.html` | Simplified sidebar (no section-switcher), removed `container-fw` fluid-layout branch, removed breadcrumb trail, removed AI buttons, removed edit-page link, removed last-modified display. |
| `_default/section.html` | `@thulite/doks-core` `single.html` (deliberate) | Same as `single.html` above but used for `_index.md` pages. Hugo treats `_index.md` as a list page; this override renders it like a single page. The sidebar omits `docs-sidebar-top` / `docs-sidebar-offset` classes. |
| `_markup/render-codeblock-mermaid.html` | `@thulite/doks-core` `_markup/render-codeblock-mermaid.html` | Identical content (whitespace-only diff). Sets `.Page.Store "hasMermaid"` flag so `baseof.html` can conditionally load the Mermaid ESM script. |
| `_default/_markup/render-link.html` | `@thulite/doks-core` `_markup/render-link.html` | Complete rewrite. The Doks original (270 lines, Veriphor-licensed) handles many edge cases. This simplified version (26 lines) only handles the OCM-specific need: strip `.md` suffixes, convert underscores to dashes, and resolve intra-section CLI command links (e.g. `ocm-download-resources.md` to the section-relative path). |
| `_partials/footer/footer.html` | `@thulite/doks-core` `_partials/footer/footer.html` | Complete rewrite. Custom dark footer with EU/BMWK funding logos, SAP sponsorship, social links (GitHub, Slack, YouTube), legal links, and copyright. The Doks original is a minimal text-only footer. |
| `_partials/head/libsass.html` | `@thulite/core` `_partials/head/libsass.html` | Switches the Sass transpiler from LibSass to **Dart Sass** (`"transpiler": "dartsass"`). The Thulite core original uses the deprecated `libsass` transpiler. This override also adds `silenceDependencyDeprecations` and `silenceDeprecations` for Dart Sass `@import` warnings. Requires Dart Sass to be installed in the environment — see `.github/workflows/publish-site.yaml` and `Netlify.toml` for CI/CD setup. |
| `home.html` | `@thulite/doks-core` `home.html` | Complete rewrite. Custom landing page with hero section (headline, subheadlines, CTA buttons), feature cards, ecosystem partners, and testimonials. The Doks original is a simple centered title + lead text. |

## Custom files (no theme counterpart)

| Local file | Purpose |
|---|---|
| `_partials/header/custom-header.html` | Full custom site header with logo, navigation, version switcher, search, dark-mode toggle, and GitHub link. Injected via `baseof.html` instead of the Doks `header/header.html` partial. |
| `_partials/header/version-warning.html` | Floating "Dev" badge shown when viewing the `dev` content version. Warns that the documentation is for an unreleased version. |
| `_partials/footer/script-footer-custom.html` | Empty file. Exists because Thulite core's `script-footer.html` calls this partial — the empty file satisfies the call without adding any custom scripts. |
| `_partials/schema-field-row.html` | Recursive partial that renders one row of the JSON Schema reference table with collapse/expand, depth indentation, type badges, and constraint display. |
| `_partials/schema-table.html` | Shared partial for the schema table structure (thead + tbody). Deduplicates identical markup between top-level fields and variant tables. |
| `shortcodes/json-schema.html` | Shortcode for interactive, collapsible JSON Schema reference from pre-resolved `data/schemas/*.json`. |
