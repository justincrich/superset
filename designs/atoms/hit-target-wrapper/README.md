# atom · hit-target-wrapper

An invisible wrapper that expands a small visual element's tap zone to meet the 44pt mobile minimum. The wrapper itself is the interactive element (`<button>` or `<a>`); the visual glyph lives inside it as a presentational child.

Use this atom whenever a glyph or icon is intentionally designed to be visually smaller than the touch target — a 14px dismiss `✕`, a 16px chevron, a 10px drag handle — but must still be tap-friendly on mobile.

---

## Anatomy

```
.atom-hit-target-wrapper              ← <button> root; the actual interactive element
  └── [visual glyph]                  ← aria-hidden="true"; purely decorative
        e.g. <svg>, <span>, text char
```

The wrapper owns all geometry, interactivity, and accessibility surface. The inner glyph is `aria-hidden="true"` and carries zero semantic weight. All meaning is conveyed by `aria-label` on the wrapper.

---

## Variants

Only one structural variant exists: the default wrapper. Shape is controlled by separate modifier classes (see below).

| Class | Effect |
|---|---|
| `atom-hit-target-wrapper` (base) | `display: inline-flex; align-items: center; justify-content: center; min-width: var(--touch-target-min); min-height: var(--touch-target-min)` |

---

## Shape modifiers

| Class | `border-radius` | Use case |
|---|---|---|
| `atom-hit-target-wrapper--square` (default) | `0` — square bounds, no rounding | Drag handles, inline dismiss controls |
| `atom-hit-target-wrapper--circle` | `var(--radius-round)` — circular tap zone | Dismiss badges, circular icon actions |

The square modifier is implied when no modifier is present. Apply `--circle` for any case where a round tap affordance is preferable (e.g., a dismiss pill on a notification).

---

## Debug modifier

| Class | Effect | When to use |
|---|---|---|
| `atom-hit-target-wrapper--debug` | `outline: 1px dashed var(--state-warning-fg); outline-offset: -1px` | Design review only — never production |

The debug modifier visualizes the invisible tap bounds. It uses `--state-warning-fg` (amber) for high visibility against both dark and light surfaces. The `outline-offset: -1px` keeps the dashed line inset so it does not collide with adjacent elements.

**Production rule**: strip `--debug` before shipping. It exists exclusively for design-review and preview HTML files.

---

## States

| State | Class / pseudo | Visual effect |
|---|---|---|
| Default | — | Fully transparent; no visual chrome |
| Hover | `:hover` / `.is-hover` | `background: color-mix(in oklch, var(--text-body) 8%, transparent)` — subtle wash for keyboard/pointer feedback. Some surfaces (e.g., floating overlays) may suppress this. |
| Focus | `:focus-visible` / `.is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)` clipped to wrapper bounds. Never suppress `:focus-visible`. |

There is no Active state (scale / color shift) by design — the wrapper is invisible; pressing feedback belongs to the containing component if needed.

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `min-width` / `min-height` | `var(--touch-target-min)` | 44px per WCAG 2.5.5 + iOS HIG |
| `border-radius` (circle) | `var(--radius-round)` | 50% — perfectly circular |
| `background` (hover) | `color-mix(in oklch, var(--text-body) 8%, transparent)` | Theme-adaptive wash; works dark + light |
| `box-shadow` (focus) | `0 0 0 2px var(--border-focus)` | Consistent with other atom focus rings |
| `outline` (debug) | `1px dashed var(--state-warning-fg)` | Amber — visible on both themes |

No hex literals. No hardcoded `44px`. The single size-related literal in this atom is the `2px` focus ring offset, which is a layout constant, not a design token.

---

## WCAG 2.1 reference — Success Criterion 2.5.5 (Target Size, Level AAA)

> "The size of the target for pointer inputs is at least 44 by 44 CSS pixels."

This atom exists to satisfy that criterion for elements whose **visual rendering** cannot be enlarged without breaking the design language. The canonical pattern:

1. Visual glyph renders at its designed size (e.g., 14px `✕`).
2. `atom-hit-target-wrapper` surrounds it as the `<button>`.
3. The button's minimum dimensions are `var(--touch-target-min)` × `var(--touch-target-min)`.
4. The button carries `aria-label` describing the action.
5. The glyph carries `aria-hidden="true"`.

**The wrapper IS the button.** Do not nest a second `<button>` or `<a>` inside the wrapper.

### Relation to WCAG 2.5.8 (Target Size Minimum, Level AA, WCAG 2.2)

WCAG 2.2 introduced a weaker AA criterion (24×24 with spacing). This system targets the stronger AAA threshold (44×44) because `--touch-target-min` was set to `44px` to align with the iOS HIG, which is the deployment target.

---

## Accessibility requirements

```html
<!-- Required pattern -->
<button
  class="atom-hit-target-wrapper atom-hit-target-wrapper--circle"
  aria-label="Dismiss notification"
  type="button"
>
  <span aria-hidden="true">✕</span>
</button>
```

- The `<button>` must have `aria-label` (or `aria-labelledby`) — the inner glyph carries no AT-visible text.
- The inner glyph must carry `aria-hidden="true"`.
- Use `type="button"` to prevent accidental form submission.
- For link semantics, use `<a>` with `href` and `aria-label`.
- Never nest a `<button>` inside another `<button>`.

---

## Usage examples

```html
<!-- Dismissible toast -->
<div class="toast">
  <span class="toast__message">File saved successfully</span>
  <button
    class="atom-hit-target-wrapper atom-hit-target-wrapper--circle"
    aria-label="Dismiss notification"
    type="button"
  >
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
</div>

<!-- Picker chevron -->
<button
  class="atom-hit-target-wrapper atom-hit-target-wrapper--square"
  aria-label="Open model picker"
  type="button"
>
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
</button>

<!-- Session drag handle -->
<button
  class="atom-hit-target-wrapper atom-hit-target-wrapper--square"
  aria-label="Drag to reorder"
  type="button"
>
  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="5" r="1" fill="currentColor"/>
    <circle cx="9" cy="12" r="1" fill="currentColor"/>
    <circle cx="9" cy="19" r="1" fill="currentColor"/>
    <circle cx="15" cy="5" r="1" fill="currentColor"/>
    <circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="15" cy="19" r="1" fill="currentColor"/>
  </svg>
</button>
```
