# mol-pending-approval-card

Inline pending-approval card that renders in the message stream at the position the desktop `PendingApprovalMessage` would appear. Represents a tool call paused for user approval (UC-PAUSE-01 §A). Always paired with the sticky `approval-footer` molecule which carries the Approve / Decline / Always Allow buttons.

## Purpose

Communicates "the agent is paused and waiting for you" at a glance. Semantic distinction from `tool-call-card`: this card has no navigation target, no chevron, and is always in the pending state. The amber left rule + ⌖ target icon encode "action required" without relying on color alone.

## Anatomy

```
┌─[amber rule]────────────────────────────────────┐
│ [⌖ icon]  Tool approval required   [ALLOWABLE?] │
│           bash · run_tests.sh                    │
│ ─────────────────────────────────────────────── │
│ $ bun test --filter billing                      │
└─────────────────────────────────────────────────┘
```

| Part | Element | Class |
|---|---|---|
| Left status rule | `<span>` | `mol-pending-approval-card__rule` → `atom-tool-status-rule --vertical --pending` |
| Content wrapper | `<div>` | `mol-pending-approval-card__content` |
| Header row | `<header>` | `mol-pending-approval-card__head` |
| Leading icon | `<svg>` | `mol-pending-approval-card__icon` → `atom-icon-glyph --sm` (warning-colored via molecule modifier) |
| Title | `<span>` | `mol-pending-approval-card__title type-body` |
| Allowable badge (variant only) | `<span>` | `mol-pending-approval-card__allowable-badge atom-badge atom-badge--warning` |
| Subtitle | `<p>` | `mol-pending-approval-card__subtitle type-meta` |
| Divider | `<hr>` | `mol-pending-approval-card__divider atom-divider atom-divider--hairline` |
| Args preview | `<pre>` | `mol-pending-approval-card__args type-code` |

## Variants

| Class modifier | Effect |
|---|---|
| `mol-pending-approval-card--default` | Standard appearance — title + subtitle + args |
| `mol-pending-approval-card--always-allowable` | Adds "ALLOWABLE" badge in the header (tool supports always-allow category) |
| `mol-pending-approval-card--detailed` | Args area scrollable up to 120px tall (multi-line preview) |

## States

| Class | Behaviour |
|---|---|
| default | Pending — amber rule + glow |
| `is-resolving` | Optimistic-tap dimming; opacity 0.5 on the full card while footer buttons show "Approving…" |
| `is-approved` | Rule transitions to `--done` (green); title updates to "Tool approved"; card semantically equivalent to a resolved ToolCallBlock |
| `is-declined` | Rule transitions to `--error` (red); title updates to "Tool declined" |

## Atoms Used

| Atom | Class(es) applied | Role |
|---|---|---|
| `atom-tool-status-rule` | `--vertical --pending` (default/resolving), `--done` (approved), `--error` (declined) | 3px colored left accent |
| `atom-icon-glyph` | `--sm` + warning/success/danger color via state modifier | Leading ⌖ / check / ✕ icon |
| `atom-divider` | `--hairline` (as `<hr>`) | Hairline between header area and args preview |
| `atom-badge` | `--warning` (always-allowable variant only) | "ALLOWABLE" category hint |

## Token Recipe

| Property | Token | Notes |
|---|---|---|
| Card background | `--surface-raised` | elevated card base |
| Card border | `--border-subtle` | 1px hairline |
| Card radius | `--radius-default` | ~8px |
| Pending rule color | `--state-warning-fg` | amber, via atom-tool-status-rule--pending |
| Pending rule glow | `box-shadow: 0 0 4px var(--state-warning-fg)` | via atom; molecule does not re-declare |
| Approved rule color | `--state-success-fg` | green, via atom-tool-status-rule--done |
| Declined rule color | `--state-danger-fg` | red, via atom-tool-status-rule--error |
| Icon color (pending) | `--state-warning-fg` | set by molecule modifier (atom has no --warning color mod) |
| Icon color (approved) | `--state-success-fg` | set by molecule modifier |
| Icon color (declined) | `--state-danger-fg` | set by molecule modifier |
| Title color | `--text-body` | via `.type-body` |
| Subtitle color | `--text-muted` | via `.type-meta` + local override |
| Args background | `--surface-sunken` | inset code area |
| Args text | `--text-muted` | secondary emphasis |
| Args font | `--font-mono` (via `type-code`) | monospaced arg preview |
| Is-resolving opacity | `0.5` | TOKEN_GAP: no `--opacity-resolving` token |
| Padding inline | `var(--space-4)` | horizontal card padding |
| Padding block | `var(--space-3)` | vertical card padding |
| Gap (rule → content) | `var(--space-3)` | horizontal gap after rule |
| Header gap | `var(--space-2)` | between icon / title / badge |
| Content stack gap | `var(--space-2)` | between header, subtitle, divider, args |
| Args padding | `var(--space-2) var(--space-3)` | inside code block |
| Args radius | `--radius-subtle` | code area corners |
| Rule pull | `calc(-1 * var(--space-4))` | bleeds rule flush to card left edge |

## TOKEN_GAPs

| Gap | Location | Notes |
|---|---|---|
| `opacity: 0.5` for `is-resolving` | `.mol-pending-approval-card.is-resolving` | No `--opacity-resolving` token. Documented structural exception. |

## Accessibility

- Root element is `<article role="status" aria-live="polite" aria-label="Tool approval required: bash · run_tests.sh">`.
- `role="status"` with `aria-live="polite"` is correct: the pause is expected, not an interruption. Do **not** use `role="alert"` (`aria-live="assertive"`).
- When the card resolves (approved or declined), **swap the live region's content** (`aria-label` + inner text) rather than removing the element. This keeps the announcement in the AT reading queue.
- The 3px left rule is `aria-hidden="true"` (decorative).
- The leading icon is `aria-hidden="true"` (semantic conveyed by title text).
- State is conveyed redundantly: title text + rule color + icon shape. Color is never the sole channel.
- The card meets `--touch-target-min` (44px) minimum height per WCAG 2.5.8 / iOS HIG.
- The args `<pre>` is a passive element; do not add `role="region"` or `tabindex` unless the content is a significant scrollable region (only the `--detailed` variant with `overflow-y: auto` warrants `tabindex="0"` on the pre).
