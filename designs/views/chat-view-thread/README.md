# chat-view-thread

## Purpose

The canonical hero view for the Superset mobile chat interface. Renders a live-streaming assistant turn inside an iPhone 16 Pro Max device frame. This is the primary composition reference for UC-RENDER-01 §A — the state a user sees while the assistant is actively streaming a response.

## PRD Wireframe Reference

**UC-RENDER-01 §A** — Canonical streaming chat view

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│                                      │
│         ┌──────────────────────────┐ │
│         │ Can you refactor billing │ │  ← UserMessage right-aligned
│         │ to use tRPC?             │ │     max-w-[85%], bg-secondary
│         │                    9:41  │ │
│         └──────────────────────────┘ │
│                                      │
│ Sure! Here's how I'd approach the    │  ← AssistantMessage left-aligned
│ refactor:                            │     full-width, no bubble bg
│                                      │
│ 1. Move the billing router to…       │
│                                      │
│ The key change is replacing the      │
│ REST calls with tRPC mutations▌      │  ← ▌ blinking cursor (streaming)
│                                      │
├──────────────────────────────────────┤
│ [Sonnet 4.6] [⚡ low] [🔐 default]   │
│ ┌────────────────────────────────┐   │
│ │  (input disabled…)      [ ■ ] │   │  ← Stop visible; turn streaming
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| App header | `mol-app-header` | Back button, "Fix auth bug" title, "superset · main" subtitle, more-vertical action |
| Thread scroll | `<main role="log">` + `.view-chat-view-thread__thread` | Scrollable message list, `aria-live="polite"` |
| Scroll fade top | `atom-scroll-fade --top` | Gradient mask, hidden at scroll-top |
| User message | `mol-user-message-bubble` | Right-aligned bubble, 85% max-width, secondary surface |
| Assistant head | `mol-assistant-message-head --streaming` | Avatar A (accent), "Assistant" label, timestamp, live STREAMING badge |
| Assistant body | `.view-chat-view-thread__body .type-body` | Full-width prose, paragraph + ordered list, inline `<code class="type-code">` |
| Streaming cursor | `atom-streaming-cursor` | Mint block, 1s blink at end of last paragraph |
| Scroll fade bottom | `atom-scroll-fade --bottom` | Gradient mask at bottom of scroll region |
| Composer footer | `.view-chat-view-thread__composer` | Sticky footer, `border-top`, `safe-area-bottom` pad |
| Composer toolbar | `mol-composer-toolbar` | 3 picker-trigger pills: model / thinking / permission |
| Composer row | `mol-composer-row --streaming` | Textarea (disabled), Stop icon-button (destructive pill) |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill, absolute at viewport bottom |

## Composition Table

Every atom and molecule used in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button, more-vertical button |
| `atom-icon-button --destructive --md --pill` | Atom | Stop button in composer |
| `atom-avatar --accent --sm` | Atom | "A" accent circle in assistant head |
| `atom-status-dot --live --sm` | Atom | Pulsing mint dot in STREAMING badge |
| `atom-section-label --inline` | Atom | "STREAMING" uppercase label |
| `atom-streaming-cursor` | Atom | Mint blink at tail of streaming text |
| `atom-scroll-fade --top / --bottom` | Atom | Gradient mask top + bottom of thread |
| `atom-pill --default --md --leading-icon` | Atom | Each composer toolbar picker trigger |
| `atom-textarea --composer` | Atom | Disabled composer input |
| `mol-app-header` | Molecule | Back + title/subtitle + actions header row |
| `mol-user-message-bubble` | Molecule | Right-aligned user message bubble |
| `mol-assistant-message-head` | Molecule | Avatar + label + time + live status |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 triggers |
| `mol-composer-row --streaming` | Molecule | Textarea + stop button row |

**Distinct atom classes composed: 12**
**Distinct molecule classes composed: 5**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block (not inherited from atom/molecule rules):

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--space-half)` | Inline code vertical padding |
| `var(--line-height-normal)` | `p`, `li` line-height in body |
| `var(--surface-page)` | Composer footer background, body background |
| `var(--surface-sunken)` | Inline code background |
| `var(--border-subtle)` | Composer footer top border |
| `var(--accent-primary)` | Inline code text color |
| `var(--radius-subtle)` | Inline code border radius |
| `var(--safe-area-bottom)` | Composer footer bottom padding |
| `var(--state-live-fg)` | STREAMING badge label color (inline style) |
| `var(--font-mono)` | `.crumb` font in preview plate |
| `var(--font-size-meta)` | `.crumb` font size |
| `var(--text-muted)` | `.crumb` color, pane-label color |
| `var(--tracking-mono)` | `.crumb` letter spacing |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Thread live region | `<main role="log" aria-live="polite">` — screen reader announces new messages |
| User message article | `role="article"` + `aria-label="Your message"` |
| Assistant message article | `<article aria-label="Assistant message, streaming">` |
| App header landmark | `<header role="banner">` |
| Back button | `aria-label="Back to sessions"` |
| More-vertical button | `aria-label="Session actions"` |
| Composer footer | `<footer aria-label="Message composer">` |
| Composer toolbar | `role="toolbar" aria-label="Composer options"` |
| Picker triggers | `aria-haspopup="dialog"` + descriptive `aria-label` per trigger |
| Disabled textarea | `disabled` attribute + `aria-label` noting disabled state |
| Stop button | `aria-label="Stop streaming"` |
| Streaming cursor | `aria-hidden="true"` — decorative, not read aloud |
| Status bar / Dynamic Island | `aria-hidden="true"` — purely decorative chrome |
| STREAMING badge dot | `aria-hidden="true"` — parent label conveys the status |

## Layout Choices

- **Viewport flex column**: `atom-device-bezel__viewport` is already `display:flex; flex-direction:column`. The thread `<main>` receives `flex: 1` via the view-local class, collapsing header and footer to their natural sizes.
- **Scroll fade positioning**: The thread `<main>` sets `position: relative` so the `atom-scroll-fade` elements (which are `position: absolute`) anchor inside the scroll container, not the viewport.
- **Composer bottom padding**: Uses `padding-block-end: var(--safe-area-bottom)` so the composer clears the home indicator on real hardware.
- **Streaming state in mol-composer-row**: The `--streaming` modifier from the molecule rules handles `opacity: 0.6` and `pointer-events: none` on the textarea. The view only supplies the `is-disabled` class + `disabled` attribute for semantics.
- **Inline STREAMING label color**: The `atom-section-label` inside `mol-assistant-message-head__status` uses an inline `style="color: var(--state-live-fg);"` because the section-label atom defaults to `var(--text-muted)`. This is the only inline style in the view and resolves exclusively to a token.
