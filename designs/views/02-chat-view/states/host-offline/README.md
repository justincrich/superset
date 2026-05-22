# chat-view · host offline

## PRD Reference

**UC-PLATF-03 §A** — Host machine is unreachable (network offline, machine powered off, or SSH tunnel dropped).

## State Description

The host-offline state renders when the Superset relay cannot reach the user's local Claude Code host machine. A warning-severity inline banner appears immediately below the app header, showing a wifi-off icon, the text "Host offline", and a Retry link-button. The composer is disabled (send button and all toolbar pills carry `disabled` + `is-disabled`) because no new dispatch is possible until the host reconnects. The thread retains its last completed turn so the user can review prior context while waiting. The banner uses `role="status"` and `aria-live="polite"` because the condition is recoverable and non-blocking for content already on screen.

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
| `atom-icon-glyph --sm` | Atom | wifi-off icon inside banner |
| `atom-button --link --sm` | Atom | "Retry" CTA inside banner |
| `atom-pill --default --md --leading-icon` | Atom | Composer toolbar trigger pills (disabled) |
| `atom-textarea --composer` | Atom | Message input (not disabled — send button blocks submission) |
| `atom-scroll-fade --top / --bottom --on-page` | Atom | Thread scroll gradient overlays |
| `atom-avatar --accent --sm` | Atom | Assistant avatar in message head |
| `atom-tool-status-rule --horizontal --pending` | Atom | Warning-coloured rule at banner top |
| `mol-app-header` | Molecule | Back + title/subtitle + actions row |
| `mol-banner --offline --inline` | Molecule | Warning inline banner with wifi-off icon + Retry CTA |
| `mol-user-message-bubble` | Molecule | User turn bubble with timestamp |
| `mol-assistant-message-head --idle` | Molecule | Assistant avatar + label + timestamp row |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 trigger pills (all disabled) |
| `mol-composer-row --idle` | Molecule | Textarea + send button row |

**Distinct atom classes: 14 | Distinct molecule classes: 6**

## State Driver

```
connectivity === 'host-offline'
// OR
relay.ping(host) → timeout / ECONNREFUSED
```

This banner appears when the relay's heartbeat to the host machine fails. It is NOT triggered by a dispatch outcome — it precedes any dispatch attempt. The Retry action re-initiates the heartbeat check.

## Cross-link

See sibling [`../_platform-errors-combined/_platform-errors-combined.html`](../_platform-errors-combined/_platform-errors-combined.html) for all 3 banner variants (host offline, plan required, dispatch failed) side-by-side in a single file.
