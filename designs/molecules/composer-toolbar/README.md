# mol-composer-toolbar

The horizontal row of picker-trigger chips that sits above the composer textarea. Implements UC-COMP-01 §A: `[Model] [⚡ Thinking] [🔐 Permission]` on a momentum-scroll row sized for mobile-narrow viewports.

---

## Purpose

- Surfaces the three active session settings (model, thinking level, permission mode) as tappable chips at a glance
- Horizontally scrollable on narrow screens (< ~360 px) so no chip is ever clipped or truncated
- Provides a right-side scroll-fade gradient that signals overflow when the row overflows
- Disables all chips (opacity + pointer-events) while a response is streaming

---

## Anatomy

```html
<div class="mol-composer-toolbar mol-composer-toolbar--default"
     role="toolbar" aria-label="Composer settings">

  <!-- Picker-trigger: model -->
  <button class="mol-composer-toolbar__trigger atom-pill atom-pill--default atom-pill--sm"
          type="button" aria-haspopup="listbox" aria-label="Model: Sonnet 4.6">
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted" aria-hidden="true">…sparkles…</svg>
    <span>Sonnet 4.6</span>
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint" aria-hidden="true">…chevron-down…</svg>
  </button>

  <!-- Picker-trigger: thinking level -->
  <button class="mol-composer-toolbar__trigger atom-pill atom-pill--default atom-pill--sm"
          type="button" aria-haspopup="listbox" aria-label="Thinking level: low">
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted" aria-hidden="true">…zap…</svg>
    <span class="atom-section-label atom-section-label--muted">Thinking:</span>
    <span>low</span>
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint" aria-hidden="true">…chevron-down…</svg>
  </button>

  <!-- Picker-trigger: permission mode -->
  <button class="mol-composer-toolbar__trigger atom-pill atom-pill--default atom-pill--sm"
          type="button" aria-haspopup="listbox" aria-label="Permission mode: default">
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted" aria-hidden="true">…shield…</svg>
    <span>default</span>
    <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint" aria-hidden="true">…chevron-down…</svg>
  </button>

  <!-- Scroll-fade (right-edge overflow indicator) -->
  <div class="mol-composer-toolbar__scroll-fade atom-scroll-fade atom-scroll-fade--right atom-scroll-fade--sm"
       aria-hidden="true"></div>
</div>
```

Each `mol-composer-toolbar__trigger` is a **picker-trigger** composition: `atom-pill--default atom-pill--sm` base with `atom-icon-glyph--xs` leading icon + `atom-section-label` optional key label + value text + `atom-icon-glyph--xs` trailing chevron.

---

## Variants

| Class | Effect |
|---|---|
| `mol-composer-toolbar--default` | All three picker-triggers (model, thinking, permission) visible |
| `mol-composer-toolbar--compact` | Only model + thinking visible; permission trigger hidden via `display: none` |

---

## States

| State class on `.mol-composer-toolbar` | Visual |
|---|---|
| _(none / default)_ | Scroll-fade hidden (all chips fit); triggers fully interactive |
| `is-overflow` | Right-side scroll-fade visible — indicates there is more content to scroll to |
| `is-disabled` | All `.mol-composer-toolbar__trigger` children: `opacity: 0.5`, `pointer-events: none` |

---

## Atoms used

| Atom | Class(es) applied | Role |
|---|---|---|
| `atom-pill` | `--default --sm` | Base chip shape, background, border, focus ring |
| `atom-icon-glyph` | `--xs --muted` | Leading icon per trigger (sparkles / zap / shield) |
| `atom-icon-glyph` | `--xs --faint` | Trailing chevron-down per trigger |
| `atom-section-label` | `--muted` (inline) | "Thinking:" key-label prefix on the thinking trigger |
| `atom-scroll-fade` | `--right --sm` | 24 px right-edge overflow gradient |

**Atom composition count: 5 atom classes across 3 triggers + 1 scroll-fade = 13 atom instances total.**

---

## Inline picker-trigger structure

`mol-composer-toolbar__trigger` is the molecule-layer picker-trigger composition. It is **not** an atom redefinition — it layers molecule-scoped `flex-shrink: 0` on the existing `atom-pill` base. Structure per trigger:

```
atom-pill--default atom-pill--sm          ← pill base (background, shape, border)
  atom-icon-glyph--xs --muted             ← leading category icon (12×12)
  [atom-section-label --muted]            ← optional "Key:" prefix (thinking trigger only)
  <span> value text </span>               ← current selection
  atom-icon-glyph--xs --faint             ← trailing chevron-down (12×12)
```

---

## Token recipe

| Property | Token | Element |
|---|---|---|
| Toolbar gap | `var(--space-2)` | `.mol-composer-toolbar` |
| Toolbar padding-block | `var(--space-1)` | `.mol-composer-toolbar` |
| Toolbar padding-inline | `var(--space-3)` | `.mol-composer-toolbar` |
| Chip height | `20px` (structural — atom-pill--sm) | `.mol-composer-toolbar__trigger` |
| Chip padding-inline | `var(--space-2)` | via `atom-pill--sm` |
| Chip gap (icon-text) | `var(--space-1)` | via `atom-pill--sm` |
| Chip background | `var(--surface-soft)` | via `atom-pill--default` |
| Chip border | `0.5px solid var(--border-default)` | via `atom-pill--default` |
| Chip text color | `var(--text-body)` | via `atom-pill--default` |
| Leading icon color | `var(--text-muted)` | via `atom-icon-glyph--muted` |
| Trailing chevron color | `var(--text-faint)` | via `atom-icon-glyph--faint` |
| Section-label color | `var(--text-muted)` | via `atom-section-label--muted` |
| Disabled opacity | `0.5` | `.is-disabled .mol-composer-toolbar__trigger` |
| Scroll-fade height | `24px` | via `atom-scroll-fade--sm` |
| Scroll-fade width | `var(--space-8)` | `.mol-composer-toolbar__scroll-fade` |
| Scroll-fade direction | right-edge | custom `--right` direction rule |
| Focus ring | `0 0 0 2px var(--border-focus)` | via `atom-pill:focus-visible` |
| Motion | `var(--motion-fast) var(--motion-ease-out)` | via `atom-pill` transition |

---

## Accessibility

- `<div role="toolbar" aria-label="Composer settings">` — declares a toolbar landmark; screen readers announce entry and exit
- Each trigger carries `aria-haspopup="listbox"` — tells assistive technology that activating opens a selection list
- Each trigger carries a descriptive `aria-label` naming both the control and its current value (e.g. `"Model: Sonnet 4.6"`) — readable independently of the visual icon
- Arrow keys (`ArrowLeft` / `ArrowRight`) cycle focus between toolbar buttons per WAI-ARIA toolbar pattern
- The scroll-fade overlay is `aria-hidden="true"` — purely visual, not announced
- The `is-disabled` state applies `pointer-events: none` to prevent activation during streaming; a `aria-disabled="true"` attribute should also be toggled by the consuming component
- Touch targets: `atom-pill--sm` height is 20 px — below 44 pt iOS minimum. The toolbar sits directly above the textarea which provides clearance; consuming components should audit whether a larger hit-target wrapper is warranted for standalone usage
