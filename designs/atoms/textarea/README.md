# atom · textarea

Multi-line text input atom. Used primarily by the chat composer (TiptapPromptEditor in production; rendered as `<textarea>` in design mocks). Auto-grows from a minimum touch-target height to a maximum cap height, then scrolls internally.

---

## Anatomy

```
┌─────────────────────────────────────────────────┐
│  atom-textarea                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  [text content / placeholder]             │  │
│  │                                           │  │
│  │  (grows downward to max-height,           │  │
│  │   then scrolls)                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

Parts:
- **Root** — `<textarea class="atom-textarea atom-textarea--{variant}">` — the control itself. No wrapper div needed; the textarea is the atom.
- **Placeholder text** — native `placeholder` attribute, styled via `::placeholder`.
- **Scroll thumb** — native system scrollbar, visible only when `is-autogrow-cap` content exceeds max-height.

---

## Variants

| Modifier class | Background token | Border token | Primary context |
|---|---|---|---|
| `atom-textarea--default` | `--surface-soft` | `--border-default` | Generic multi-line field in forms and modals |
| `atom-textarea--composer` | `--surface-sunken` | `--border-subtle` | Chat composer input footer |
| `atom-textarea--inset` | `--surface-page` | `--border-default` | Inside a sheet, drawer, or nested modal |

---

## Auto-grow behavior

The textarea uses `resize: none` and browser-native height. In production the TiptapPromptEditor handles auto-grow via JS (observe content height, set `height` in-place). In the design mock, auto-grow is approximated with `field-sizing: content` (Chromium 123+) with CSS min/max height constraints.

| Property | Value | Token |
|---|---|---|
| `min-height` | 44px | `var(--composer-min-height)` → `var(--touch-target-min)` |
| `max-height` | 180px | `var(--composer-max-height)` |
| At max-height | `overflow-y: auto` — internal scroll activates | — |
| Below max-height | `overflow-y: hidden` — no scrollbar visible | — |

The `is-autogrow-cap` modifier class adds `overflow-y: auto` explicitly so the state can be demonstrated statically in the design preview (the native textarea doesn't need the modifier; it is only used in the HTML specimen to show the capped-scroll state).

---

## States

| State class | Description | Visual change |
|---|---|---|
| *(none)* | Default empty | Placeholder text at `var(--text-faint)` |
| `is-typing` | Populated, below cap | Body text at `var(--text-body)` |
| `is-focus` | Active input focus | `box-shadow: 0 0 0 2px var(--border-focus)` |
| `is-error` | Validation failure | Border becomes `var(--state-danger-fg)`, focus ring becomes danger-tinted |
| `is-disabled` | Interaction locked | `opacity: 0.5`, `pointer-events: none`, `cursor: not-allowed` |
| `is-autogrow-cap` | Content at max-height, internal scroll active | `overflow-y: auto`, scrollbar appears at right edge |

---

## Token recipe

| Property | Token |
|---|---|
| `font-family` | `var(--font-body)` |
| `font-size` | `var(--font-size-body)` |
| `font-weight` | `var(--font-weight-body)` |
| `line-height` | `var(--line-height-normal)` |
| `letter-spacing` | `var(--tracking-normal)` |
| `color` | `var(--text-body)` |
| `::placeholder` color | `var(--text-faint)` |
| `padding` | `var(--spacing-internal)` (12px) |
| `border-radius` | `var(--radius-default)` |
| `min-height` | `var(--composer-min-height)` |
| `max-height` | `var(--composer-max-height)` |
| `--default` background | `var(--surface-soft)` |
| `--default` border | `1px solid var(--border-default)` |
| `--composer` background | `var(--surface-sunken)` |
| `--composer` border | `1px solid var(--border-subtle)` |
| `--inset` background | `var(--surface-page)` |
| `--inset` border | `1px solid var(--border-default)` |
| focus ring | `box-shadow: 0 0 0 2px var(--border-focus)` |
| error border | `1px solid var(--state-danger-fg)` |
| error ring | `box-shadow: 0 0 0 2px color-mix(in oklch, var(--state-danger-fg) 40%, transparent 60%)` |
| disabled opacity | `0.5` |
| transition | `border-color`, `box-shadow`, `opacity` at `var(--motion-fast) var(--motion-ease-out)` |

---

## Accessibility

- The textarea element is inherently `role="textbox"` with `aria-multiline="true"` (implicit on `<textarea>`). Adding `aria-multiline="true"` explicitly is acceptable and preferred for the composer context.
- Always pair with a visible `<label>` or provide `aria-label`. Composer usage: `<textarea aria-label="Message">`.
- Error state: add `aria-invalid="true"` and `aria-describedby` pointing to the helper text element.
- Disabled state: use `disabled` attribute (not just CSS) so the field is removed from tab order and screen readers announce it as disabled.
- Loading state: `aria-busy="true"` on the containing region when the textarea is locked during async submission.
- Autogrow-cap state: internal scroll MUST be keyboard-navigable. The browser-native `overflow-y: auto` on a `<textarea>` allows arrow keys to reach top and bottom of content without external intervention. Do not suppress this behavior.
- Touch target: `min-height: var(--composer-min-height)` (44px) satisfies WCAG 2.5.5 and iOS HIG touch target guidelines.
