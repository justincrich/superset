# atom · backdrop

Full-screen dimmer overlay placed behind modals, bottom sheets, and popovers. Intercepts tap-to-dismiss and visually isolates foreground content from the page beneath.

---

## Anatomy

```
┌─────────────────────────────────────────┐
│  .atom-backdrop                         │
│  position: fixed; inset: 0             │
│  z-index: 100                           │
│  background: rgba(0,0,0,X)  ← variant  │
│  [backdrop-filter: blur(Y)]  ← variant  │
└─────────────────────────────────────────┘
```

The backdrop is a single `<div>` spanning the full viewport. It carries no layout children — all modal/sheet content is rendered as a sibling at a higher z-index.

---

## Variants

| Class modifier | Background | Filter | Context |
|---|---|---|---|
| `.atom-backdrop--scrim` (default) | `rgba(0,0,0,0.55)` | none | Standard confirmation modal, alert dialog |
| `.atom-backdrop--scrim-light` | `rgba(0,0,0,0.30)` | none | Lightweight popover, model picker dropdown |
| `.atom-backdrop--blur` | `rgba(0,0,0,0.40)` | `blur(8px)` | Bottom sheet (iOS-style frosted glass) |
| `.atom-backdrop--blur-strong` | `rgba(0,0,0,0.50)` | `blur(20px)` | Full-screen plan-review modal |

The default class `.atom-backdrop` (no modifier) behaves identically to `--scrim`.

---

## States

| Class | Behavior |
|---|---|
| _(no state class)_ | Fully visible, static |
| `.is-entering` | `opacity: 0 → 1` animated via `atom-backdrop-fade-in` keyframe |
| `.is-exiting` | `opacity: 1 → 0` animated via `atom-backdrop-fade-out` keyframe |

Transitions use `var(--motion-medium)` duration and `var(--motion-ease-out)` easing throughout.

---

## Token recipe

| Property | Token | Dark resolved | Light resolved | Notes |
|---|---|---|---|---|
| `transition-duration` | `--motion-medium` | `220ms` | `220ms` | Fade in/out duration |
| `transition-timing-function` | `--motion-ease-out` | `cubic-bezier(0.16,1,0.3,1)` | same | Spring-like decel |
| `animation-duration` (is-entering / is-exiting) | `--motion-medium` | `220ms` | `220ms` | Keyframe duration |
| `animation-timing-function` | `--motion-ease-out` | `cubic-bezier(0.16,1,0.3,1)` | same | |
| `z-index` | — (100, structural) | 100 | 100 | Must sit below modal/sheet z-indices |
| `backdrop-filter: blur(8px)` | — (8px, structural geometry) | 8px | 8px | See geometry exception below |
| `backdrop-filter: blur(20px)` | — (20px, structural geometry) | 20px | 20px | See geometry exception below |

### Hardware-black exception

The `background` values on all four variants use `rgba(0,0,0,X)` directly rather than a semantic token. This is a documented exception consistent with the Dynamic Island (`#000` background in `live-activity-dot`) and the device bezel shell (`--device-bg`).

**Rationale**: The backdrop must match the physical device black (OLED/True Black). A semantic token such as `--_neutral-0` (`#151110` in dark, `oklch(1 0 0)` in light) would produce a warm-tinted or white scrim rather than a true black dim. The opacity values `0.55 / 0.30 / 0.40 / 0.50` are intentional per-variant design decisions representing distinct contextual dimming levels — they are NOT arbitrary numbers to be normalized.

**Invariant across themes**: The backdrop renders identically in dark and light themes because hardware-black at partial opacity is theme-agnostic by definition.

### Blur geometry exception

`blur(8px)` and `blur(20px)` are structural pixel geometry values (like the 6px dot diameter in `live-activity-dot`). They fall below `--space-3` (12px) and above `--space-2` (8px is `--space-2`) respectively — the 20px value has no spacing-scale mapping. Both are explicit design choices for distinct tactile contexts (sheet frosting vs full-screen glass).

---

## Usage

```html
<!-- Standard modal backdrop -->
<div class="atom-backdrop atom-backdrop--scrim is-entering"
     role="presentation"
     aria-hidden="true"
     onclick="dismissModal()">
  <span class="sr-only">Tap outside to dismiss</span>
</div>

<!-- Bottom sheet backdrop (blur) -->
<div class="atom-backdrop atom-backdrop--blur"
     role="presentation"
     aria-hidden="true"
     onclick="dismissSheet()">
  <span class="sr-only">Tap outside to dismiss</span>
</div>
```

Modal content is a sibling at a higher z-index:

```html
<div class="atom-backdrop atom-backdrop--scrim" role="presentation" aria-hidden="true" onclick="dismiss()">
  <span class="sr-only">Tap outside to dismiss</span>
</div>
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <!-- modal content -->
</div>
```

---

## Accessibility

- The backdrop `<div>` carries `role="presentation"` and `aria-hidden="true"`. It is never a focus target.
- Tap-to-dismiss is wired via `onClick`. The `<span class="sr-only">Tap outside to dismiss</span>` inside the backdrop (or in the parent ARIA landmark) provides an accessible label for screen readers announcing the dismiss affordance.
- The modal/sheet content rendered **above** the backdrop must carry `role="dialog" aria-modal="true"`. The `aria-modal` attribute tells AT to restrict the virtual reading cursor to the dialog tree, making the backdrop's visual effect semantically consistent.
- Keyboard users dismiss via `Escape` — the backdrop's `onClick` alone is insufficient; the parent component must wire a `keydown` handler.
- Focus must be trapped inside the dialog while the backdrop is visible. When the backdrop exits (`is-exiting`), focus returns to the trigger element.

### Reduced motion

The fade animation respects `prefers-reduced-motion`. Under reduced-motion the backdrop appears/disappears instantly (no transition):

```css
@media (prefers-reduced-motion: reduce) {
  .atom-backdrop.is-entering,
  .atom-backdrop.is-exiting {
    animation: none;
    transition: none;
    opacity: 1;
  }
}
```

---

## TOKEN_GAPs

None. All values are either covered by existing tokens or documented as explicit structural/hardware exceptions above.
