# atom · scroll-fade

A token-governed gradient fade overlay that signals scrollable content extends beyond the visible region. Absolutely positioned against the nearest `position: relative` scroll-container parent. Zero hex literals — all gradient stop colors resolve through CSS custom properties.

---

## Anatomy

```html
<div class="atom-scroll-fade
            atom-scroll-fade--top
            atom-scroll-fade--on-page
            atom-scroll-fade--md"
     aria-hidden="true"></div>
```

The element is always `aria-hidden="true"`. It is pure decorative chrome; the semantic scroll affordance is the scrollable region's native scroll behavior and its own accessible label.

The parent scroll container must be `position: relative` (or any positioned context) so the `position: absolute` fade anchors correctly.

---

## Variants

### Direction (2)

| Class | Position | Gradient | Default |
|---|---|---|---|
| `atom-scroll-fade--top` | `top: 0` | `surface-color` → `transparent` (top to bottom) | yes |
| `atom-scroll-fade--bottom` | `bottom: 0` | `transparent` → `surface-color` (top to bottom) | — |

The top variant is the default when no direction modifier is provided; the base class height and positioning require one direction modifier to be meaningful.

---

## Color modifiers

Three modifiers match the underlying surface color. The gradient opaque stop uses the same token as the surface beneath the fade so the overlay blends seamlessly.

| Class | Surface token | Typical context |
|---|---|---|
| `atom-scroll-fade--on-page` | `--surface-page` | Chat message thread, main view background |
| `atom-scroll-fade--on-soft` | `--surface-soft` | Subtle panel, sessions list, inset card |
| `atom-scroll-fade--on-overlay` | `--surface-overlay` | Bottom sheet interior, modal scroll body |

`--on-page` is the default; the base `--top` / `--bottom` rules use `--surface-page` unless overridden.

---

## Sizes

| Class | Height | Token alias | Use case |
|---|---|---|---|
| `atom-scroll-fade--sm` | `24px` | (`--space-6`) | Compact list headers, tight composer chrome |
| `atom-scroll-fade--md` | `40px` | (`--space-10`) | Default — message thread, sheet content |
| `atom-scroll-fade--lg` | `64px` | (`--space-16`) | Tall bottom-sheet headers, prominent bracketing |

Heights are structural geometry constants. `--md` (40px) is the default; no modifier is needed for the default size.

---

## States

| State | Class | Behavior |
|---|---|---|
| Visible | (none) | `opacity: 1` — fade is shown |
| Hidden | `is-hidden` | `opacity: 0` — fade disappears, animated via `--motion-fast` + `--motion-ease-out` |

`is-hidden` is applied when the scroll position is at the boundary the fade represents (e.g., scrolled to the very top → hide the top fade; scrolled to the very bottom → hide the bottom fade). The opacity transition ensures a smooth appearance/disappearance as the user scrolls near the edge.

---

## Token recipe

| Property | Token | Resolves to (dark) | Resolves to (light) |
|---|---|---|---|
| gradient stop — on-page | `--surface-page` | `--_neutral-0` (#151110) | `oklch(1 0 0)` |
| gradient stop — on-soft | `--surface-soft` | `--_neutral-4` (#2a2827) | `oklch(0.97 0 0)` |
| gradient stop — on-overlay | `--surface-overlay` | `--_neutral-2` (#201e1c) | `oklch(1 0 0)` |
| opacity transition duration | `--motion-fast` | 120ms | 120ms |
| opacity transition easing | `--motion-ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | cubic-bezier(0.16, 1, 0.3, 1) |
| height — sm | 24px | structural constant | structural constant |
| height — md (default) | 40px | structural constant | structural constant |
| height — lg | 64px | structural constant | structural constant |
| z-index | 5 | structural constant | structural constant |

---

## Accessibility

The scroll-fade is **purely decorative chrome** and must always carry `aria-hidden="true"`.

- The semantic scroll affordance is the scrollable region itself. Screen readers navigate by content; the gradient overlay adds no semantic value and would only add noise to the accessibility tree.
- `pointer-events: none` is REQUIRED. The fade must never block taps, clicks, or touch gestures on content that visually shows through the gradient.
- No interactive content may be placed inside a scroll-fade element.
- Color alone is not used to convey information; the fade is a visual affordance supplementing the native scroll behavior, which is already perceivable through scrollbar presence, momentum physics, and content truncation.
