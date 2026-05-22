# mol-user-message-bubble

The user's outgoing message in a chat thread. Right-aligned bubble with a styled surface background. Long-press triggers the copy/share context menu. Composes atoms for timestamp and touch affordance; no atom styles are redefined.

---

## Purpose

- Renders a single outgoing message from the user in the chat scroll
- Right-alignment encodes identity — no avatar needed in the default mobile layout
- Supports long-press copy/share via `atom-hit-target-wrapper` semantics (`aria-haspopup="menu"`)
- Three visual tones: neutral default, ember accent for @mentions, translucent pending for optimistic-append
- `is-failed` state surfaces a send error with inline retry affordance

---

## Anatomy

```html
<article
  class="mol-user-message-bubble mol-user-message-bubble--default"
  aria-label="Your message: The relay tunnel is reconnecting on every Wi-Fi flap."
>
  <!-- Bubble: tappable wrapper with message text -->
  <button
    class="mol-user-message-bubble__bubble atom-hit-target-wrapper"
    aria-haspopup="menu"
    aria-label="Long-press to copy or share"
  >
    <p class="mol-user-message-bubble__text type-body">
      The relay tunnel is reconnecting on every Wi-Fi flap.
      Can you find where we set the backoff and increase it?
    </p>
  </button>

  <!-- Meta: timestamp -->
  <footer class="mol-user-message-bubble__meta">
    <span class="atom-section-label atom-section-label--faint">12:42 PM</span>
  </footer>
</article>
```

**Failed state** — append inside `<footer>`:
```html
<footer class="mol-user-message-bubble__meta mol-user-message-bubble__meta--failed">
  <span class="atom-section-label atom-section-label--faint">Failed to send</span>
  <button class="mol-user-message-bubble__retry atom-button atom-button--link atom-button--sm">
    Retry
  </button>
</footer>
```

> The `<article>` carries the semantic label for screen readers (`aria-label="Your message: ..."`). The inner `<button>` on the bubble surface carries `aria-haspopup="menu"` to signal the long-press action menu. The text `<p>` is decorative relative to the article label.

---

## Variants

| Class modifier | Bubble background | Use case |
|---|---|---|
| `mol-user-message-bubble--default` | `var(--surface-soft)` | Standard sent message |
| `mol-user-message-bubble--accent` | `var(--accent-primary-subtle)` | Message contains @mention — ember tint |
| `mol-user-message-bubble--pending` | `var(--surface-soft)` at 0.6 opacity | Optimistic-append while server confirms |

---

## States

| Class / Condition | Visual effect |
|---|---|
| `default` | Bubble on `--surface-soft`; meta timestamp faint mono |
| `is-long-press` | Bubble scales to 1.02 + `var(--elevation-raised)` shadow |
| `is-failed` | 3px left border `var(--state-danger-fg)` on bubble; footer shows "Failed to send · Retry" |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-section-label` | `--faint` | Timestamp ("12:42 PM", "9m") below the bubble |
| `atom-hit-target-wrapper` | wraps bubble `<button>` | Guarantees 44px min tap zone for long-press gesture |
| `atom-button` | `--link --sm` | "Retry" action in `is-failed` footer |
| `atom-avatar` | `--initial --sm` (optional, rarely shown) | User identity when context requires explicit attribution |

> `atom-avatar` is listed but omitted from the default rendering. Right-alignment is the primary identity signal on mobile. The avatar slot activates only in edge cases (e.g., quoted messages, multi-user threads).

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `background` default | `var(--surface-soft)` | |
| `background` accent | `var(--accent-primary-subtle)` | |
| `opacity` pending | `0.6` | Raw float — sub-token, structural geometry |
| `padding` bubble | `var(--space-3) var(--space-4)` | 12px block, 16px inline |
| `border-radius` bubble | `var(--radius-xl)` | All corners |
| `border-top-right-radius` bubble | `var(--radius-default)` | Tighter top-right = "sender tail" convention |
| `max-width` bubble | `85%` | Raw percentage — structural layout constraint, not a color/spacing token |
| `gap` (article column) | `var(--space-1)` | 4px between bubble and meta row |
| `padding-inline-end` meta | `var(--space-2)` | Aligns timestamp inward from bubble edge |
| `color` text | `var(--text-body)` | Inherited from `type-body` |
| `border-left` failed | `var(--domain-tool-rule-width) solid var(--state-danger-fg)` | Matches tool-status-rule convention |
| `box-shadow` long-press | `var(--elevation-raised)` | |
| `transform` long-press | `scale(1.02)` | Raw float — structural micro-interaction |
| `transition` | `all var(--motion-fast) var(--motion-ease-out)` | |
| `word-wrap` | `break-word` | Prevents layout overflow on long unspaced strings |

**TOKEN_GAP**: `max-width: 85%` and `opacity: 0.6` are raw structural values below the token scale. `85%` encodes the chat bubble width convention (matching the visual reference screen); `0.6` is the standard optimistic-pending opacity used across the system.

---

## Accessibility

- `<article aria-label="Your message: {text}">` announces both authorship and content in a single label. Screen readers read "Your message:" prefix so the listener knows the message direction without visual layout cues.
- The bubble `<button>` carries `aria-haspopup="menu"` — signals that long-press opens an action menu. The menu itself is rendered and managed by the parent organism.
- `is-failed` state: the "Retry" button is a focusable `<button>` with visible label. The red border is a visual-only signal; the meta text "Failed to send" provides the text alternative.
- `atom-section-label` timestamp is `aria-hidden="false"` (default) — announced as supplemental information after the message text via natural DOM order.
- Reduced-motion: `transform` and `transition` on `is-long-press` are wrapped in `@media (prefers-reduced-motion: reduce)` — scale removed, only shadow persists.
