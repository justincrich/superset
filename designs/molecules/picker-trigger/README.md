# mol-picker-trigger

Pill-shaped button that opens a picker popover. Used in the composer toolbar for model, thinking-level, and permission-mode selection. Each instance shows a leading icon, optional prefix label, current value, and a trailing chevron that rotates on open.

---

## Anatomy

```
[leading-icon] [prefix?] [value] [chevron]
     xs muted     muted   body    xs faint
```

- **leading-icon** — `atom-icon-glyph --xs --muted` — sparkles / zap / shield
- **prefix** (optional) — `atom-section-label --inline` — "Thinking:", "Permission:"
- **value** — `mol-picker-trigger__value` — e.g. "Sonnet 4.6", "low", "default"
- **chevron** — `atom-icon-glyph --xs --faint mol-picker-trigger__chevron` — rotates 180deg when `is-open`

The entire element is `atom-pill --default` (shape, border, background, hover) + `mol-picker-trigger` (layout glue, chevron rotation, open/disabled states).

---

## Variants (kind)

| Class modifier | Leading icon | Prefix | Example values |
|---|---|---|---|
| `mol-picker-trigger--model` (default) | sparkles | — | Opus 4.7, Sonnet 4.6, Haiku 4.5 |
| `mol-picker-trigger--thinking` | zap | "Thinking:" | low, medium, high |
| `mol-picker-trigger--permission` | shield | "Permission:" | default, acceptEdits, plan |

---

## Sizes

| Class modifier | Atom-pill size | Height |
|---|---|---|
| `mol-picker-trigger--sm` | `atom-pill--sm` | 20px |
| `mol-picker-trigger--md` (default) | `atom-pill--md` | 28px (mobile touch-friendly) |

The `--md` size uses `atom-pill--md` (28px), which satisfies the 44pt mobile touch-target requirement when wrapped in a `composition-bar` with adequate tap area.

---

## States

| Class / attribute | Visual effect |
|---|---|
| default | `atom-pill--default` resting background |
| `is-hover` | `--surface-active` via `atom-pill--default:hover` |
| `is-active` | `translateY(1px)` via `atom-pill.is-active` |
| `is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)` via `atom-pill.is-focus` |
| `is-open` + `aria-expanded="true"` | Background `--surface-active`, chevron rotated 180deg |
| `is-disabled` + `disabled` | Opacity 0.5, pointer-events none |

---

## Atoms Used

| Atom | Class applied | Role |
|---|---|---|
| `atom-pill` | `atom-pill--default atom-pill--{sm|md}` | Base shape, border, background, hover, focus, active, disabled states |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--muted` | Leading icon (sparkles / zap / shield) |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--faint mol-picker-trigger__chevron` | Trailing chevron-down |
| `atom-section-label` | `atom-section-label--inline` | Optional prefix label ("Thinking:", "Permission:") — thinking and permission variants only |

Total atoms composed per instance: 3–4 (model: 3; thinking/permission: 4).

---

## Token Recipe

| Property | Token |
|---|---|
| Background (resting) | `var(--surface-soft)` via `atom-pill--default` |
| Background (hover) | `var(--surface-active)` via `atom-pill--default:hover` |
| Background (is-open) | `var(--surface-active)` |
| Border | `0.5px solid var(--border-default)` via `atom-pill--default` |
| Focus ring | `var(--border-focus)` via `atom-pill.is-focus` |
| Leading icon color | `var(--text-muted)` via `atom-icon-glyph--muted` |
| Chevron color | `var(--text-faint)` via `atom-icon-glyph--faint` |
| Prefix color | `var(--text-muted)` via `atom-section-label` default |
| Value color | `var(--text-body)` |
| Value weight | `var(--font-weight-meta)` |
| Chevron transition | `var(--motion-fast) var(--motion-ease-out)` |
| Disabled opacity | `0.5` |

Zero hex literals. All values resolved via design tokens.

---

## HTML Structure

### Model (no prefix)

```html
<button
  class="mol-picker-trigger mol-picker-trigger--model mol-picker-trigger--md
         atom-pill atom-pill--default atom-pill--md"
  type="button"
  aria-haspopup="listbox"
  aria-expanded="false"
  aria-controls="model-listbox"
  aria-label="Model picker — Sonnet 4.6 selected">

  <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <!-- sparkles paths -->
  </svg>

  <span class="mol-picker-trigger__value">Sonnet 4.6</span>

  <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint mol-picker-trigger__chevron"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <path d="M6 9l6 6 6-6"/>
  </svg>
</button>
```

### Thinking / Permission (with prefix)

```html
<button
  class="mol-picker-trigger mol-picker-trigger--thinking mol-picker-trigger--md
         atom-pill atom-pill--default atom-pill--md"
  type="button"
  aria-haspopup="listbox"
  aria-expanded="false"
  aria-controls="thinking-listbox"
  aria-label="Thinking level — low selected">

  <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted"
       aria-hidden="true" ...><!-- zap --></svg>

  <span class="atom-section-label atom-section-label--inline mol-picker-trigger__prefix">
    Thinking:
  </span>

  <span class="mol-picker-trigger__value">low</span>

  <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint mol-picker-trigger__chevron"
       aria-hidden="true" ...><path d="M6 9l6 6 6-6"/></svg>
</button>
```

---

## Accessibility

- Element is a `<button type="button">` — native keyboard activation (Enter/Space).
- `aria-haspopup="listbox"` — announces that a listbox popover will appear.
- `aria-expanded="false"` / `"true"` — toggled by JS when the popover opens or closes.
- `aria-controls="{popover-id}"` — establishes the `button → listbox` relationship. The listbox must have the matching `id`.
- `aria-label` carries both the picker type and currently selected value: `"Model picker — Sonnet 4.6 selected"`, `"Thinking level — low selected"`, `"Permission mode — default selected"`.
- All SVG icons carry `aria-hidden="true"` — they are decorative; the button label carries full context.
- `is-disabled` state pairs with the native `disabled` attribute so AT announces the control as unavailable.
