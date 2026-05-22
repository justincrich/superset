# mol-thinking-level-option

A single selectable row in the thinking-level picker popover (and its twin, the permission-mode picker). Composes `atom-radio` and `atom-section-label` around a `type-label` level name into a fully accessible, touch-safe option row.

---

## Purpose

- One row per level/mode in a radio-group popover (thinking: off/low/medium/high/xhigh; permissions: default/acceptEdits/plan/bypassPermissions)
- The wrapping `<label>` ties the visible text to the hidden `<input type="radio">`, so any tap on the row activates the input
- Budget hint (`~1K tokens`, `Ask for risky ops`) is NOT decorative — it is included verbatim in the `<input>`'s `aria-label` so it is read aloud as part of the option
- Parent listbox (the popover `<fieldset>`) provides the radio-group name; this component provides the single-row structure only

---

## Anatomy

```html
<label class="mol-thinking-level-option mol-thinking-level-option--thinking is-selected">
  <span class="atom-radio atom-radio--md is-checked">
    <input
      type="radio"
      name="thinking"
      value="low"
      checked
      class="atom-radio__input"
      aria-label="low — about 1K tokens"
    />
    <span class="atom-radio__ring" aria-hidden="true"></span>
  </span>
  <span class="mol-thinking-level-option__label type-label">low</span>
  <span class="mol-thinking-level-option__hint atom-section-label atom-section-label--muted">~1K tokens</span>
</label>
```

Notes:
- `atom-radio--md` is the default size (18px outer, 8px dot)
- `is-checked` on the wrapper and `checked` on `<input>` are kept in sync (static HTML); in React, `checked` alone drives the visual via `:has(:checked)`
- `atom-section-label--muted` is the default color class (no extra modifier needed for the default muted variant, but explicit is clearer)
- The hint span should NOT carry `aria-hidden="true"` — its text is duplicated in `aria-label` for AT but the visible label is kept in the DOM for sighted users

---

## Variants (picker kind)

| Class | Hint text example | Use case |
|---|---|---|
| `mol-thinking-level-option--thinking` (default) | `~1K tokens` | Thinking-level picker |
| `mol-thinking-level-option--permission` | `Ask for risky ops` | Permission-mode picker |

The variants are semantically identical; the modifier exists to allow future per-kind styling (e.g. a warning color on `bypassPermissions`) without global cascade bleed.

---

## States

| Class | Visual effect |
|---|---|
| `default` | Transparent background |
| `is-hover` | `background: var(--surface-soft)` |
| `is-selected` | `background: var(--surface-active)` |
| `is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)` (inherited from `atom-radio` focus-within) |
| `is-disabled` | `opacity: 0.5; pointer-events: none` |

Focus is managed by the radio atom (`atom-radio:focus-within`); the molecule row itself receives no separate focus ring — the atom's ring is sufficient and avoids double-ring.

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-radio` | `--md` + `is-checked` (when selected) | Selection input with visible ring + center dot |
| `atom-section-label` | default (`--muted`) | Budget/mode hint text — mono uppercase, right-aligned |

Plus `.type-label` (type module, not an atom) for the level/mode name.

---

## Layout

```
[ radio ] [ label — min 4em ] ··· flex spacer ··· [ hint — ml: auto ]
```

- `display: flex; align-items: center; gap: var(--space-3)`
- `padding: var(--space-3) var(--space-4)` — 12px block, 16px inline
- `min-height: var(--touch-target-min)` — 44px WCAG AA + iOS HIG
- `__label` has `min-width: 4em` to align hint column across options of varying name length
- `__hint` uses `margin-left: auto` to push to the trailing edge

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `min-height` | `var(--touch-target-min)` | 44px |
| `padding` | `var(--space-3) var(--space-4)` | 12px block · 16px inline |
| `gap` | `var(--space-3)` | 12px between radio · label · hint |
| `border-radius` | `var(--radius-default)` | Hover/selected state rounded corners |
| `background` hover | `var(--surface-soft)` | |
| `background` selected | `var(--surface-active)` | |
| `color` hint | `var(--text-muted)` | Via `atom-section-label` default |
| `color` label | `var(--text-body)` | Override on `__label` (type-label defaults to muted) |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | |
| Disabled opacity | `0.5` | Scalar — no token at 0.5 |

---

## Accessibility

- Wrapping `<label>` for free `for`/`id` binding — every tap on the row including on the hint text activates the radio.
- `<input type="radio">` carries `aria-label="{level} — {hint}"` so screen readers announce both the level name and the budget hint as a single unit (e.g. "low — about 1K tokens, radio button, 2 of 5").
- The hint `<span>` is NOT `aria-hidden` — it is visible text that repeats what is in `aria-label`; acceptable duplication per WCAG technique ARIA14.
- Parent `<fieldset>` + `<legend>` provides the radio-group boundary and title ("Extended thinking" / "Permission mode").
- `is-disabled`: `pointer-events: none` + `opacity: 0.5`. The `<input disabled>` attribute must also be set so AT announces "dimmed" / "unavailable".
- No `tabindex` needed — `<input type="radio">` is natively focusable; arrow-key navigation across radios is handled by the browser.
