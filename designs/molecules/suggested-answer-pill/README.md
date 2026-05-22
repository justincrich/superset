# mol-suggested-answer-pill

A tappable pill in the horizontal-scroll row of suggested answers inside the `ask_user` bottom sheet. Tapping pre-populates the freeform TextInput with the pill's text and triggers a brief `is-tapped` ghost feedback before the sheet processes the selection.

---

## Purpose

- Surfaces pre-defined answer options so users can respond to agent questions without typing
- Lives in a horizontally-scrollable `role="list"` row beneath the question text inside the `ask_user` bottom sheet
- Three variants cover the semantic weight spectrum: standard suggestion, recommended/highlighted suggestion, and less-prominent option
- Pills are single-token-ish; long-form answers belong in the text input, not pills

---

## Anatomy

```html
<button
  class="mol-suggested-answer-pill atom-pill atom-pill--default atom-pill--md"
  type="button"
  aria-label="Use suggested answer: tRPC"
>
  <span class="mol-suggested-answer-pill__text">tRPC</span>
</button>
```

- The `<button>` element IS the tap zone — no separate `atom-hit-target-wrapper` needed because `atom-pill--md` already provides 44pt minimum touch height via `--touch-target-min`
- `aria-label` pattern: `"Use suggested answer: {text}"` — communicates intent and content together
- `mol-suggested-answer-pill__text` is a plain span; molecule CSS does not restyle it beyond inheriting pill typography

---

## Variants

| Modifier class | Atom variant | Background | Text color | Use case |
|---|---|---|---|---|
| `mol-suggested-answer-pill--default` | `atom-pill--default` | `--surface-soft` | `--text-body` | Standard suggestion |
| `mol-suggested-answer-pill--accent` | `atom-pill--accent` | `--accent-primary-subtle` | `--accent-primary` | Recommended / highlighted suggestion |
| `mol-suggested-answer-pill--ghost` | `atom-pill--default` + ghost override | `transparent` | `--text-body` | Less-prominent option |

> The `--ghost` variant applies `background: transparent` and `border: 1px solid var(--border-default)` over the `atom-pill--default` base.

---

## States

| State class | Description |
|---|---|
| _(default)_ | Resting pill appearance |
| `is-hover` | Inherits `atom-pill--default` hover: `--surface-active` background |
| `is-active` | Inherits `atom-pill` active: `translateY(1px)` micro-press |
| `is-focus` | Inherits `atom-pill` focus: `box-shadow: 0 0 0 2px var(--border-focus)` |
| `is-tapped` | Ghost feedback while sheet TextInput populates: `opacity: 0.6`, `scale(0.98)`, transitions out in `--motion-fast` |
| `is-disabled` | Opacity 0.5, `pointer-events: none` — inherited from `atom-pill.is-disabled` |

---

## Atoms Used

| Atom | Class(es) applied | Role in molecule |
|---|---|---|
| `atom-pill` | `atom-pill--default atom-pill--md` | Base shape, 44pt height, `--radius-pill`, typography, hover/active/focus/disabled states |
| `atom-pill` | `atom-pill--accent atom-pill--md` | Accent variant — `--accent-primary-subtle` bg, `--accent-primary` text |

`atom-hit-target-wrapper` is implicit — the button itself satisfies the 44pt minimum via `atom-pill--md`'s `height: var(--touch-target-min)`.

---

## Token Recipe

| Property | Token | Notes |
|---|---|---|
| Base shape / bg (default) | `atom-pill--default` → `--surface-soft`, `--border-default` | Inherited from atom |
| Base shape / bg (accent) | `atom-pill--accent` → `--accent-primary-subtle` | Inherited from atom |
| Text color (accent) | `atom-pill--accent` → `--accent-primary` | Inherited from atom |
| Ghost bg override | `transparent` | Structural: no bg token maps to transparent |
| Ghost border | `--border-default` | 1px structural |
| Touch height | `atom-pill--md` → `--touch-target-min` (44px) | Meets WCAG 2.5.5 / iOS HIG |
| Tapped opacity | `0.6` | Structural: feedback fraction |
| Tapped scale | `scale(0.98)` | Structural: micro-press feedback |
| Tapped transition | `--motion-fast` + `--motion-ease-out` | Token-governed easing |
| Focus ring | `--border-focus` | Inherited from `atom-pill` |
| Disabled opacity | `0.5` | Inherited from `atom-pill.is-disabled` |
| `white-space` | `nowrap` | Structural: pills must not wrap |
| `flex-shrink` | `0` | Structural: pills must not shrink in scroll row |

---

## Accessibility

- `<button type="button" aria-label="Use suggested answer: {text}">` — native button semantics; screen readers announce purpose and pill text together
- Pills live inside a container with `role="list"` and `aria-label="Suggested answers"` — assistive technology announces list context
- Each pill is a list item (`role="listitem"`) so AT counts the options
- `is-tapped` state is purely visual; no ARIA state change needed (the TextInput population is the semantic event)
- All focus management follows natural DOM order within the scroll row
- Color is not the sole channel for the `--accent` variant — the `aria-label` already communicates selection weight if needed by the caller

---

## Molecule-local CSS glue (summary)

The following rules live in `suggested-answer-pill.html`'s `<style>` block. Pure layout glue — no atom-style redefinition.

```css
/* Layout: make the pill itself the 44pt tap zone */
.mol-suggested-answer-pill {
  min-height:      var(--touch-target-min);
  white-space:     nowrap;
  flex-shrink:     0;
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  cursor:          pointer;
}

/* Tapped state: ghost feedback while TextInput populates */
.mol-suggested-answer-pill.is-tapped {
  opacity:    0.6;
  transform:  scale(0.98);
  transition: opacity  var(--motion-fast) var(--motion-ease-out),
              transform var(--motion-fast) var(--motion-ease-out);
}

/* Ghost variant: transparent bg, default border */
.mol-suggested-answer-pill--ghost {
  background: transparent;
  border:     1px solid var(--border-default);
}
.mol-suggested-answer-pill--ghost:hover,
.mol-suggested-answer-pill--ghost.is-hover {
  background: var(--surface-soft);
}
```

> `reduced-motion`: `is-tapped` transition is suppressed via `@media (prefers-reduced-motion: reduce)` — opacity still drops to 0.6 but without animation.
