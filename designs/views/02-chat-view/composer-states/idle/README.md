# composer · idle

**PRD UC reference:** UC-COMP-01 §A

## Description

The idle state is the default resting condition of the message composer — the state the user sees immediately after opening a chat session or after a completed assistant turn has finished streaming. The textarea is empty and displays its placeholder text ("Type a message…"). The Send button is rendered in its disabled variant (`is-disabled` + `disabled` attribute) because there is no content to submit. The toolbar pills (model, thinking level, permission) remain fully interactive. This state acts as the visual baseline from which all other composer states transition.

## Composition table

| Layer | Class(es) | Role |
|-------|-----------|------|
| Atom | `atom-device-bezel` / `atom-device-bezel__viewport` | iPhone frame shell |
| Atom | `atom-icon-button atom-icon-button--primary atom-icon-button--md atom-icon-button--pill is-disabled` | Disabled Send button |
| Atom | `atom-textarea atom-textarea--composer` | Single-row empty message input |
| Atom | `atom-pill atom-pill--default atom-pill--md atom-pill--leading-icon` | Toolbar control pills |
| Atom | `atom-avatar atom-avatar--accent atom-avatar--sm` | Assistant avatar |
| Atom | `atom-scroll-fade atom-scroll-fade--bottom atom-scroll-fade--on-page` | Thread scroll gradient |
| Molecule | `mol-app-header` | Persistent session header |
| Molecule | `mol-composer-toolbar` | Scrollable toolbar row above input |
| Molecule | `mol-composer-row mol-composer-row--idle` | Input + action button row |
| Molecule | `mol-user-message-bubble` | Prior user turn in stub thread |
| Molecule | `mol-assistant-message-head mol-assistant-message-head--completed` | Completed assistant turn header |

## State driver

In production, this state is active when `composerValue === ""` (or trimmed length is 0). The Send button disables via `disabled` attribute bound to `!composerValue.trim().length`. No streaming is in progress (`streamingTurnId === null`).

## Cross-link

See sibling `../_combined/_combined.html` for all 3 states side-by-side.
