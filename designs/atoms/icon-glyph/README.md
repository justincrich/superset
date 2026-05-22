# atom · icon-glyph

Single inline SVG icon governed entirely by size classes and optional color-modifier classes. The atom owns the **sizing and coloring contract** only — SVG path data is supplied by the caller (lucide-react-native in the app; inline SVG in design mocks).

---

## Anatomy

```html
<!-- Decorative icon (default — inherits parent text color) -->
<span aria-hidden="true">
  <svg class="atom-icon-glyph atom-icon-glyph--md"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-linecap="round"
       stroke-linejoin="round">
    <!-- lucide path data here -->
  </svg>
</span>

<!-- Accent-colored icon -->
<span aria-hidden="true">
  <svg class="atom-icon-glyph atom-icon-glyph--lg atom-icon-glyph--accent"
       viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <!-- lucide path data here -->
  </svg>
</span>

<!-- Status-conveying icon without adjacent label — needs role+aria-label -->
<span>
  <svg class="atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--live"
       role="img" aria-label="streaming"
       viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <!-- lucide path data here -->
  </svg>
</span>
```

The `<svg>` element carries the atom classes. `stroke-width` is set by the class (not inline). The `stroke="currentColor"` attribute is always present on the SVG element — the color modifier class overrides `color` on the element, which `currentColor` inherits.

---

## Size variants

| Class | Width × Height | stroke-width | Use case |
|---|---|---|---|
| `atom-icon-glyph--xs` | 12 × 12 | 1.5 | Inline in `.type-meta` text |
| `atom-icon-glyph--sm` | 16 × 16 | 1.75 | Pill leading icons, button accents |
| `atom-icon-glyph--md` *(default)* | 20 × 20 | 2 | Header buttons, composer toolbar |
| `atom-icon-glyph--lg` | 24 × 24 | 2 | Chat input bar, action buttons |
| `atom-icon-glyph--xl` | 32 × 32 | 2 | FAB icons, empty-state hero |

The `--sm` size is the nominal default when no size class is applied (falls through to `--sm` rules). Apply an explicit class for all other sizes.

---

## Color modifiers

| Class | Token | Resolved value | Use |
|---|---|---|---|
| *(none)* | `currentColor` | Inherits parent text color | Default — icon matches surrounding text |
| `atom-icon-glyph--muted` | `--text-muted` | `--_neutral-fg-1` | Secondary / supporting icons |
| `atom-icon-glyph--faint` | `--text-faint` | `--_neutral-fg-1` | Tertiary, placeholder, disabled-adjacent |
| `atom-icon-glyph--accent` | `--accent-primary` | `--_ember` | Ember-colored highlight icons |
| `atom-icon-glyph--live` | `--state-live-fg` | `--_green` | Streaming indicator, live-status icons |
| `atom-icon-glyph--danger` | `--state-danger-fg` | `--_red` | Destructive action icons |

---

## Icon naming conventions

Lucide names map 1:1. Use the lucide name as the reference identifier in comments and documentation (e.g., `<!-- lucide: send -->`). In React Native, import directly from `lucide-react-native`:

```tsx
import { Send } from 'lucide-react-native';
// size and color controlled by the component's style prop, mirroring these tokens
```

For HTML design mocks, inline the SVG path data from lucide.dev with `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. The atom class sets `width`, `height`, and `stroke-width`.

---

## Token recipe

| Property | Source |
|---|---|
| `width` / `height` | Hard pixel values on size class (12/16/20/24/32) — structural geometry, not semantic |
| `stroke-width` | Hard numeric value on size class (1.5/1.75/2) — TOKEN-AUDIT exception: SVG stroke-width is structural |
| `stroke` (attribute) | Always `currentColor` — inherits from CSS `color` |
| `color` (default) | Inherited from parent — no override |
| `color` (modifier) | `var(--text-muted)`, `var(--text-faint)`, `var(--accent-primary)`, `var(--state-live-fg)`, `var(--state-danger-fg)` |
| `display` | `block` — removes inline baseline gap |
| `flex-shrink` | `0` — never squashes inside flex rows |

---

## Accessibility

**Decorative icons** (icon accompanies a visible label, or is purely decorative):
- Wrap in `<span aria-hidden="true">` OR set `aria-hidden="true"` directly on the `<svg>`
- No role, no aria-label needed

**Action-bearing icons** (icon-only buttons — no visible text label):
- The `aria-label` goes on the **button parent**, not the SVG
- Set `aria-hidden="true"` on the SVG inside
```html
<button aria-label="Send message">
  <svg aria-hidden="true" class="atom-icon-glyph atom-icon-glyph--lg" ...>...</svg>
</button>
```

**Status-conveying icons** (standalone, not adjacent to a text label):
- Set `role="img"` and `aria-label` directly on the SVG
```html
<svg class="atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--live"
     role="img" aria-label="streaming" ...>...</svg>
```
