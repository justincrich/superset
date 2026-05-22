# atom · progress-dots

A 3-dot horizontally-arranged loading indicator with staggered pulse animation. Distinct from `spinner` (circular SVG border / braille glyph) and `streaming-cursor` (single inline block). Use this atom when a loading state needs spatial presence without enclosing the full content region — typing bubbles, list-footer loads, preview popovers.

---

## Anatomy

```
┌─ .atom-progress-dots [role="status" wrapper] ─────────────────┐
│  aria-hidden dots ──▶  ●  ●  ●  (3 × .atom-progress-dots__dot)│
└───────────────────────────────────────────────────────────────┘
```

| Element | Class | Role |
|---|---|---|
| Container | `.atom-progress-dots` | `inline-flex` row; gap from size variant |
| Dot | `.atom-progress-dots__dot` | Decorative circle; `aria-hidden="true"` on parent |
| a11y wrapper | `<div role="status" aria-live="polite" aria-busy="true">` | Outer element; never receives dot classes |
| Screen-reader label | `<span class="sr-only">Loading</span>` | Inside the `role="status"` wrapper |

---

## Variants (color)

| Modifier class | Token | Use case |
|---|---|---|
| *(none / default)* | `--text-muted` | Generic loading |
| `atom-progress-dots--muted` | `--text-muted` | Generic loading (explicit) |
| `atom-progress-dots--accent` | `--accent-primary` | Brand-tinted loading |
| `atom-progress-dots--live` | `--state-live-fg` | Streaming / agent-thinking indicator |
| `atom-progress-dots--faint` | `--text-faint` | Subtle background loading |

Color variants override `background` on `.atom-progress-dots__dot` only. The parent container is color-neutral.

---

## Sizes

| Modifier class | Dot diameter | Container gap | Default |
|---|---|---|---|
| `atom-progress-dots--xs` | 4px | `var(--space-1)` | |
| `atom-progress-dots--sm` | 6px | `var(--space-1)` | yes |
| `atom-progress-dots--md` | 8px | `var(--space-2)` | |

Dot diameters (4 / 6 / 8 px) are structural geometry values — not available as semantic tokens. All gaps use `var(--space-*)` tokens.

---

## States

| Class on `.atom-progress-dots` | Behavior |
|---|---|
| *(none)* | Staggered pulse animation running |
| `is-paused` | `animation-play-state: paused` on all dots — frozen at current frame |

`is-paused` is primarily for snapshot testing and debug inspection, not a visible product state.

---

## Token recipe

| Property | Token |
|---|---|
| Container gap (xs, sm) | `var(--space-1)` |
| Container gap (md) | `var(--space-2)` |
| Dot border-radius | `var(--radius-round)` |
| Animation duration (default) | `var(--motion-cadence-pulse-medium)` — 1.4 s |
| Animation duration (slow variant if needed) | `var(--motion-cadence-pulse-slow)` — 2 s |
| Color — muted | `var(--text-muted)` |
| Color — accent | `var(--accent-primary)` |
| Color — live | `var(--state-live-fg)` |
| Color — faint | `var(--text-faint)` |

**Dot sizes (4 / 6 / 8 px) are structural geometry exceptions** — equivalent to `spinner`'s 2px border-width. No semantic spacing token maps to sub-`--space-1` dot radii.

---

## Accessibility

Wrap the component in a live region. The dots themselves carry no semantic meaning:

```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading</span>
  <span class="atom-progress-dots atom-progress-dots--sm atom-progress-dots--muted"
        aria-hidden="true">
    <span class="atom-progress-dots__dot"></span>
    <span class="atom-progress-dots__dot"></span>
    <span class="atom-progress-dots__dot"></span>
  </span>
</div>
```

- `role="status"` + `aria-live="polite"` — announces the label without interrupting
- `aria-busy="true"` — signals active loading to assistive tech; set `false` when done
- `aria-hidden="true"` on `.atom-progress-dots` — dots are decorative; screen reader reads only the `.sr-only` label
- **Reduced motion**: animation disabled entirely; dots render at `opacity: 0.8` static

---

## Composition patterns

### Inline message-list footer
```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading history</span>
  <div style="display:inline-flex; align-items:center; gap:var(--space-2);">
    <span class="atom-progress-dots atom-progress-dots--sm atom-progress-dots--muted"
          aria-hidden="true">
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
    </span>
    <span style="font-size:var(--font-size-meta); color:var(--text-muted);">Loading history...</span>
  </div>
</div>
```

### Slash-command preview popover
```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading preview</span>
  <div style="display:inline-flex; align-items:center; gap:var(--space-2);">
    <span style="font-size:var(--font-size-body-sm); color:var(--text-body);">/deploy</span>
    <span class="atom-progress-dots atom-progress-dots--xs atom-progress-dots--muted"
          aria-hidden="true">
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
    </span>
  </div>
</div>
```

### Assistant typing indicator (iMessage-style)
```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Assistant is typing</span>
  <div style="display:inline-flex; align-items:center; gap:var(--space-2);">
    <!-- avatar -->
    <span class="avatar" aria-hidden="true">A</span>
    <span class="atom-progress-dots atom-progress-dots--md atom-progress-dots--live"
          aria-hidden="true">
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
      <span class="atom-progress-dots__dot"></span>
    </span>
  </div>
</div>
```

---

## Sibling atoms

| Atom | Shape | Motion | Use when |
|---|---|---|---|
| `spinner` | Circular arc or braille glyph | Continuous rotation | Single-point loading, inline with text or buttons |
| `progress-dots` | 3-dot triad | Staggered pulse | Multi-dot presence; typing indicator; list-footer |
| `streaming-cursor` | Single blinking block | Square-wave blink | Inline end-of-streamed-text indicator |
