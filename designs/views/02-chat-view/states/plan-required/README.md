# chat-view · plan required

## PRD Reference

**UC-PLATF-03 §B variant** — Dispatch was skipped because the host's Superset subscription is inactive or expired (`dispatch_outcome === 'skipped_unpaid'`).

## State Description

The plan-required state renders when a dispatch attempt returns `skipped_unpaid` — meaning the relay reached the host but declined to start a Claude session because the host account has no active paid plan. A danger-severity stacked banner appears below the app header with an alert-triangle icon, bold "Host plan required" heading, body copy "Upgrade your host to resume.", and a secondary-style "Upgrade →" CTA button. The `--stacked` modifier gives the banner a two-row layout: the icon + title row on the first line and the body + CTA on subsequent lines, allowing the longer explanatory copy to wrap naturally. The composer is fully disabled because no new dispatch is possible until the host upgrades. The banner uses `role="alert"` and `aria-live="assertive"` because the condition actively blocks the user from continuing their session.

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
| `atom-button --secondary --sm` | Atom | "Upgrade →" CTA inside banner |
| `atom-pill --default --md --leading-icon` | Atom | Composer toolbar trigger pills (disabled) |
| `atom-textarea --composer` | Atom | Message input (disabled) |
| `atom-scroll-fade --top / --bottom --on-page` | Atom | Thread scroll gradient overlays |
| `atom-avatar --accent --sm` | Atom | Assistant avatar in message head |
| `atom-tool-status-rule --horizontal --error` | Atom | Danger-coloured rule at banner top |
| `mol-app-header` | Molecule | Back + title/subtitle + actions row |
| `mol-banner --unpaid --stacked` | Molecule | Danger stacked banner with alert-triangle, body copy, Upgrade CTA |
| `mol-user-message-bubble` | Molecule | User turn bubble with timestamp |
| `mol-assistant-message-head --idle` | Molecule | Assistant avatar + label + timestamp row |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 trigger pills (all disabled) |
| `mol-composer-row --idle` | Molecule | Textarea + send button row (both disabled) |

**Distinct atom classes: 14 | Distinct molecule classes: 6**

## State Driver

```
dispatch_outcome === 'skipped_unpaid'
```

The relay reached the host machine but the host's Superset account has no active paid plan. The host admin must upgrade at superset.sh/billing before further dispatches are permitted. The Upgrade CTA deep-links to the billing page for the host's workspace.

## Cross-link

See sibling [`../_platform-errors-combined/_platform-errors-combined.html`](../_platform-errors-combined/_platform-errors-combined.html) for all 3 banner variants (host offline, plan required, dispatch failed) side-by-side in a single file.
