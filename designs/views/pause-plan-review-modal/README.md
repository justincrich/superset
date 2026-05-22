# pause-plan-review-modal

## Purpose

Full-screen plan review modal for the Superset mobile pause flow. Displayed when the agent pauses for plan approval — pushed as an Expo Router modal route that owns the entire iPhone viewport. The user can read the plan, optionally add feedback, then Approve or Reject.

This view represents the state from **UC-PAUSE-03 §A** — the moment the user sees the generated plan before deciding whether to resume or redirect the agent.

## PRD Wireframe Reference

**UC-PAUSE-03 §A** — Full-screen plan review modal

```
┌──────────────────────────────────────┐
│  ✕   Review Plan                     │
├──────────────────────────────────────┤
│                                      │
│  ## Billing Refactor Plan            │
│                                      │
│  ### Phase 1: Extract router         │
│  Move `billing.ts` to a dedicated    │
│  tRPC router file under              │
│  `packages/trpc/src/routers/`.       │
│                                      │
│  ### Phase 2: Add procedures         │
│  Define `getInvoice`, `listInvoices` │
│  …                                   │
│  [scrollable — plan continues]       │
│                                      │
├──────────────────────────────────────┤
│  ▼ Add feedback (optional)           │
│  ┌──────────────────────────────┐    │
│  │  (empty — feedback hidden)   │    │
│  └──────────────────────────────┘    │
├──────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────┐ │
│  │    Reject       │ │   Approve   │ │
│  └─────────────────┘ └─────────────┘ │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962) |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery |
| Modal header | `mol-modal-header` | ✕ close button (left), "Review Plan" title (centered), spacer (right) |
| Scrollable body | `<main> + .view-pause-plan-review-modal__body` | `flex: 1; overflow-y: auto` — plan markdown content |
| Scroll fade top | `atom-scroll-fade --top` | Gradient mask, `is-hidden` at scroll-top |
| Plan headings | `.view-pause-plan-review-modal__plan-h2 / __plan-h3` + `type-h2 / type-title` | Section titles using typography modules |
| Plan paragraphs | `.view-pause-plan-review-modal__plan-p` + `type-body` | Body copy with inline `<code class="type-code">` |
| Scroll hint | `.view-pause-plan-review-modal__scroll-hint` | Sunken container with chevron + meta text indicating scroll continuation |
| Scroll fade bottom | `atom-scroll-fade --bottom` | Gradient mask at scroll bottom |
| Feedback section | `.view-pause-plan-review-modal__feedback-section` | `border-top` divider wrapper |
| Feedback toggle | `<details class="mol-collapsed-block">` | Native `<details>` closed by default; "▼ Add feedback (optional)" summary using `mol-collapsed-block__summary` |
| Feedback input | `atom-text-input --default --md` inside `atom-text-input-field` | Revealed when `<details>` is open |
| Docked footer | `.view-pause-plan-review-modal__footer` | `flex-shrink: 0`, `padding-block-end` includes `safe-area-bottom` |
| Reject button | `atom-button --destructive --md is-disabled` | Disabled (`disabled` + `aria-disabled="true"`) while feedback is empty |
| Approve button | `atom-button --primary --md` | Enabled at all times |
| Reject hint | `.view-pause-plan-review-modal__reject-hint type-meta` | "Enter feedback to enable Reject" — `aria-live="polite"` |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill |

## Composition Table

Every atom and molecule used in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | ✕ close button in modal header |
| `atom-scroll-fade --top / --bottom` | Atom | Gradient mask top + bottom of scroll region |
| `atom-icon-glyph --sm --muted` | Atom | Chevron in scroll-hint and feedback summary |
| `atom-text-input --default --md` | Atom | Feedback text input (inside open `<details>`) |
| `atom-text-input-field` | Atom container | Label + input + helper text wrapper |
| `atom-button --destructive --md` | Atom | Reject button (disabled state) |
| `atom-button --primary --md` | Atom | Approve button |
| `mol-modal-header` | Molecule | ✕ close + "Review Plan" title + spacer |
| `mol-collapsed-block` | Molecule | Expandable feedback `<details>` section |

**Distinct atom classes composed: 10**
**Distinct molecule classes composed: 2**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--space-2)`, `var(--space-3)`, `var(--space-4)`, `var(--space-5)` | Section padding, gap values |
| `var(--line-height-snug)` | Heading line-height |
| `var(--line-height-normal)` | Body paragraph line-height |
| `var(--surface-page)` | Modal background, feedback body background |
| `var(--surface-sunken)` | Scroll hint background |
| `var(--surface-overlay)` | Footer docked background |
| `var(--border-subtle)` | Divider borders (feedback section, footer) |
| `var(--radius-default)` | Scroll hint border-radius |
| `var(--safe-area-bottom)` | Footer bottom padding clearance |
| `var(--text-faint)` | Reject hint text color |
| `var(--font-mono)` | Preview plate `.crumb` font |
| `var(--font-size-meta)` | Preview plate `.crumb` size |
| `var(--text-muted)` | Preview plate `.crumb` and `pane-label` color |
| `var(--tracking-mono)` | Preview plate `.crumb` letter spacing |

## Reject Button Disabled State

The Reject button starts in `is-disabled` state with `disabled` + `aria-disabled="true"` attributes, reflecting that no feedback has been entered (per the wireframe: "Reject disabled until feedback non-empty"). A helper text `"Enter feedback to enable Reject"` is rendered below the button row with `aria-live="polite"` so screen readers announce the constraint.

In the production React Native implementation, the Reject button transitions from disabled to enabled when the feedback `<TextInput>` contains at least one non-whitespace character.

## Feedback Section — Default State

The `<details class="mol-collapsed-block">` renders closed by default (no `open` attribute), matching the wireframe annotation "default: closed — (empty — feedback hidden)". The `mol-collapsed-block__summary` chevron icon rotates 180° via the molecule's built-in `[open] .mol-collapsed-block__chevron { transform: rotate(180deg) }` rule when the user taps to expand.

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Modal dialog role | `role="dialog" aria-modal="true" aria-labelledby` on root |
| Modal title association | `aria-labelledby` points to `<h1 id="plan-review-title-*">` |
| Close button | `aria-label="Close plan review"` |
| Plan body scroll | `<main>` with `tabindex="0"` for keyboard scroll access |
| Plan heading hierarchy | `<h2>` plan title → `<h3>` phase titles — valid document outline |
| Inline code | `<code class="type-code">` — semantic code element |
| Feedback details | Native `<details>/<summary>` — screen-reader expandable disclosure |
| Feedback input | `<label for>` association + `aria-label` on input |
| Reject disabled state | `disabled` attribute + `aria-disabled="true"` + descriptive `aria-label` |
| Reject hint | `aria-live="polite"` — announced when constraint changes |
| Scroll fade / Dynamic Island / status bar / home indicator | `aria-hidden="true"` — decorative |
| Scroll hint | `aria-label="Plan continues below"` |

## Layout Choices

- **Full-screen ownership**: `.view-pause-plan-review-modal` is `display: flex; flex-direction: column; height: 100%` filling `atom-device-bezel__viewport`, with no chat-view chrome or bottom-tab-bar behind it. This matches the Expo Router modal-route model where the presented screen owns the entire viewport.
- **Flex distribution**: `mol-modal-header` (sticky, `flex-shrink: 0`) → scrollable `<main>` (`flex: 1`) → feedback `<details>` section (`flex-shrink: 0`) → docked `<footer>` (`flex-shrink: 0`). The plan body expands to fill all remaining space, pushing the footer to the bottom.
- **Safe-area footer pad**: `padding-block-end: calc(var(--space-3) + var(--safe-area-bottom))` ensures the footer clears the home indicator bar on real hardware.
- **mol-collapsed-block for feedback**: The `<details>` element reuses the existing `mol-collapsed-block` molecule (already in the bundle) to get the animated chevron and `summary` hover styles without writing new CSS. The only view-local rule needed is the padding for the revealed input body.
- **Scroll continuation hint**: A sunken-surface container with a chevron and `type-meta` text communicates to the user that the plan continues below the fold. It avoids any truncation of real plan content.
- **Equal-width button pair**: Both Reject and Approve receive `flex: 1` via the footer-row rule, giving them equal width and 44pt minimum height from `atom-button--md` (`height: var(--touch-target-min)`).
