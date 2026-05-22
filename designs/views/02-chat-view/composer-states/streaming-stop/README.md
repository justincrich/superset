# composer · streaming-stop

**PRD UC reference:** UC-COMP-03 §A

## Description

The streaming-stop state is active for the entire duration of an in-progress assistant turn. As soon as the user's message is dispatched and the backend begins emitting tokens, the composer locks: the textarea is disabled (`disabled` attribute + `is-disabled` class) and its placeholder text changes to communicate that input is blocked while the turn streams. The Send button is removed entirely and replaced by a destructive Stop button (`atom-icon-button--destructive`), giving the user a single affordance to interrupt the current response. The toolbar pills remain visible but are visually quieted by the streaming context. In the thread above, the assistant message head carries the `mol-assistant-message-head--streaming` modifier, a live status dot (`atom-status-dot--live`), and an animated streaming cursor (`atom-streaming-cursor`) at the end of the partial response text.

## Composition table

| Layer | Class(es) | Role |
|-------|-----------|------|
| Atom | `atom-device-bezel` / `atom-device-bezel__viewport` | iPhone frame shell |
| Atom | `atom-icon-button atom-icon-button--destructive atom-icon-button--md atom-icon-button--pill` | Stop streaming button |
| Atom | `atom-textarea atom-textarea--composer is-disabled` | Disabled message input |
| Atom | `atom-pill atom-pill--default atom-pill--md atom-pill--leading-icon` | Toolbar control pills |
| Atom | `atom-avatar atom-avatar--accent atom-avatar--sm` | Assistant avatar |
| Atom | `atom-status-dot atom-status-dot--live atom-status-dot--sm` | Live streaming indicator dot |
| Atom | `atom-section-label atom-section-label--inline` + `.view-composer-streaming__live-label` | "STREAMING" label coloured with `var(--state-live-fg)` |
| Atom | `atom-streaming-cursor` | Blinking cursor at token boundary |
| Atom | `atom-scroll-fade atom-scroll-fade--bottom atom-scroll-fade--on-page` | Thread scroll gradient |
| Molecule | `mol-app-header` | Persistent session header |
| Molecule | `mol-composer-toolbar` | Scrollable toolbar row above input |
| Molecule | `mol-composer-row mol-composer-row--streaming` | Disabled input + Stop button row |
| Molecule | `mol-user-message-bubble` | Prior user turn in stub thread |
| Molecule | `mol-assistant-message-head mol-assistant-message-head--streaming` | In-progress assistant turn header with live badge |

## State driver

In production, this state is active when `streamingTurnId !== null` (a turn ID is assigned the moment the API response begins). The textarea `disabled` attribute and the Send→Stop swap are both driven by `isStreaming` derived from `streamingTurnId`. Pressing Stop dispatches a cancellation signal and resets `streamingTurnId` to `null`, returning the composer to idle.

## Cross-link

See sibling `../_combined/_combined.html` for all 3 states side-by-side.
