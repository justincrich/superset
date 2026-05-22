# pause-ask-user-sheet

## Purpose

Renders the `ask_user` pause state for the Superset mobile chat interface. When the assistant needs input before proceeding, it pauses execution and surfaces a bottom sheet over the dimmed chat view. The sheet contains a question, tappable suggested-answer pills in a horizontal-scroll row, a free-text textarea, and a Send button. The OS keyboard panel is raised at viewport bottom.

## PRD Wireframe Reference

**UC-PAUSE-02 §A** — ask_user bottom sheet with question + pills + keyboard

```
┌──────────────────────────────────────┐
│  [dimmed chat view]                  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                ────              │ │  ← drag handle
│ │ Which approach should I use?     │ │  ← question text
│ │                                  │ │
│ │ ┌──────┐ ┌───────────┐ ┌──────┐ │ │  ← suggested-answer pills
│ │ │ tRPC │ │ REST API  │ │ Both │ │ │     horizontal scroll
│ │ └──────┘ └───────────┘ └──────┘ │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │  Type your answer…           │ │ │  ← BottomSheetTextInput
│ │ └──────────────────────────────┘ │ │
│ │                     ┌──────────┐ │ │
│ │                     │  Send ▶  │ │ │
│ │                     └──────────┘ │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │  [keyboard]                      │ │  ← keyboard panel raised
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| Content area | `atom-device-bezel__content` | flex:1, position:relative — anchors the absolute sheet overlay |
| Dimmed chat | `.view-pause-ask-user-sheet__chat-behind` | Chat stub (user bubble + assistant head + body excerpt), aria-hidden |
| Scrim backdrop | `atom-backdrop --scrim` | 0.55 opacity black scrim, position:absolute within chat-behind |
| User message stub | `mol-user-message-bubble` | Right-aligned bubble, aria-hidden — context-only decoration |
| Assistant head stub | `mol-assistant-message-head --idle` | Avatar A (accent), label, timestamp — aria-hidden |
| Assistant body stub | `.view-pause-ask-user-sheet__assistant-body .type-body` | Truncated prose — aria-hidden |
| Sheet overlay | `.view-pause-ask-user-sheet__overlay` | `position:absolute; bottom:0` — contains sheet card + keyboard stub |
| Sheet card | `.view-pause-ask-user-sheet__sheet` | `--surface-overlay` bg, `--radius-xl` top corners, `--elevation-sheet` shadow |
| Drag handle | `atom-home-indicator --sheet-handle --muted` | `--text-faint` pill, centered at sheet top via handle-row |
| Question text | `<h2 class="type-title">` | "Which approach should I use?" |
| Pill row | `view-pause-ask-user-sheet__pill-row-wrap` + pill-row | Horizontal-scroll `<ul>`, right-edge fade gradient over `--surface-overlay` |
| tRPC pill | `mol-suggested-answer-pill --accent` | Accent variant = recommended option |
| REST API pill | `mol-suggested-answer-pill --default` | Default variant = standard option |
| Both pill | `mol-suggested-answer-pill --ghost` | Ghost variant = less-prominent option |
| Textarea | `atom-textarea --inset` | Placeholder "Type your answer…", `rows="2"` |
| Send button | `atom-button --primary --md` + pill border-radius | Right-aligned, paper-plane glyph |
| Keyboard stub | `.view-pause-ask-user-sheet__keyboard` | 290px gray panel, textured grid stand-in — **preview only** |

## Composition Table

Every atom and molecule composed in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__content` | Atom sub-element | flex:1 content region, relative for overlay |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-backdrop --scrim` | Atom | 0.55 opacity scrim over dimmed chat |
| `atom-home-indicator --sheet-handle --muted` | Atom | Drag handle indicator at sheet top |
| `atom-textarea --inset` | Atom | BottomSheetTextInput |
| `atom-button --primary --md` | Atom | Send button (pill border-radius via token inline style) |
| `atom-avatar --accent --sm` | Atom | "A" avatar in chat stub assistant head |
| `mol-user-message-bubble` | Molecule | User message bubble in dimmed chat stub |
| `mol-assistant-message-head --idle` | Molecule | Assistant head row in dimmed chat stub |
| `mol-suggested-answer-pill --accent` | Molecule | "tRPC" — recommended pill |
| `mol-suggested-answer-pill --default` | Molecule | "REST API" — standard pill |
| `mol-suggested-answer-pill --ghost` | Molecule | "Both" — ghost pill |

**Distinct atom classes composed: 8**
**Distinct molecule classes composed: 5**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--surface-overlay)` | Sheet card background; pill row right-edge fade gradient |
| `var(--surface-soft)` | Keyboard stub panel background |
| `var(--surface-sunken)` | Preview plate pane-label background |
| `var(--border-subtle)` | Pane border, preview-plate border, keyboard grid texture |
| `var(--radius-xl)` | Sheet top-left and top-right border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--radius-default)` | Pane border-radius |
| `var(--radius-pill)` | Send button border-radius (inline style on `atom-button`) |
| `var(--elevation-sheet)` | Sheet card box-shadow |
| `var(--line-height-normal)` | Assistant body stub paragraph line-height |
| `var(--text-body)` | Assistant body text color |
| `var(--text-faint)` | Keyboard stub label text |
| `var(--text-muted)` | Pane-label color, preview crumb |
| `var(--font-mono)` | `.crumb` and keyboard label font |
| `var(--font-size-meta)` | `.crumb` and keyboard label size |
| `var(--tracking-mono)` | `.crumb` and keyboard label tracking |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Sheet dialog | `role="dialog" aria-modal="true" aria-label="Agent question"` |
| Pill list | `<ul role="list" aria-label="Suggested answers">` |
| Suggested-answer pills | `aria-label="Use suggested answer: <text>"` on each `<button>` |
| Textarea | `aria-label="Type your answer"` |
| Send button | `aria-label="Send answer"` |
| Chat stub / scrim | `aria-hidden="true"` — decorative background, not part of dialog interaction |
| User message stub | `role="presentation"` + `tabindex="-1"` — inert backdrop decoration |
| Dynamic Island / status bar / home indicator | `aria-hidden="true"` — hardware chrome |
| Keyboard stub | `aria-hidden="true" role="presentation"` — preview stand-in |
| Paper-plane SVG | `aria-hidden="true"` — decorative icon inside labeled button |

## Layout Choices

- **Overlay positioning**: The sheet overlay uses `position: absolute; bottom: 0` anchored inside `atom-device-bezel__content` (which provides `position: relative`). This means the sheet stacks correctly inside the device frame without leaking outside the viewport boundary.
- **Scrim in chat-behind**: The `atom-backdrop --scrim` is `position: absolute` inside `.view-pause-ask-user-sheet__chat-behind`, which is itself a flex child. This scopes the scrim to the chat stub region without overflowing the whole viewport.
- **Pill row gradient fade**: The `::after` pseudo-element on `pill-row-wrap` fades the right edge to `--surface-overlay` (the sheet's own background) to hint at overflow-scroll content without a visible scrollbar.
- **Send button pill radius**: The `atom-button --primary --md` already provides all button styling. The sole inline style `border-radius: var(--radius-pill)` is the only override — it resolves entirely to a token and transforms the default button shape to pill form as specified.
- **Keyboard stub**: The `.view-pause-ask-user-sheet__keyboard` element is a 290px structural stand-in for the OS keyboard. It uses a CSS `::before` grid texture and `::after` label to communicate its preview status. Flagged for replacement with a real `KeyboardAvoidingView` / `BottomSheetTextInput` keyboard offset in the native implementation.

## Known Preview Stand-ins

- **Keyboard panel**: The 290px gray-textured panel is a structural geometry stand-in only. It accurately represents iOS keyboard height on iPhone 16 Pro Max but does not render real key glyphs. The native implementation will use `BottomSheetTextInput` from `@gorhom/bottom-sheet` which handles keyboard avoidance automatically.
