# mol-approval-footer

Sticky footer that docks above the chat composer during a tool-approval pause (UC-PAUSE-01 §A). The composer is suppressed; this footer slides up in its place. Contains three 44pt action buttons and an optional queue counter badge.

## Purpose

Gives the user a thumb-reachable, single-decision surface for approving, declining, or permanently allowing a pending tool action. The top amber rule visually connects this footer to the pending tool-call card visible in the message stream above.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ [amber top rule — full width, position: absolute] │
│ [1 OF 4]  [Decline ──] [── Approve ──] [Always]  │
└──────────────────────────────────────────────────┘
```

> Button order (Decline · Approve · Always) deviates intentionally from the UC-PAUSE-01 §A wireframe (Approve · Decline · Always).
> Rationale: on right-handed devices the right thumb reaches center before the left edge. Placing Approve in the center means one-tap positive action; Decline on the far left requires deliberate reach, reducing accidental declines. Always (category-level permission) is on the trailing right as the least-common, highest-consequence action. See "Wireframe Deviation" section below.

| Part | Element | Class |
|---|---|---|
| Root container | `<footer>` | `mol-approval-footer` |
| Queue variant modifier | — | `mol-approval-footer--queued` |
| Amber top rule | `<span>` | `mol-approval-footer__rule` → `atom-tool-status-rule --horizontal --pending` |
| Queue counter badge | `<span>` | `mol-approval-footer__counter` → `atom-badge --neutral --md` |
| Action row | `<div>` | `mol-approval-footer__actions` |
| Decline button | `<button>` | `atom-button --destructive --md` |
| Approve button | `<button>` | `atom-button --primary --md` |
| Always-allow button | `<button>` | `atom-button --ghost --md` |

## Variants

| Class modifier | Counter visible | Usage |
|---|---|---|
| `mol-approval-footer--single` (default) | Hidden (`display: none`) | Exactly one pending approval |
| `mol-approval-footer--queued` | Shown ("1 OF N") | Multiple approvals queued |

## States

| Class | Behaviour |
|---|---|
| default | All buttons interactive |
| `is-resolving` | `mol-approval-footer__actions` gets `opacity: 0.5; pointer-events: none`; footer root gets `aria-busy="true"`; one button shows `is-loading` spinner (typically Approve or Decline depending on which was tapped) |
| `is-disabled` | Entire footer disabled — actions `opacity: 0.5; pointer-events: none` without spinner |

## Wireframe Deviation

UC-PAUSE-01 §A wireframe order: **Approve · Decline · Always**

Shipped order: **Decline · Approve · Always**

Justification: WCAG 2.5.8 and iOS HIG both recommend placing primary actions within the natural thumb reach zone. On a 430px-wide viewport, the center third (roughly 143–287px from left) is the one-handed comfort zone. Destructive actions (Decline) benefit from being in the outer zone to require intentional reach — reducing accidental taps. The Always action is right-edge as the highest-consequence, least-frequent choice.

## Atoms Used

| Atom | Class(es) applied | Role |
|---|---|---|
| `atom-tool-status-rule` | `--horizontal --pending` | Top amber accent rule (3px, glow) |
| `atom-badge` | `--neutral --md` | "1 OF N" queue counter |
| `atom-button` | `--destructive --md` | Decline action |
| `atom-button` | `--primary --md` | Approve action (ember brand) |
| `atom-button` | `--ghost --md` | Always-allow action (subtle) |

Total atoms composed: **5 classes across 4 atom types**

## Token Recipe

| Property | Token | Notes |
|---|---|---|
| Footer background | `--surface-page` | flush with page to suppress any visual gap |
| Footer top border | `--border-subtle` | 1px hairline separator from chat content |
| Footer padding-block | `var(--space-3)` top, `var(--safe-area-bottom)` bottom | safe-area-bottom accommodates home indicator |
| Footer padding-inline | `var(--space-4)` | horizontal inset |
| Button min-height | `--touch-target-min` | 44px WCAG AA + iOS HIG |
| Button flex gap | `var(--space-2)` | between buttons |
| Counter gap | `var(--space-3)` | between counter and action row |
| Rule position | `top: 0; left: 0; right: 0` (absolute) | bleeds rule to footer top edge |
| Resolving opacity | `0.5` | standard disabled opacity scale |

## TOKEN_GAPs

None. All values use the token scale. The `top: 0; left: 0; right: 0` absolute positioning for the rule is structural geometry (full-bleed top edge), not a magic value.

## Accessibility

- Root `<footer>` element carries `role="region"` and `aria-label="Approval actions for tool: [tool-name]"` so screen readers can navigate directly to this landmark.
- Each button has an explicit `aria-label` that redundantly identifies its action (`aria-label="Decline approval"`, `aria-label="Approve tool action"`, `aria-label="Always allow [category] category"`).
- When `is-resolving`, the footer root gains `aria-busy="true"` so screen readers announce the processing state.
- The counter badge carries `aria-label="Approval 1 of 4"` (full text) even though the visual label uses abbreviated "1 OF 4", ensuring screen reader users hear the full context.
- The top amber rule `<span>` carries `aria-hidden="true"` — it is decorative; the pending state is conveyed by footer label text.
- The `is-resolving` spinner inside a button inherits the button's `is-loading` class which sets `color: transparent` on text and renders the spinner via `::after` — the button's `aria-label` text remains readable to assistive technology.
- All buttons meet `--touch-target-min` (44px) per WCAG 2.5.8 / iOS HIG.
- No action is color-only: Decline uses red background + text label + `aria-label`; Approve uses ember background + text label + `aria-label`.
