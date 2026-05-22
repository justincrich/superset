# atom-checkbox

Binary selection primitive. Distinct from `radio` (single-select group) and `pill --selected` (pill-shaped multi-state).

## Purpose

A single-purpose binary checkbox used in: filter sheets (workspace selection, status filters), markdown task lists, settings toggles.

## Anatomy

```
<label.atom-checkbox [--variant] [--size] [.state-class]>
  <input.atom-checkbox__input type="checkbox" />   ← real native input, visually hidden
  <span.atom-checkbox__box aria-hidden="true">     ← styled visual box
    <svg.atom-checkbox__check>                     ← check glyph (opacity toggled)
      <path …/>
    </svg>
  </span>
</label>
```

The `<label>` wraps the `<input>`, so clicking anywhere on the label element (including the box) toggles the native checkbox. No JS required for basic toggle.

## Variants

| Class | Effect |
|---|---|
| `atom-checkbox--default` (default) | Square box with `--radius-subtle` corners (~6px) |
| `atom-checkbox--rounded` | Same box with `--radius-default` corners (~8px) |

## Sizes

| Class | Box dimension |
|---|---|
| `atom-checkbox--sm` | 14 × 14px |
| `atom-checkbox--md` (default) | 18 × 18px |
| `atom-checkbox--lg` | 22 × 22px |

## States

| Class / Condition | Visual |
|---|---|
| default (unchecked) | Transparent box, `--border-default` hairline border |
| `.is-checked` or `input:checked` | Ember fill (`--accent-primary`), white check glyph scales in |
| `.is-indeterminate` | Ember fill, no check glyph, white horizontal bar via `::after` pseudo |
| `.is-hover` or `:hover` | Border shifts to `--border-strong` |
| `.is-active` or `:active` | Box pressed via `--accent-primary-pressed` fill (checked) or `--surface-active` tint (unchecked) |
| `.is-focus` or `:focus-within` | 2px outer ring: `box-shadow: 0 0 0 2px var(--border-focus)` |
| `.is-disabled` or `input:disabled` | `opacity: 0.5`, `pointer-events: none` |
| `.is-checked.is-disabled` | Faded ember fill at 50% opacity |

## Token Recipe

| Role | Token |
|---|---|
| Box border (unchecked) | `--border-default` |
| Box border (hover) | `--border-strong` |
| Focus ring | `--border-focus` |
| Fill (checked / indeterminate) | `--accent-primary` |
| Fill (pressed, unchecked) | `--surface-active` |
| Fill (pressed, checked) | `--accent-primary-pressed` |
| Check / bar glyph color | `--accent-primary-fg` |
| Corner radius (default) | `--radius-subtle` |
| Corner radius (rounded) | `--radius-default` |
| Transition duration | `--motion-fast` |
| Transition easing | `--motion-ease-out` |
| Indeterminate bar radius | `--radius-pill` |

## Accessibility

- Use a real `<input type="checkbox">` inside a wrapping `<label>`. The native input is visually hidden (`opacity: 0`, absolutely positioned) but remains in the accessibility tree and receives keyboard focus.
- Every checkbox must have an accessible label: either text content adjacent to the box inside the `<label>`, or `aria-label` on the `<input>` when no visible label text is present.
- **Indeterminate state**: the `is-indeterminate` class only drives visual styling. Set `input.indeterminate = true` in JavaScript to communicate the indeterminate state to assistive technology: `document.querySelector('.atom-checkbox__input').indeterminate = true`.
- Focus ring appears on `:focus-within` — keyboard navigation highlights the box without needing separate focus styles on the hidden input.
- Keyboard: `Space` toggles the checked state natively. No JS override needed.
- Disabled: `pointer-events: none` on the label prevents mouse interaction; set `disabled` on the `<input>` to prevent keyboard interaction and communicate disabled state to assistive technology.
