# chat-view-tool-calls

**Use case**: UC-RENDER-04 §A — three tool-call status states (running / done / error)

## What this view shows

A mid-turn assistant message containing three stacked `mol-tool-call-card` instances, each
demonstrating a distinct execution status:

| Card | Tool | Args | Status |
|------|------|------|--------|
| 1 | bash | `bun test --filter '**/relay/*' --bail` | RUNNING — animated spinner, glowing green left rule |
| 2 | bash | `npm run typecheck` | DONE · 0.4s — check icon, muted left rule |
| 3 | bash | `bun test --filter='**/billing/*'` | FAILED · exit 1 — warning icon, red left rule |

The assistant head is in `--streaming` mode (live dot + STREAMING label). Brief prose
context sits above each card. After the failed card the turn continues with
"Investigating the failed test now▌" and an `atom-streaming-cursor`.

## Composition

| Region | Component |
|--------|-----------|
| Device frame | `atom-device-bezel` (iPhone 16 Pro Max) |
| Status bar | `atom-device-bezel__status-bar` |
| Header | `mol-app-header` — "Run test suite" / "superset · main" |
| Thread scroll | `.view-chat-view-tool-calls__thread` |
| User message | `mol-user-message-bubble` |
| Assistant head | `mol-assistant-message-head --streaming` |
| Tool call cards (×3) | `mol-tool-call-card` — see status mapping below |
| Left rule per card | `atom-tool-status-rule --running / --done / --error` |
| Running status pill | `atom-pill--live --sm` + `atom-spinner--circular --xs --live` |
| Done status pill | `atom-pill--default --sm` + check SVG in `--state-success-fg` |
| Error status pill | `atom-pill--danger --sm` + warning triangle SVG |
| Streaming cursor | `atom-streaming-cursor` |
| Composer toolbar | `mol-composer-toolbar` |
| Composer row | `mol-composer-row --streaming` (Stop button) |
| Home indicator | `atom-device-bezel__home-indicator` |

## Status token mapping

| State | Left rule | Pill variant | Icon |
|-------|-----------|--------------|------|
| RUNNING | `atom-tool-status-rule--running` → `var(--state-live-fg)` with glow | `atom-pill--live` | `atom-spinner--circular --live` |
| DONE | `atom-tool-status-rule--done` → `var(--state-success-fg)` | `atom-pill--default` | check SVG in `var(--state-success-fg)` |
| FAILED | `atom-tool-status-rule--error` → `var(--state-danger-fg)` | `atom-pill--danger` | warning SVG (inherits `var(--state-danger-fg)`) |

## Files

```
chat-view-tool-calls/
├── README.md                      ← this file
└── chat-view-tool-calls.html      ← self-contained view (dark + light panes)
```

## Stylesheets (load order)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## Modular design notes

- Zero new atoms or molecules were added. All components existed before this view.
- View-local layout uses `.view-chat-view-tool-calls__*` namespace only.
- No inline hex colors. All colors reference semantic tokens.
- The three-card stack is a first use here (Rule of 2: no extraction yet).
- `atom-pill--leading-icon` + `atom-spinner--circular` is the established running-state
  composition pattern — no custom CSS needed.
