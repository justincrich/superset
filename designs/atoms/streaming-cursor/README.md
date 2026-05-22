# atom · streaming-cursor

## Purpose

The streaming cursor is the inline blinking caret appended to the end of assistant text while a response is actively streaming. It provides a real-time visual signal that content is still being generated.

Single purpose: one element, one job. It is never used outside of streaming assistant message context.

Used in: chat message bubbles (assistant side), streaming tool-call output.

---

## Anatomy

```
[span.atom-streaming-cursor  atom-streaming-cursor--{variant}]
       │
       └── display: inline-block
           width: 2px
           height: 1em            ← tracks surrounding line-height
           vertical-align: text-bottom
           margin-left: 2px       ← structural offset from last character
           background: var(--domain-streaming-cursor)
           box-shadow: 0 0 6px var(--state-live-dot)
           animation: atom-streaming-cursor-blink 1s steps(2) infinite
```

No child elements. Always a single `<span>` with `aria-hidden="true"`. The surrounding paragraph carries `role="status" aria-live="polite"` to communicate streaming intent to assistive technology.

---

## Variants

| Class modifier | Color token | Glow token | Animation | Semantic use |
|---|---|---|---|---|
| `atom-streaming-cursor--default` | `--domain-streaming-cursor` (→ `--state-live-dot`, mint green) | `--state-live-dot` | `blink` 1s `steps(2)` infinite | Active streaming |
| `atom-streaming-cursor--steady` | `--domain-streaming-cursor` | `--state-live-dot` | none | Static screenshots / snapshot tests |
| `atom-streaming-cursor--paused` | `--state-warning-dot` (amber) | `--state-warning-dot` | `blink` 0.6s `steps(2)` infinite | Stream is pause-pending / awaiting approval |

---

## States

| State class | Description |
|---|---|
| *(no state class)* | Normal rendering per variant |
| `.is-paused` | Alias shorthand for `--paused` behavior; co-applies with any variant for runtime state switching |

The `--paused` variant and `.is-paused` state class are intentionally overlapping — either can trigger the amber+faster-blink appearance.

---

## Token Recipe

| Property | Token | Resolved value (dark) |
|---|---|---|
| `background` (default) | `--domain-streaming-cursor` | `var(--state-live-dot)` → `var(--_green)` = `#50a878` |
| `box-shadow` glow (default) | `--state-live-dot` | `#50a878` |
| `background` (paused) | `--state-warning-dot` | `var(--_amber)` = `#d4a84b` |
| `box-shadow` glow (paused) | `--state-warning-dot` | `#d4a84b` |
| Animation duration (default) | literal `1s` | 1 second — structural timing, not a spacing/type literal |
| Animation duration (paused) | literal `0.6s` | 0.6 seconds — structural timing |
| `width` | literal `2px` | Cursor geometry — structural, not p/m/g |
| `height` | `1em` | Tracks current `font-size` of parent |
| `margin-left` | literal `2px` | Cursor geometry offset — structural |
| Glow blur radius (default) | literal `6px` | Structural glow geometry |
| Glow blur radius (paused) | literal `4px` | Structural glow geometry |

Zero hex literals in production CSS. All color values resolved through token chain.

---

## Accessibility

- The cursor `<span>` always carries `aria-hidden="true"` — it is purely decorative.
- The containing paragraph (or live region) must carry `role="status" aria-live="polite"` to announce streaming progress to screen readers.
- No minimum contrast requirement applies to decorative elements; the token colors are chosen for visual saliency, not text contrast compliance.
- Animation: respects `prefers-reduced-motion` — implementors should add `@media (prefers-reduced-motion: reduce)` suppression in the consuming component layer. The atom CSS does not include this override to stay self-contained; it is documented as an integration responsibility.

---

## Usage Example

```html
<p class="type-body" role="status" aria-live="polite">
  Refactoring the relay tunnel reconnect loop now—I'll preserve the inner
  try/catch and log err.code before the backoff sleeps<span
    class="atom-streaming-cursor atom-streaming-cursor--default"
    aria-hidden="true"
  ></span>
</p>
```

Paused state (awaiting approval):

```html
<p class="type-body" role="status" aria-live="polite">
  Awaiting approval to continue<span
    class="atom-streaming-cursor atom-streaming-cursor--paused"
    aria-hidden="true"
  ></span>
</p>
```
