# composer-states

**Use cases:** UC-COMP-01 §A (idle) · UC-COMP-01 §B (typing) · UC-COMP-03 §A (streaming)

Comparison view showing all three composer interaction states in a single document. Each theme pane contains three iPhone 16 Pro Max frames stacked vertically — one per state — so reviewers can scan the full state transition arc without switching files.

## Layout

```
pegboard
└── pane[data-theme="dark"]
    ├── state-section.idle       → Frame 1 — IDLE
    ├── state-section.typing     → Frame 2 — TYPING
    └── state-section.streaming  → Frame 3 — STREAMING
└── pane[data-theme="light"]
    ├── state-section.idle       → Frame 1 — IDLE
    ├── state-section.typing     → Frame 2 — TYPING
    └── state-section.streaming  → Frame 3 — STREAMING
```

Frames are stacked **vertically** within each pane. There is no side-by-side layout. Each frame is preceded by a color-coded section-label badge (IDLE / TYPING / STREAMING) that makes the state immediately scannable.

## Per-frame composition

| Region | Component |
|--------|-----------|
| Device chrome | `atom-device-bezel` + Dynamic Island + status bar + home indicator |
| App header | `mol-app-header` — "Refactor billing module" · superset · main |
| Thread | Brief stub: prior user turn + completed assistant reply (gives context for the composer state) |
| Composer toolbar | `mol-composer-toolbar` — Sonnet 4.6 / Thinking: low / Permission: default pills |
| Composer input row | `mol-composer-row` with state modifier (see variants below) |

## Composer-row variants

### IDLE (`mol-composer-row--idle`)
- Textarea: empty, placeholder "Type a message…"
- Send button: `atom-icon-button--primary` with `.is-disabled` + `disabled` attribute

### TYPING (`mol-composer-row--typing`)
- Textarea: pre-filled "Can you refactor the billing module to use tRPC?"
- Send button: `atom-icon-button--primary` active (ember color, no disabled state)

### STREAMING (`mol-composer-row--streaming`)
- Textarea: `.is-disabled` + `disabled`, placeholder "(input disabled while turn is streaming)"
- Stop button: `atom-icon-button--destructive atom-icon-button--pill` with square (■) icon
- Thread: shows live assistant turn with `mol-assistant-message-head--streaming`, `atom-status-dot--live`, and `atom-streaming-cursor`

## Stylesheet load order

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

No new CSS is introduced beyond the `.view-composer-states__*` layout-glue rules scoped to this view. All `.atom-*` and `.mol-*` classes are consumed as-is from the shared bundles.

## Modular design notes

- No atoms or molecules were duplicated or redefined.
- State-label color coding uses existing tokens: `--text-faint` (idle), `--accent-primary` / `--accent-primary-subtle` (typing), `--state-live-fg` / `--state-live-bg` (streaming).
- The three-frame stacked layout pattern follows the established `chat-view-thread` pane convention.
- Inline `style="margin-left: var(--space-1)"` on toolbar chevron SVGs is the same pattern used in `chat-view-thread`; it is structural geometry already present in the reference view, not a new deviation.
