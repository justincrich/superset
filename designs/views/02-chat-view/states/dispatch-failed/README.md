# chat-view · dispatch failed

## PRD Reference

**UC-PLATF-03 §B variant** — A dispatch attempt reached the host but Claude Code could not be contacted or failed to start (`dispatch_outcome === 'dispatch_failed'`).

## State Description

The dispatch-failed state renders when a dispatch returns `dispatch_failed` — meaning the relay reached the host machine, the plan is active, but the attempt to start a Claude Code session failed (Claude binary unreachable, process crash, relay transport error, etc.). A danger-severity inline banner appears below the app header with an alert-triangle icon, the text "Dispatch failed · Couldn't reach Claude.", and a Retry link-button. The `--inline` modifier keeps the banner compact (single row) because the message is brief and no extended explanation is needed — the Retry CTA gives users an immediate recovery path. The composer is disabled because the last dispatch did not produce an active session. The banner uses `role="alert"` and `aria-live="assertive"` because this state actively blocks session progress and was triggered by a user action (sending a message).

## Composition Table

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button, more-vertical action button |
| `atom-icon-button --primary --md --pill` | Atom | Send button (disabled) |
| `atom-icon-glyph --sm` | Atom | alert-triangle icon inside banner |
| `atom-button --link --sm` | Atom | "Retry" CTA inside banner |
| `atom-pill --default --md --leading-icon` | Atom | Composer toolbar trigger pills (disabled) |
| `atom-textarea --composer` | Atom | Message input (disabled) |
| `atom-scroll-fade --top / --bottom --on-page` | Atom | Thread scroll gradient overlays |
| `atom-avatar --accent --sm` | Atom | Assistant avatar in message head |
| `atom-tool-status-rule --horizontal --error` | Atom | Danger-coloured rule at banner top |
| `mol-app-header` | Molecule | Back + title/subtitle + actions row |
| `mol-banner --dispatch-failed --inline` | Molecule | Danger inline banner with alert-triangle + Retry CTA |
| `mol-user-message-bubble` | Molecule | User turn bubble with timestamp |
| `mol-assistant-message-head --idle` | Molecule | Assistant avatar + label + timestamp row |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 trigger pills (all disabled) |
| `mol-composer-row --idle` | Molecule | Textarea + send button row (both disabled) |

**Distinct atom classes: 14 | Distinct molecule classes: 6**

## State Driver

```
dispatch_outcome === 'dispatch_failed'
```

The relay reached the host and the plan is active, but starting a Claude Code session failed. Causes include: Claude binary not found on PATH, the relay transport closed mid-handshake, a process supervisor crash, or a timeout waiting for the session handshake. The Retry action re-dispatches the pending message without requiring the user to re-type it.

## Cross-link

See sibling [`../_platform-errors-combined/_platform-errors-combined.html`](../_platform-errors-combined/_platform-errors-combined.html) for all 3 banner variants (host offline, plan required, dispatch failed) side-by-side in a single file.
