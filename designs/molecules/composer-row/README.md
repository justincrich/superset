# mol-composer-row

The horizontal input row at the bottom of the chat composer. Composes a `--composer` textarea on the left and a pill icon-button on the right. Four state-driven variants cover the full turn lifecycle: idle (no content), typing (content present), streaming (model is generating), and sending (message in flight).

---

## Purpose

- Provides the primary text-entry and send/stop affordance for UC-COMP-01 §A/B and UC-COMP-03 §A
- Single responsibility: textarea + trailing action button in a flex row
- Pairs with `mol-composer-toolbar` above it to form the full composer cluster
- Textarea auto-grows from one line to the `--composer-max-height` cap; then scrolls internally
- Keyboard shortcut: Cmd/Ctrl+Enter submits from within the textarea (implemented by the host React component, not in this HTML)

---

## Anatomy

```html
<form class="mol-composer-row mol-composer-row--{variant}" aria-label="Compose message">

  <!-- Hidden label for screen readers -->
  <label class="sr-only" for="composer-input">Message</label>

  <!-- Textarea atom: --composer --md, flex-grows to fill row -->
  <textarea id="composer-input"
            class="atom-textarea atom-textarea--composer atom-textarea--md type-body mol-composer-row__input"
            placeholder="Type a message…"
            rows="1"
            aria-label="Message"></textarea>

  <!-- Action slot: Send OR Stop button -->
  <button type="submit"
          class="atom-icon-button atom-icon-button--primary atom-icon-button--md atom-icon-button--pill mol-composer-row__action"
          aria-label="Send message"
          disabled>
    <!-- atom-icon-glyph md: paper-plane (send) OR square (stop) -->
    <svg class="atom-icon-glyph atom-icon-glyph--md" aria-hidden="true">…</svg>
  </button>

</form>
```

---

## Variants

| Class modifier | Textarea state | Action button | Notes |
|---|---|---|---|
| `mol-composer-row--idle` (default) | Empty, placeholder visible | Send — `--primary --pill`, `disabled`, opacity 0.6 | No content yet |
| `mol-composer-row--typing` | Populated content | Send — `--primary --pill`, active (ember), opacity 1 | User has typed |
| `mol-composer-row--streaming` | Disabled; grey placeholder "(input disabled while turn is streaming)" | Stop — `--destructive --pill`, square glyph | Model generating |
| `mol-composer-row--sending` | Disabled; pending content visible | `atom-progress-dots --sm --accent` in place of Send button | Message in flight |

---

## States

| State class on `<form>` | Effect |
|---|---|
| (none) | Variant default behavior |
| `is-disabled` | Whole-row disabled — textarea `disabled`, action button `disabled`, row `opacity: 0.5 pointer-events: none` |

---

## Atoms used

| Atom | Class(es) | Role |
|---|---|---|
| `atom-textarea` | `--composer --md` | Auto-grow text input, `--composer` surface and border variant |
| `atom-icon-button` | `--primary --md --pill` | Send button; amber background, pill radius |
| `atom-icon-button` | `--destructive --md --pill` | Stop button; danger background, pill radius, streaming variant only |
| `atom-icon-glyph` | `--md` | Paper-plane glyph (send) or square glyph (stop) inside button |
| `atom-progress-dots` | `--sm --accent` | Inline sending indicator replacing the Send button in `--sending` variant |

**Atom count: 5 distinct atoms** (textarea, icon-button ×2 variants, icon-glyph, progress-dots)

---

## Token recipe

| Property | Token | Applies to |
|---|---|---|
| Row display | `flex` | `.mol-composer-row` |
| Row align | `flex-end` | `.mol-composer-row` — keeps button bottom-aligned when textarea grows |
| Row gap | `var(--space-2)` | `.mol-composer-row` |
| Row padding block | `var(--space-2)` | `.mol-composer-row` |
| Row padding inline | `var(--space-3)` | `.mol-composer-row` |
| Textarea flex | `flex: 1` | `.mol-composer-row__input` |
| Textarea min-height | `var(--composer-min-height)` → `var(--touch-target-min)` = 44px | `.mol-composer-row__input` |
| Textarea max-height | `var(--composer-max-height)` = 180px | from atom |
| Button flex-shrink | `0` | `.mol-composer-row__action` |
| Idle button opacity | `0.6` | `.mol-composer-row--idle .mol-composer-row__action` |
| Typing button opacity | `1` | `.mol-composer-row--typing .mol-composer-row__action` |
| Streaming textarea opacity | `0.5` | `.mol-composer-row--streaming .mol-composer-row__input` |
| Streaming textarea pointer-events | `none` | `.mol-composer-row--streaming .mol-composer-row__input` |
| Row disabled opacity | `0.5` | `.mol-composer-row.is-disabled` |
| Row disabled pointer-events | `none` | `.mol-composer-row.is-disabled` |
| Send button background | `var(--accent-primary)` | `atom-icon-button--primary` |
| Send button foreground | `var(--accent-primary-fg)` | `atom-icon-button--primary` |
| Stop button background | `var(--state-danger-fg)` | `atom-icon-button--destructive` |
| Stop button foreground | `var(--accent-primary-fg)` | `atom-icon-button--destructive` |
| Progress dots color | `var(--accent-primary)` | `atom-progress-dots--accent` |
| Textarea background | `var(--surface-sunken)` | `atom-textarea--composer` |
| Textarea border | `1px solid var(--border-subtle)` | `atom-textarea--composer` |
| Focus ring | `0 0 0 2px var(--border-focus)` | `atom-textarea:focus` |
| Motion | `var(--motion-fast) var(--motion-ease-out)` | all interactive transitions |

---

## Accessibility

- `<form aria-label="Compose message">` — landmark label; screen readers announce "Compose message, form"
- Hidden `<label for="composer-input">Message</label>` — visually hidden via `.sr-only`, linked to textarea by `id`; provides programmatic accessible name for the field independent of `aria-label`
- Textarea `aria-label="Message"` — belt-and-suspenders accessible name on the element itself
- Send button `aria-label="Send message"` — explicit name; does not rely on the SVG icon
- Stop button `aria-label="Stop streaming turn"` — explicit name describing action semantics
- Disabled states use the HTML `disabled` attribute on `<textarea>` and `<button>` — not just visual opacity; prevents focus and interaction without additional ARIA
- `aria-disabled="true"` also set alongside `disabled` on buttons for AT announcement completeness
- Keyboard submit: Cmd/Ctrl+Enter in textarea submits (host component responsibility; documented here for implementer reference)
- Progress-dots container gets `aria-label="Sending…" role="status"` in the `--sending` variant — announces to screen readers without focus theft
- Color contrast: ember send button (`--accent-primary` on `--accent-primary-fg`) and red stop button (`--state-danger-fg` on `--accent-primary-fg`) both meet WCAG AA 4.5:1 within the token system
- Touch targets: `atom-icon-button--md` enforces `var(--touch-target-min)` = 44pt — meets WCAG 2.5.5
