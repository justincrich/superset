# mol-tool-call-card

Collapsed-only card displaying the status, name, and args preview of a single tool call. Used inside assistant message bodies to represent tool invocations per UC-RENDER-04.

## Purpose

Communicates tool-call state at a glance via a 3px left-edge status rule (color-encoded), a status pill, an icon, the tool name, and a truncated args line. The card is tappable (navigates to detail view elsewhere) but never expands in-place — there is no expand UI.

## Anatomy

```
┌─[rule]──────────────────────────────────────────┐
│ [icon]  [name-pill]              [status-pill]   │
│         [args preview line]                   [›] │
└─────────────────────────────────────────────────┘
```

| Part | Element | Class |
|---|---|---|
| Left status rule | `<span>` | `mol-tool-call-card__rule` → `atom-tool-status-rule --vertical --{status}` |
| Content wrapper | `<div>` | `mol-tool-call-card__content` |
| Header row | `<header>` | `mol-tool-call-card__header` |
| Tool icon | `<svg>` | `mol-tool-call-card__icon` → `atom-icon-glyph --sm --{color}` |
| Tool name pill | `<span>` | `mol-tool-call-card__name` → `atom-pill --default --sm --monospace` |
| Status pill | `<span>` | `mol-tool-call-card__status` → `atom-pill --{live|warning|danger|success} --sm` |
| Inline spinner (running only) | `<span>` | inside status pill → `atom-spinner --circular --xs --live` |
| Args preview | `<p>` | `mol-tool-call-card__args type-code` |
| Trailing chevron | `<svg>` | `mol-tool-call-card__chevron` → `atom-icon-glyph --xs --faint` |

## Variants

Five status variants driven by a BEM modifier on the root `<article>`:

| Modifier | Left rule | Status pill | Icon color | Spinner |
|---|---|---|---|---|
| `--running` (default) | `--running` (mint, glow) | `atom-pill--live` "RUNNING" | `--live` | yes (`--xs --live`) |
| `--done` | `--done` (green) | `atom-pill--default` "DONE · 0.3s" (success text) | `--muted` | no |
| `--pending` | `--pending` (amber, glow) | `atom-pill--warning` "AWAITING" | `--warning` (via inline color) | no |
| `--error` | `--error` (red) | `atom-pill--danger` "FAILED" | `--danger` | no |
| `--neutral` | `--neutral` (muted) | none | `--faint` | no |

`--warning` icon color is set via the molecule modifier class since `atom-icon-glyph` does not have a native `--warning` modifier. The molecule adds `.mol-tool-call-card--pending .mol-tool-call-card__icon { color: var(--state-warning-fg); }`.

## States

| Class | Behaviour |
|---|---|
| default | card at rest |
| `is-hover` | background shifts to `--surface-active` |
| `is-active` | `scale(0.99)` pressed feel |
| `is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)`, `outline: none` |

## Atoms Used

| Atom | Class(es) applied | Role |
|---|---|---|
| `atom-tool-status-rule` | `--vertical --running/done/pending/error/neutral` | 3px colored left accent |
| `atom-icon-glyph` | `--sm --live/muted/danger/faint` | Tool icon |
| `atom-pill` | `--default --sm --monospace` | Tool name label |
| `atom-pill` | `--live/warning/danger/default --sm` | Status label |
| `atom-spinner` | `--circular --xs --live` | Inline spinner in running state |
| `atom-divider` | `--horizontal --hairline` | Hairline between header and args |
| `atom-badge` | `--dot --live/danger/warning` | (optional sub-state overlay on icon — reserved for future use) |

## Token Recipe

| Property | Token | Notes |
|---|---|---|
| Card background | `--surface-raised` | elevated card base |
| Card border | `--border-subtle` | 1px hairline |
| Card radius | `--radius-default` | ~8px |
| Hover background | `--surface-active` | subtle lift |
| Focus ring | `--border-focus` | 2px box-shadow ring |
| Args text color | `--text-muted` | secondary emphasis |
| Args font | `--font-mono` (via `type-code`) | monospaced arg preview |
| Chevron color | `--text-faint` | purely decorative |
| Min height | `--touch-target-min` | 44px WCAG AA touch target |
| Left rule pull | `calc(-1 * var(--space-4))` | bleeds rule flush to card left edge |
| Padding inline | `var(--space-4)` | horizontal card padding |
| Padding block | `var(--space-3)` | vertical card padding |
| Gap (rule → content) | `var(--space-3)` | horizontal gap after rule |
| Header gap | `var(--space-2)` | between icon / name / status |
| Content stack gap | `var(--space-2)` | between header row and args |
| Status pill gap (spinner + text) | `var(--space-1)` | tight inline gap |

## TOKEN_GAPs

None identified. All structural values use token scale. The `calc(-1 * var(--space-4))` margin-inline-start on the rule is an intentional structural expression to bleed the rule flush against the card edge — it is not a magic number.

## Accessibility

- Root element is `<article>` with `aria-label="[Tool] tool call: [args preview] - [status]"` (e.g. `aria-label="Bash tool call: npm run test - running"`).
- Status is conveyed redundantly: aria-label text + status pill text label + color. Color is never the sole channel.
- The 3px left rule is `aria-hidden="true"` (decorative).
- The chevron icon is `aria-hidden="true"` (decorative — navigation target is determined by the parent list/thread context).
- The inline spinner is `aria-hidden="true"` (status conveyed by label text "RUNNING").
- The card meets `--touch-target-min` (44px) minimum height per WCAG 2.5.8 / iOS HIG.
- Focus ring uses `box-shadow` (visible in forced-colors/Windows HCM mode alongside the built-in outline fallback).
