# mol-assistant-message-head

## Purpose

The header row for an assistant message. Renders the assistant avatar, "Assistant" label, timestamp, and an optional live-state status segment (streaming/thinking/paused/completed). This molecule is the **head only** — the message body (markdown prose, code blocks) and the streaming-cursor at the end of body text are handled by the parent organism.

Used in UC-RENDER-01: assistant messages are left-aligned, full-width, no bubble. The head sits directly above the body text with `margin-bottom: var(--space-2)`.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ [A]  ASSISTANT  ·  12:43 PM  ·  ●  STREAMING                        │
└──────────────────────────────────────────────────────────────────────┘
   ↑         ↑        ↑              ↑
   avatar  label    time           status segment (optional)
```

| Slot | Element | Atom(s) |
|------|---------|---------|
| Avatar | `span.atom-avatar.atom-avatar--accent.atom-avatar--sm` | `atom-avatar` |
| Label | `span.atom-section-label.atom-section-label--strong` | `atom-section-label` |
| Separator · | `span[aria-hidden]` w/ `atom-section-label--faint` | `atom-section-label` |
| Timestamp | `span.atom-section-label.atom-section-label--muted` | `atom-section-label` |
| Status separator · | `span[aria-hidden]` w/ `atom-section-label--faint` | `atom-section-label` |
| Status dot | `span.atom-status-dot.atom-status-dot--live.atom-status-dot--xs` | `atom-status-dot` |
| Status text | `span.atom-section-label.atom-section-label--muted` | `atom-section-label` |
| Live a11y region | `span[role="status"][aria-live="polite"]` wrapping status segment | — |

---

## Variants

| BEM modifier | Status dot variant | Status text | Use case |
|---|---|---|---|
| `--idle` (default) | none — status hidden | — | Historical message, no active state |
| `--streaming` | `atom-status-dot--live` (pulse) | "STREAMING" | Mid-turn, tokens arriving |
| `--thinking` | `atom-status-dot--warning` | "THINKING" | Internal reasoning / tool call |
| `--paused` | `atom-status-dot--warning` | "PAUSED" | Awaiting user approval |
| `--completed` | `atom-status-dot--success` (faint — opacity 0.5) | "COMPLETED · 3.2s" | Turn just finished; fades after 1.5s in production |

### Class-level control of status segment

```css
.mol-assistant-message-head--idle .mol-assistant-message-head__status {
  display: none;
}
```

All other variants keep `__status` visible via the base `display: inline-flex`.

---

## States

Only `default`. No hover, active, or focus states — the head row is not interactive. (The body organism may add long-press affordance at message level.)

---

## Atoms used

| Atom | Import | Modifier classes used |
|---|---|---|
| `atom-avatar` | `_atoms.css` | `--accent`, `--sm` |
| `atom-section-label` | `_atoms.css` | `--strong`, `--muted` (default), `--faint` |
| `atom-status-dot` | `_atoms.css` | `--live`, `--warning`, `--success`, `--xs` |

`atom-streaming-cursor` is **not** used in this molecule — it appears at the end of body text, not in the head.

---

## Token recipe

| Property | Token | Resolved (dark) | Resolved (light) |
|---|---|---|---|
| Avatar background | `--accent-primary` | ember tone | ember tone |
| Avatar foreground | `--accent-primary-fg` | white | white |
| Avatar size | 28×28 (structural) | — | — |
| Label color | `--text-body` | `#eae8e6` | `oklch(0.145 0 0)` |
| Timestamp/status text color | `--text-muted` | `#a8a5a3` | `oklch(0.556 0 0)` |
| Separator color | `--text-faint` | dimmer than muted | dimmer than muted |
| Status dot (streaming) | `--state-live-dot` | mint `#50a878` | mint |
| Status dot (thinking/paused) | `--state-warning-dot` | amber `#d4a84b` | amber |
| Status dot (completed) | `--state-success-dot` | green `#50a878` | green |
| Row gap | `--space-2` | 8px | 8px |
| Status sub-gap | `--space-1` | 4px | 4px |
| Bottom margin (head→body) | `--space-2` | 8px | 8px |

TOKEN_GAPs:
- `max-width: 85%` on bubble (lives on user-message-bubble, not here — not a gap for this molecule)
- Completed-state fade duration (1.5s) — production JS concern, not a CSS token; documented here for implementers

---

## Accessibility

- The `<header>` element is semantic and belongs **inside** the parent `<article role="article" aria-label="Assistant message, sent 12:43 PM">` at the organism layer.
- The head content itself (avatar, label, timestamp) is all readable by screen readers in DOM order.
- Separators `·` use `aria-hidden="true"` — they are purely decorative punctuation.
- The **status segment** wraps in `<span role="status" aria-live="polite">` so state transitions (idle→streaming→completed) are announced without user focus.
- The avatar `<span>` for "A" uses `aria-hidden="true"` because the parent article's `aria-label` already identifies the speaker. If used standalone without a wrapping article, add `role="img" aria-label="Assistant"` to the avatar.
- `prefers-reduced-motion`: the `atom-status-dot--live` pulse stops per atom rules; the completed-state fade-out should be skipped in production (`transition: none`).
