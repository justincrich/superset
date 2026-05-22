# chat-view-loading

**UC-SESS-02 §A — Chat view: loading message history**

Renders the chat view in its transient loading state while session history is being fetched. Shows two sequential loading states (State A and State B) stacked in each theme pane.

---

## Composition

| Region | Composition |
|--------|-------------|
| Device frame | `atom-device-bezel` — iPhone 16 Pro Max (444 × 962) |
| Header | `mol-app-header` — "Fix auth bug" title / "superset · main" subtitle |
| Thread (State A) | `.view-chat-view-loading__loading-area` — centered `atom-spinner--ascii --lg --accent` + `.type-meta` "Loading history…" label |
| Thread (State B) | `.view-chat-view-loading__skeleton-area` — small spinner + label row, then 4–5 skeleton bubble placeholders (`--surface-soft` bg) with `@keyframes view-chat-view-loading-shimmer` shimmer |
| Composer | `mol-composer-row --idle .is-disabled` — textarea + send `atom-icon-button` both disabled |
| Toolbar | `mol-composer-toolbar .is-disabled` — model + thinking pills both disabled |

### State A — spinner (early loading)
Centered layout with the large ASCII braille spinner and a muted "Loading history…" label. No message shapes are shown yet. The composer and toolbar are present but fully disabled.

### State B — skeleton bubbles (mid-loading)
After approximately one second the UI transitions to this state. A small spinner + label row appears at the top of the thread area, followed by 4–5 alternating-width skeleton bubble shapes that approximate the visual rhythm of real message history. Shapes are right-aligned for user turns and left-aligned for assistant turns. Each shape carries a staggered `animation-delay` via `--skel-delay` custom property. A shimmer sweep (translateX) animates across all shapes.

---

## Stylesheets (load order)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

View-local rules are scoped to `.view-chat-view-loading__*` and defined in a `<style>` block within `chat-view-loading.html`. The shimmer animation is declared as `@keyframes view-chat-view-loading-shimmer` (view-local namespace).

---

## Tokens used

All colors, spacing, and typography values resolve to design tokens from `tokens.css`. No inline hex values or hard-coded pixel sizes appear in view-local rules. Structural geometry exceptions (e.g., `2px` stroke widths on SVG icons, `1.5px` signal-bar rects) follow the same documented exceptions as in `chat-view-thread`.

---

## Accessibility

- Thread region uses `role="status"` + `aria-live="polite"` + `aria-label="Loading message history"` so screen readers announce the loading state.
- Skeleton shapes carry `aria-hidden="true"` — they are decorative placeholders.
- All interactive composer controls carry `disabled` HTML attribute and `.is-disabled` CSS class.
- The spinner element wrapping `aria-hidden="true"` prevents the braille-character cycling from being read aloud redundantly.

---

## Reduced-motion

The shimmer `@keyframes` animation and the `atom-spinner--ascii` CSS animation both respect `@media (prefers-reduced-motion: reduce)`:
- Shimmer `::after` animation is set to `animation: none`.
- `atom-spinner--ascii::before` freezes at `content: '⠿'` per the atom's own reduced-motion rule.
