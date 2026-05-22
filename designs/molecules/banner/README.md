# mol-banner

Full-width status banner shown above chat content. A single molecule covers four wireframe banners from UC-PLATF-01 and UC-PLATF-03. Composes `atom-icon-glyph`, `atom-tool-status-rule` (horizontal), and `atom-button` with no atom-rule redefinition.

---

## Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  ← atom-tool-status-rule (top accent)
│ [icon] Headline text                           [CTA button] │
│ Body explainer text (stacked shape only)                    │
│ [CTA button] (stacked shape only — below body)              │
└─────────────────────────────────────────────────────────────┘
```

### Parts

| Element | Class | Notes |
|---------|-------|-------|
| Container | `.mol-banner` | `<aside>`, sets bg color |
| Top accent rule | `.mol-banner__rule` | `atom-tool-status-rule --horizontal --pending` (warning) or `--error` (danger) |
| Content row | `.mol-banner__row` | flex row: icon + text + CTA (inline shape) |
| Status icon | `.mol-banner__icon` | `atom-icon-glyph --sm`, color driven by variant |
| Headline text | `.mol-banner__text` | `.type-body-sm`, status-colored |
| Body explainer | `.mol-banner__body` | `.type-body-sm`, muted — stacked shape only |
| CTA button | `.mol-banner__cta` | `atom-button --link --sm` (inline) or `--secondary --sm` (stacked) |
| Dismiss button | `.mol-banner__dismiss` | `atom-icon-button --ghost --sm` — present only with `is-dismissible` |

---

## Variants (4)

| Modifier class | Status | Background | Rule | Icon | Icon color | Text color |
|----------------|--------|------------|------|------|------------|------------|
| `mol-banner--offline` (default) | Warning | `--state-warning-bg` | `--pending` | wifi-off | `--state-warning-fg` | `--state-warning-fg` |
| `mol-banner--unpaid` | Danger | `--state-danger-bg` | `--error` | alert-triangle | `--state-danger-fg` | `--state-danger-fg` |
| `mol-banner--dispatch-failed` | Danger | `--state-danger-bg` | `--error` | alert-triangle | `--state-danger-fg` | `--state-danger-fg` |
| `mol-banner--permission-denied` | Warning | `--state-warning-bg` | `--pending` | bell | `--state-warning-fg` | `--state-warning-fg` |

---

## Shapes (2)

| Modifier class | Layout | When to use |
|----------------|--------|-------------|
| `mol-banner--inline` (default) | Single row: icon · headline · CTA trailing | Short, action-focused banners (offline retry, dispatch failed) |
| `mol-banner--stacked` | Row: icon · headline, then body paragraph, then CTA below | Banners with explanatory body copy (notifications-disabled) |

---

## States

| State | Modifier / class | Behaviour |
|-------|-----------------|-----------|
| Default | — | Static display |
| Dismissible | `is-dismissible` | Trailing close `atom-icon-button` added. Offline banner auto-dismisses on reconnect; class removed by JS. |

---

## Atoms Used

| Atom | Role in this molecule |
|------|-----------------------|
| `atom-tool-status-rule --horizontal --pending` | Top accent rule — warning (offline / permission-denied) |
| `atom-tool-status-rule --horizontal --error` | Top accent rule — danger (unpaid / dispatch-failed) |
| `atom-icon-glyph --sm` | Leading status icon (wifi-off / alert-triangle / bell) |
| `atom-button --link --sm` | Inline CTA (Retry / Open Settings inline) |
| `atom-button --secondary --sm` | Stacked CTA (Open Settings →) |
| `atom-icon-button --ghost --sm` | Dismiss close button (`is-dismissible` state only) |

---

## Token Recipe

| Property | Token |
|----------|-------|
| Background (warning variants) | `--state-warning-bg` |
| Background (danger variants) | `--state-danger-bg` |
| Icon color + text color (warning) | `--state-warning-fg` |
| Icon color + text color (danger) | `--state-danger-fg` |
| Body explainer text | `--text-muted` |
| Padding block | `--space-3` |
| Padding inline | `--space-4` |
| Row gap | `--space-3` |
| Body margin-top | `--space-2` |
| Body margin-bottom | `--space-3` |
| Border radius | `--radius-default` |

---

## Accessibility

- Container is `<aside role="status" aria-live="polite">` for non-critical banners (offline — auto-recovers, permission — user-action required).
- Container is `<aside role="alert" aria-live="assertive">` for critical banners that interrupt the session (`dispatch-failed`, `unpaid`).
- Status is conveyed **both visually** (background color + icon) **and in text** — the headline carries the full status text; no color-only encoding.
- The dismiss button carries `aria-label="Dismiss notification"`.
- The CTA `atom-button` carries an explicit `aria-label` on the link variant when the visible text is short (e.g. `aria-label="Retry connection"`).
- SVG icons are `aria-hidden="true"` — the text label is the accessible name.
- `prefers-reduced-motion`: no animations used in this molecule.
