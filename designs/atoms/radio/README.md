# atom · radio

Single radio-button primitive. One option from a mutually-exclusive group.
The surrounding label + helper text are handled at the molecule layer
(`model-picker-option`, `thinking-level-option`, `permission-mode-option`).

---

## Anatomy

```
<label class="atom-radio  atom-radio--default  atom-radio--md  is-checked">
  │
  ├─ <input type="radio" name="…" value="…" class="atom-radio__input" aria-label="…" />
  │    Visually hidden (clip technique). Carries all native keyboard + AT semantics.
  │    Screen readers announce checked state, group membership, label.
  │
  └─ <span class="atom-radio__ring" aria-hidden="true">
         Visual circle ring + ::after pseudo-element center dot.
     </span>
```

The `<label>` is both the sizing container and the hit target. It wraps the hidden
`<input>` so clicking anywhere on the ring triggers the input without a `for=` attribute.

---

## Variants

| Class modifier | Ring color (unselected) | Use context |
|---|---|---|
| `atom-radio--default` (default) | `--border-default` — neutral hairline | Standard surfaces (model picker sheet, thinking-level sheet) |
| `atom-radio--accent` | `--accent-primary` — ember orange | Inside ember-tinted or accent-surface backgrounds |
| `atom-radio--inverse` | `--border-default` (resolves differently in light) | Dark-on-light or inverse surface contexts |

All three variants share the same checked appearance: ember-orange ring + ember-orange center dot.

---

## Sizes

| Class modifier | Outer diameter | Center dot | Min-height note |
|---|---|---|---|
| `atom-radio--sm` | 14px | 6px | Touch target is molecule's responsibility |
| `atom-radio--md` (default) | 18px | 8px | Standard for model/thinking pickers |
| `atom-radio--lg` | 22px | 10px | Dense list rows where the label row is large |

Width and height are explicit px because they encode discrete size classes, not spacing
rhythm. The spacing scale starts at `--space-1` (4px) and has no 14/18/22px values.

---

## States

| Class / pseudo | Visual effect |
|---|---|
| default (no modifier) | Neutral ring, no dot |
| `is-checked` / `:has(input:checked)` | Ember ring + dot animates in via `scale(0 → 1)` |
| `is-hover` / `:hover` | Ring shifts to `--border-strong` |
| `is-active` | Same as hover (ring held at `--border-strong`) |
| `is-focus` / `:focus-within` | Outer `box-shadow: 0 0 0 2px var(--border-focus)` |
| `is-disabled` / `:has(input:disabled)` | Whole label at `opacity: 0.5`, `pointer-events: none` |
| `is-checked` + `is-disabled` | Faded ember — checked appearance at 50% opacity |

Checked state is dual-authored: `.is-checked` (JS/class toggle) AND
`:has(.atom-radio__input:checked)` (native CSS, works without JS).

---

## Token recipe

| Property | Token | Dark resolved | Light resolved |
|---|---|---|---|
| Ring border (unselected) | `--border-default` | `#2a2827` | `oklch(0.922 0 0)` |
| Ring border (accent variant, unselected) | `--accent-primary` | `#e07850` | `oklch(0.646 0.222 41.116)` |
| Ring border (checked) | `--accent-primary` | `#e07850` | `oklch(0.646 0.222 41.116)` |
| Ring border (hover) | `--border-strong` | `#3a3837` | `oklch(0.708 0 0)` |
| Focus ring shadow | `--border-focus` | `#3a3837` | `oklch(0.708 0 0)` |
| Center dot fill | `--accent-primary` | `#e07850` | `oklch(0.646 0.222 41.116)` |
| Transition duration | `--motion-fast` | `120ms` | `120ms` |
| Transition easing | `--motion-ease-out` | `cubic-bezier(0.16,1,0.3,1)` | same |
| Border radius (ring + dot) | `--radius-round` | `50%` | `50%` |
| Disabled opacity | `0.5` (unitless scalar) | — | — |

No TOKEN_GAPs required. All color, motion, and radius properties resolve through
existing tier-2 tokens. The 14/18/22px explicit sizes and 6/8/10px dot sizes are
structural encoding of discrete size classes, permitted by rule 3.

---

## Accessibility

- **Semantic element**: Real `<input type="radio">` — browser handles checked state,
  keyboard navigation (arrow keys cycle within same `name=` group), and AT announcements.
- **Label association**: The `<label>` wraps the `<input>`, providing implicit association.
  No `for=` + `id` pair needed. The molecule layer may add visible text siblings.
- **aria-label**: Each `<input>` carries `aria-label` naming the option
  (e.g., `aria-label="Claude Sonnet 4.6"`). If a visible sibling text node is present
  inside the same `<label>`, `aria-label` can be omitted — the label text suffices.
- **aria-hidden**: The `.atom-radio__ring` span is `aria-hidden="true"` — it is purely
  decorative. The hidden `<input>` carries all semantic weight.
- **Group**: Multiple `atom-radio` elements sharing `name="…"` form a radio group.
  Wrap in a `<fieldset>` + `<legend>` at the molecule layer to expose group label to AT.
- **Focus ring**: Rendered via `:focus-within` on the `<label>`, so keyboard focus on
  the hidden `<input>` lights up the visual ring correctly.
- **Reduced motion**: The center-dot `transform: scale(0 → 1)` animation respects
  `prefers-reduced-motion: reduce` — the transition still applies but browsers will
  reduce or skip it automatically at system level. No explicit override needed for
  a `transition`, unlike `animation` (see status-dot).
- **Touch target**: The atom itself is 14–22px — below `--touch-target-min` (44px).
  The molecule wrapping this atom is responsible for ensuring 44×44px touch area
  per WCAG 2.5.5 and iOS HIG.
