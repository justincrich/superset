# atom · tooltip

A small contextual hint bubble that appears on hover (desktop) or long-press (mobile). Used for icon-only button affordance text, keyboard-shortcut reminders, and brief supplementary help text. Tooltips carry no critical information — they are supplementary only.

---

## Anatomy

```
atom-tooltip [atom-tooltip--{variant}] [atom-tooltip--{position}] [is-{state}]
└── atom-tooltip__body        ← text content + optional kbd glyph
└── atom-tooltip__arrow       ← CSS diamond arrow, aria-hidden
```

HTML skeleton:

```html
<span class="atom-tooltip atom-tooltip--inverse atom-tooltip--top is-visible"
      role="tooltip" id="tooltip-send">
  <span class="atom-tooltip__body">Send message</span>
  <span class="atom-tooltip__arrow" aria-hidden="true"></span>
</span>
```

Trigger (co-located):

```html
<button aria-describedby="tooltip-send" aria-label="Send message">
  <!-- icon -->
</button>
```

---

## Variants

| Class modifier | Background | Text color | Border | Use case |
|---|---|---|---|---|
| `atom-tooltip--inverse` | `--surface-inverse` | `--text-on-inverse` | none | Standard tooltip — maximum contrast against dark/light surfaces |
| `atom-tooltip--default` | `--surface-overlay` | `--text-body` | `1px solid --border-default` | Light-surface tooltip with visible border |
| `atom-tooltip--shortcut` | `--surface-overlay` | `--text-body` | `1px solid --border-default` | Same surface as `--default`; body contains inline `atom-kbd` glyph(s) |

---

## Positions

| Class modifier | Placement | Arrow |
|---|---|---|
| `atom-tooltip--top` (default) | Above trigger | Points downward from bottom edge of body |
| `atom-tooltip--bottom` | Below trigger | Points upward from top edge of body |
| `atom-tooltip--left` | Left of trigger | Points rightward from right edge of body |
| `atom-tooltip--right` | Right of trigger | Points leftward from left edge of body |

The tooltip body is `position: absolute`; the trigger wrapper must carry `position: relative`. An 8px gap between body edge and trigger is maintained via the arrow geometry (arrow height 6px + 2px clearance).

---

## States

| Class | Visual | Notes |
|---|---|---|
| `is-entering` | `opacity: 0`, `scale(0.95)` → animate to `is-visible` | Transition: `var(--motion-fast) var(--motion-ease-out)` |
| `is-visible` | `opacity: 1`, `scale(1)` | Default display state |
| `is-exiting` | `opacity: 1`, `scale(1)` → animate to `opacity: 0`, `scale(0.95)` | Same duration as entering |

Transform origin is positioned at the arrow tip so the bubble scales toward the trigger:

- `--top`: `transform-origin: bottom center`
- `--bottom`: `transform-origin: top center`
- `--left`: `transform-origin: right center`
- `--right`: `transform-origin: left center`

---

## Token Recipe

| Property | Token |
|---|---|
| `background-color` (inverse) | `var(--surface-inverse)` |
| `background-color` (default, shortcut) | `var(--surface-overlay)` |
| `color` (inverse) | `var(--text-on-inverse)` |
| `color` (default, shortcut) | `var(--text-body)` |
| `border` (default, shortcut) | `1px solid var(--border-default)` |
| `box-shadow` | `var(--elevation-overlay)` |
| `border-radius` | `var(--radius-default)` |
| `padding` | `var(--space-2) var(--space-3)` |
| `font-family` | `var(--font-mono)` |
| `font-size` | `var(--font-size-meta)` |
| `font-weight` | `var(--font-weight-meta)` |
| `letter-spacing` | `var(--tracking-mono)` |
| `line-height` | `var(--line-height-tight)` |
| `transition` | `opacity var(--motion-fast) var(--motion-ease-out), transform var(--motion-fast) var(--motion-ease-out)` |
| Arrow size | `6px` — structural geometry literal (permitted) |
| Arrow gap | `8px` — structural geometry literal (permitted) |
| `z-index` | `100` — layout literal (no token maps this) |

---

## Accessibility

- Tooltip element carries `role="tooltip"` and a unique `id`.
- The trigger element carries `aria-describedby="{tooltip-id}"`.
- The arrow element carries `aria-hidden="true"`.
- On desktop: show on `:hover` + `:focus-visible` of trigger. Dismiss on `Escape`.
- On mobile: show on long-press (`touchstart` held 500ms). Dismiss on `touchend` / tap elsewhere.
- Tooltips MUST NOT contain the only source of critical information. Any action that requires understanding must be labeled elsewhere (e.g., `aria-label` on the trigger itself).
- Disabled interactive elements cannot receive focus. Wrap in `<span tabindex="0" aria-disabled="true">` before attaching a tooltip to them.
- The tooltip body should be concise — single line preferred, two lines maximum.
