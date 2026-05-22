# mol-model-picker-option

A single selectable row inside the model-picker popover. Composed of a radio button, a model name label, and an optional "NEW" badge for recently-released models. Section dividers (`atom-section-label--with-rule`) separate vendor groups (Anthropic / OpenAI / etc.).

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ [radio]  [label]                              [badge?]       │
│  ●/○     Claude Opus 4.7                       NEW           │
└──────────────────────────────────────────────────────────────┘
```

| Slot | Element | Atom(s) |
|------|---------|---------|
| `atom-radio` | Radio input — selection control | `atom-radio atom-radio--md` (default/accent when checked) |
| `__label` | Model name | `.type-body` + `--text-body` color; `flex: 1` |
| `__new` (optional) | "NEW" recency badge | `atom-badge atom-badge--accent atom-badge--sm` |

Between vendor groups: `atom-section-label atom-section-label--with-rule` acting as a visual divider with a rule line extending to the right edge.

The row is a `<label>` wrapping the `<input type="radio">`, so clicking anywhere on the row selects the radio — no JS required.

---

## Variants

| Modifier class | Background (selected) | Use case |
|----------------|----------------------|----------|
| `mol-model-picker-option--default` | `--surface-active` | Standard option |
| `mol-model-picker-option--featured` | `color-mix(in oklch, var(--accent-primary-subtle) 60%, var(--surface-active) 40%)` (ember-tinted) | Most-recommended model (e.g., default Sonnet 4.6) |

---

## States

| Class | Visual |
|-------|--------|
| default | transparent background |
| `is-hover` / `:hover` | `--surface-soft` background |
| `is-active` / `:active` | `--surface-active` background + `scale(0.995)` |
| `is-focus` / `:focus-within` | inset 2px `--border-focus` ring |
| `is-selected` | `--surface-active` background (default) or ember-tinted (featured); radio shows checked dot |
| `is-disabled` | `opacity: 0.5`; `pointer-events: none` |

`is-selected` and `is-hover` may coexist — the hover surface-soft lightens the selected tint.

---

## Atoms used

| Atom | Class string | Notes |
|------|-------------|-------|
| `atom-radio` | `atom-radio atom-radio--md` | Selection input; `is-checked` state applied when selected |
| `atom-radio` (accent variant) | `atom-radio atom-radio--md atom-radio--accent` | Used inside `--featured` variant for persistent ember ring |
| `atom-badge` | `atom-badge atom-badge--accent atom-badge--sm` | Optional "NEW" recency badge; `flex-shrink: 0` trailing slot |
| `atom-section-label` | `atom-section-label atom-section-label--with-rule` | Vendor group divider between Anthropic / OpenAI rows |

---

## Token recipe

| Property | Token | Notes |
|----------|-------|-------|
| Row gap | `--space-3` | Between radio / label / badge |
| Row padding-inline | `--space-4` | Horizontal inset |
| Row padding-block | `--space-3` | Vertical inset |
| Min-height | `--touch-target-min` | 44pt iOS HIG |
| Border-radius | `--radius-default` | Row corner rounding |
| Background (default) | `transparent` | — |
| Background (hover) | `--surface-soft` | — |
| Background (selected, default) | `--surface-active` | — |
| Background (selected, featured) | `color-mix(in oklch, var(--accent-primary-subtle) 60%, var(--surface-active) 40%)` | Ember-tinted selection |
| Focus ring | `--border-focus` | inset 2px |
| Label color | `--text-body` | `.type-body` default |
| Label flex | `flex: 1; min-width: 0` | Fills available space; enables ellipsis |
| Section divider rule | `--border-subtle` (1px, via atom) | `atom-section-label--with-rule::after` |
| Section divider padding-block | `--space-2` | Breathing room above/below vendor label |
| Section divider padding-inline | `--space-4` | Aligns with row inset |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | Row bg transition |
| Tap highlight | `transparent` | `-webkit-tap-highlight-color` |

### TOKEN_GAPs

None. All values resolve to existing design tokens.

---

## Accessibility

- The row is a `<label>` element wrapping `<input type="radio">`. Clicking anywhere on the label activates the radio — no additional JS event handlers needed.
- The parent container should be a `<fieldset>` with `role="radiogroup"` (or equivalent) providing group semantics.
- The `<input>` carries `aria-label` with the full model name (e.g., `"Claude Opus 4.7"`).
- The "NEW" badge is `aria-hidden="true"` — recency information is supplementary and not critical for selection.
- `is-disabled` rows have `disabled` on the native `<input>` and `pointer-events: none` on the label so they are removed from the tab order.
- The `atom-radio__ring` is `aria-hidden="true"` — the native `<input>` communicates state to assistive technology.
- `aria-checked` is conveyed natively by `<input type="radio" checked>` — no ARIA override needed.
