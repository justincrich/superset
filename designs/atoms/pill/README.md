# atom · pill

A rounded chip that carries a label with optional leading icon and trailing dismiss glyph. Pill is the base primitive for host chips, slash-command atomic insertions in TiptapPromptEditor, file-mention chips, linked-issue chips, model-name badges, permission/thinking-level chips, and tab-style filter pills.

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  [leading-icon]  label  [trailing-close] │
└──────────────────────────────────────────┘
     ↑ 16px slot        ↑ 14px × slot
     gap: --space-2     tap area: --touch-target-min
```

| Slot | Class modifier | Notes |
|---|---|---|
| Root | `.atom-pill` | Always required |
| Variant | `.atom-pill--{variant}` | One of 6; see Variants table |
| Size | `.atom-pill--{sm\|md\|lg}` | Default is `--md` when omitted |
| Leading icon | `.atom-pill--leading-icon` | 16px inline SVG with `currentColor` |
| Trailing dismiss | `.atom-pill--trailing-dismiss` | Separate `<button>` child for a11y |
| Monospace label | `.atom-pill--monospace` | Switches body text to `--font-mono` |
| Uppercase label | `.atom-pill--uppercase` | Adds `--tracking-uppercase` |
| State | `.is-hover` `.is-active` `.is-focus` `.is-disabled` `.is-selected` | Composable on any base |

---

## Variants

| Class | Background | Text | Border | Use case |
|---|---|---|---|---|
| `atom-pill--default` | `--surface-soft` | `--text-body` | `0.5px solid --border-default` | Generic chip, neutral chip |
| `atom-pill--strong` | `--surface-active` | `--text-body` | `0.5px solid --border-strong` | Selected state, active filter |
| `atom-pill--accent` | `--accent-primary-subtle` | `--accent-primary` | none | Slash-command pill (ember-tinted) |
| `atom-pill--live` | `--state-live-bg` | `--state-live-fg` | none | Streaming / running badge |
| `atom-pill--warning` | `--state-warning-bg` | `--state-warning-fg` | none | Awaiting approval badge |
| `atom-pill--danger` | `--state-danger-bg` | `--state-danger-fg` | none | Dispatch failed badge |

---

## Sizes

| Class | Height | Padding-X | Typography |
|---|---|---|---|
| `atom-pill--sm` | 20px | `--space-2` | `.type-meta` props (mono, uppercase, `--tracking-uppercase`) |
| `atom-pill--md` (default) | 28px | `--space-3` | `.type-label` props |
| `atom-pill--lg` | 36px | `--space-4` | `.type-label` props (larger cap height) |

---

## Modifiers

| Class | Effect |
|---|---|
| `atom-pill--leading-icon` | Reserves a 16px slot before the label; gap `--space-2`. Icon inherits `color: currentColor` so it always matches pill text. |
| `atom-pill--trailing-dismiss` | Appends a 14px-wide close-glyph zone after the label. The dismiss target is a nested `<button>` whose min-size is `--touch-target-min` (44px) to satisfy iOS HIG. |
| `atom-pill--monospace` | `font-family: var(--font-mono)`. Used when label is code-like: `Sonnet 4.6`, `npm run test`, `/clear`. |
| `atom-pill--uppercase` | `text-transform: uppercase; letter-spacing: var(--tracking-uppercase)`. Used on status badges: `STREAMING`, `AWAITING APPROVAL`. |

---

## States

| Class / pseudo | Visual change |
|---|---|
| default | base |
| `:hover` / `.is-hover` | Background shifts one surface step up (`default` → `active`; `accent` → +5% saturation via `color-mix`). State variants (`live`, `warning`, `danger`) lighten slightly. |
| `:active` / `.is-active` | `translateY(1px)` — pressed micro-motion. |
| `:focus-visible` / `.is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)` ring, no fill change. |
| `.is-disabled` | `opacity: 0.5; pointer-events: none`. |
| `.is-selected` | Upgrades bg to `--surface-active`; border to `--border-strong`. Composable on any base variant. |

---

## Token recipe

| Property | Token |
|---|---|
| `border-radius` | `--radius-pill` |
| `background` (default) | `--surface-soft` |
| `background` (strong / selected) | `--surface-active` |
| `background` (accent) | `--accent-primary-subtle` |
| `background` (live) | `--state-live-bg` |
| `background` (warning) | `--state-warning-bg` |
| `background` (danger) | `--state-danger-bg` |
| `color` (default / strong) | `--text-body` |
| `color` (accent) | `--accent-primary` |
| `color` (live) | `--state-live-fg` |
| `color` (warning) | `--state-warning-fg` |
| `color` (danger) | `--state-danger-fg` |
| `border` (default) | `0.5px solid var(--border-default)` |
| `border` (strong / selected) | `0.5px solid var(--border-strong)` |
| `padding-inline` (sm) | `--space-2` |
| `padding-inline` (md) | `--space-3` |
| `padding-inline` (lg) | `--space-4` |
| `gap` (icon/label) | `--space-2` |
| `font-family` (default) | `--font-body` |
| `font-family` (monospace) | `--font-mono` |
| `font-size` (sm) | `--font-size-meta` |
| `font-size` (md/lg) | `--font-size-label` |
| `font-weight` | `--font-weight-label` |
| `letter-spacing` (mono content) | `--tracking-mono` |
| `letter-spacing` (uppercase badge) | `--tracking-uppercase` |
| `transition` | `--motion-fast` + `--motion-ease-out` |
| `focus ring` | `--border-focus` |

---

## Accessibility

Pills are visual chips; correct semantics depend on usage context:

| Usage | Markup guidance |
|---|---|
| Selectable filter / tag | `role="button"` on `.atom-pill`, `aria-pressed="true\|false"` |
| Dismissible chip | `.atom-pill` is presentational; nested `<button class="atom-pill__dismiss">` carries `aria-label="Remove host:macbook-pro"` |
| Status badge (live, warning, danger) | `role="status"` if the state change is announced live; `aria-live="polite"` on a wrapper if state changes dynamically |
| Decorative badge (static) | No role; `aria-hidden="true"` if meaning is conveyed elsewhere |
| Slash-command atomic insertion (TiptapPromptEditor) | `contenteditable="false" data-type="slash-command"`; screen reader announces the label as an embedded object |
| Model-name / permission chip in toolbar | `role="button"` with descriptive label if activatable; `role="status"` if read-only indicator |

Minimum touch target for trailing dismiss: `--touch-target-min` (44px) — satisfied via negative margin + `padding` expansion on the nested `<button>`, not by inflating the visual glyph.
