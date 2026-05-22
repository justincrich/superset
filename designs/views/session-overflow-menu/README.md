# session-overflow-menu

UC-SESS-04 §A — Session overflow action sheet triggered by tapping ··· in the app header.

## Preview

Open `session-overflow-menu.html` in a browser. The file renders two stacked panes (dark / light) showing the iPhone 16 Pro Max bezel with the action sheet overlaying a dimmed chat view.

## Composition

| Region | Classes used |
|---|---|
| Device frame | `atom-device-bezel`, `atom-device-bezel__viewport`, `atom-device-bezel__dynamic-island`, `atom-device-bezel__status-bar`, `atom-device-bezel__content`, `atom-device-bezel__home-indicator` |
| Behind-sheet stub | `mol-app-header` (title "Fix auth bug" / subtitle "superset · main"), `mol-user-message-bubble`, `mol-assistant-message-head`, `atom-avatar--accent` |
| Backdrop scrim | `atom-backdrop atom-backdrop--scrim` (position: absolute inside chat region) |
| Sheet container | View-local: `view-session-overflow-menu__sheet` — `background: var(--surface-overlay)`, top-radius `var(--radius-xl)`, shadow `var(--elevation-sheet)` |
| Sheet drag handle | `atom-home-indicator atom-home-indicator--sheet-handle atom-home-indicator--muted` (centered in handle row) |
| Action rows (3) | View-local inline pattern: `view-session-overflow-menu__action-row` — full-width `<button>` composed of `atom-icon-glyph--md` + `.type-body` label. `min-height: var(--touch-target-min)`, gap `var(--space-3)`, padding `var(--space-3) var(--space-4)`. Hover: `var(--surface-soft)`. |
| Destructive row | `view-session-overflow-menu__action-row--destructive` — `color: var(--state-danger-fg)` on both icon and label |
| Footer divider | `atom-divider atom-divider--horizontal` |
| Cancel button | `atom-button atom-button--secondary atom-button--md` (full-width via `width: 100%`) |
| Safe area | `padding-block-end: var(--safe-area-bottom, var(--space-4))` on cancel wrapper |

## Action row pattern (inline — Rule of 2)

The three action rows appear only in this view, so the pattern is inlined per DRY Rule of 2 rather than extracted to a shared molecule. Each row is:

```html
<button class="view-session-overflow-menu__action-row" type="button" aria-label="…">
  <svg class="atom-icon-glyph atom-icon-glyph--md" …>…</svg>
  <span class="view-session-overflow-menu__action-label type-body">…</span>
</button>
```

The destructive row adds `view-session-overflow-menu__action-row--destructive` which sets `color: var(--state-danger-fg)` on both the icon and label via CSS inheritance.

## Stylesheet load order

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## Composition purity

- ZERO `.atom-*` rules redefined in the view `<style>` block
- ZERO `.mol-*` rules redefined in the view `<style>` block
- ZERO hex literals
- ZERO raw `font-size` / `font-weight` / `line-height` values
- ZERO raw `px` in `padding` / `margin` / `gap` (1px structural borders and `--elevation-sheet` shadow are documented system-level exceptions)
