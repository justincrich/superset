# composer · typing-send-enabled

**PRD UC reference:** UC-COMP-01 §B

## Description

The typing-send-enabled state occurs once the user has entered one or more non-whitespace characters into the composer textarea. The textarea expands to show the typed content (rows="2" in the design stub) and the Send button transitions from its disabled variant to its active primary pill form, signalling that the message is ready to submit. The toolbar pills remain interactive, allowing the user to change model, thinking level, or permission before sending. This state persists for the full duration of the user's editing session — every keystroke that keeps the field non-empty sustains it.

## Composition table

| Layer | Class(es) | Role |
|-------|-----------|------|
| Atom | `atom-device-bezel` / `atom-device-bezel__viewport` | iPhone frame shell |
| Atom | `atom-icon-button atom-icon-button--primary atom-icon-button--md atom-icon-button--pill` | Active Send button |
| Atom | `atom-textarea atom-textarea--composer` | Multi-row populated message input |
| Atom | `atom-pill atom-pill--default atom-pill--md atom-pill--leading-icon` | Toolbar control pills |
| Atom | `atom-avatar atom-avatar--accent atom-avatar--sm` | Assistant avatar |
| Atom | `atom-scroll-fade atom-scroll-fade--bottom atom-scroll-fade--on-page` | Thread scroll gradient |
| Molecule | `mol-app-header` | Persistent session header |
| Molecule | `mol-composer-toolbar` | Scrollable toolbar row above input |
| Molecule | `mol-composer-row mol-composer-row--typing` | Input + active Send row |
| Molecule | `mol-user-message-bubble` | Prior user turn in stub thread |
| Molecule | `mol-assistant-message-head mol-assistant-message-head--completed` | Completed assistant turn header |

## State driver

In production, this state is active when `composerValue.trim().length > 0` and `streamingTurnId === null`. The Send button enabled state is bound directly to `composerValue.trim().length > 0`. Pressing Send dispatches the message and the composer resets to idle.

## Cross-link

See sibling `../_combined/_combined.html` for all 3 states side-by-side.
