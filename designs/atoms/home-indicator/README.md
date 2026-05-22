# atom · home-indicator

## Purpose

The iOS home-indicator pill rendered as a standalone atom. While `device-bezel` embeds a primitive home-indicator element internally, this atom exists independently for two use cases:

1. **iOS home indicator** — the 134×5 pill that appears at the very bottom of every iPhone screen, signalling "swipe up to go home."
2. **Sheet handle** — the 36×5 pill centred at the top of a bottom-sheet, communicating draggability and swipe-to-dismiss.

Both shapes share identical visual structure (pill, single fill colour, fixed dimensions from tokens) — only the dimension tokens and contextual centering differ.

---

## Anatomy

```
<div class="atom-home-indicator
            atom-home-indicator--{variant}
            atom-home-indicator--{color}
            {state-class}">
</div>
```

The element is a dimensionless `<div>` whose size, colour, and border-radius come entirely from CSS custom properties. It is self-contained — no child elements required.

---

## Variants

| BEM modifier | Dimensions | Token source | Use case |
|---|---|---|---|
| `atom-home-indicator--ios` | 134 × 5 px | `--home-indicator-width` / `--home-indicator-height` | iOS home bar at viewport bottom |
| `atom-home-indicator--sheet-handle` | 36 × 5 px | `--sheet-handle-width` / `--sheet-handle-height` | Bottom-sheet drag affordance at sheet top |

The `--ios` variant is the default canonical form. When no variant class is supplied the element still renders using the base `atom-home-indicator` block styles (no dimensions — you must supply a variant or size it yourself).

---

## Color Modifiers

| BEM modifier | Token | Intended surface |
|---|---|---|
| `atom-home-indicator--default` | `--text-body` | On-page surface where indicator needs full visibility |
| `atom-home-indicator--muted` | `--text-faint` | Overlay surfaces (dark sheets, modals) where indicator should recede |

In the `device-bezel` atom the primitive indicator always uses `--text-body`. Use `--muted` on overlays with backgrounds darker or more saturated than `--surface-page`.

---

## States

| Class | Effect | When to apply |
|---|---|---|
| *(none)* | Default rest state | Indicator visible, not interacted with |
| `is-active` | `transform: scale(1.05)` + colour forced to `--text-body` | Sheet-handle variant only — applied during drag gesture in progress |
| `is-disabled` | `opacity: 0.3` | Indicator present but non-interactive or screen obscured |

`is-active` is only semantically meaningful on `--sheet-handle`; applying it to `--ios` has no visible effect beyond a negligible scale change.

---

## Token Recipe

| Property | Token | Resolved value |
|---|---|---|
| `width` (ios) | `--home-indicator-width` | 134px |
| `height` (ios) | `--home-indicator-height` | 5px |
| `width` (sheet-handle) | `--sheet-handle-width` | 36px |
| `height` (sheet-handle) | `--sheet-handle-height` | 5px |
| `border-radius` | `--radius-pill` | 999px |
| `background` (default) | `--text-body` | `var(--_neutral-fg-0)` |
| `background` (muted) | `--text-faint` | `var(--_neutral-fg-1)` |
| `margin` (sheet-handle) | `--space-2` auto | 8px auto |
| active scale | — | `scale(1.05)` |
| disabled opacity | — | `0.3` |
| transition | `--motion-fast` `--motion-ease-out` | 120ms cubic-bezier(0.16, 1, 0.3, 1) |

No hex literals. No pixel magic numbers. All values trace to tokens.

---

## iOS HIG Reference

- **Home indicator**: iPhone models without a Home button render a 134 pt × 5 pt pill 8 pt above the screen edge. Colour adapts automatically to the underlying content (light/dark). In design mocks, use `--text-body` for default visibility.
- **Bottom-sheet drag handle**: Sheets presented as cards should include a centred handle to convey dismissibility. Standard handle size is approximately 36 × 4–5 pt.
- **Safe area**: The home indicator overlaps `--safe-area-bottom` (24px). Content must not scroll under the indicator; use `padding-bottom: var(--safe-area-bottom)` on scrollable children.
- **Touch target**: The indicator itself is purely decorative — the swipe-up gesture covers the full bottom edge, not just the pill width.

---

## Accessibility

Both variants are **decorative chrome** — they carry no semantic meaning independent of the device or sheet context in which they appear.

- Apply `aria-hidden="true"` directly on the `atom-home-indicator` element in all usages.
- For the **sheet-handle** variant: draggability is communicated by the **parent container**, not the pill. The sheet wrapper should carry `role="dialog"` (or `role="complementary"`) and the drag-affordance region should carry `role="button" aria-label="Drag to dismiss"` with gesture handling attached. The pill is visual reinforcement only.
- For the **iOS home indicator** variant: no interactive role or label needed; the OS-level gesture affordance is not reproduced in web mocks.

```html
<!-- Correct: indicator is hidden, parent carries interaction semantics -->
<div class="bottom-sheet" role="dialog" aria-label="Select workspace">
  <div role="button" aria-label="Drag to dismiss" class="sheet-drag-region">
    <div class="atom-home-indicator atom-home-indicator--sheet-handle atom-home-indicator--default"
         aria-hidden="true"></div>
  </div>
  <!-- sheet content -->
</div>
```
