# composer-slash-menu

**UC-COMP-01 §C** — Slash command popover open over the message composer.

## View snapshot

```
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ /model   Switch model            │ │  ← popover (floating above toolbar)
│ │ /plan    Create a plan  ◀ active │ │  ← is-highlighted: arrow-key nav
│ │ /review  Review changes          │ │
│ │ /stop    Stop current turn       │ │
│ │ ── custom ──────────────────     │ │
│ │ /deploy  Deploy to staging       │ │
│ │ /release Tag a release           │ │
│ │ /refactor-relay  (PROJECT)       │ │
│ └──────────────────────────────────┘ │
│ ┌────────────────────────────────┐   │
│ │  /                             │   │  ← cursor after slash
│ └─────────────────────────── [▶] ┘   │
└──────────────────────────────────────┘
```

## Composition

| Region | Implementation |
|--------|---------------|
| Device frame | `atom-device-bezel` (iPhone 16 Pro Max, 444×962) |
| Header | `mol-app-header` — back + title/subtitle + actions |
| Thread stub | `mol-user-message-bubble` + `mol-assistant-message-head` + body prose |
| Composer footer | `view-composer-slash-menu__composer` (position: relative — popover anchor) |
| Slash-menu popover | `view-composer-slash-menu__popover` — absolute-positioned above toolbar, `role="listbox"` |
| Popover items | `mol-slash-command-option` — `--builtin` / `--user` / `--project` variants |
| Section divider | `mol-slash-command-option__divider-row` + `atom-section-label --with-rule` |
| Highlighted row | `.is-highlighted` on `/plan` option — demonstrates arrow-key navigation state |
| Toolbar | `mol-composer-toolbar` — visible behind popover, `aria-hidden` while popover open |
| Composer row | `mol-composer-row --typing` — textarea contains `"/"`, submit button enabled |

## Popover structure

```
role="listbox"  aria-activedescendant="cmd-plan"
  mol-slash-command-option --builtin          /model
  mol-slash-command-option --builtin is-highlighted  /plan  ← highlighted
  mol-slash-command-option --builtin          /review
  mol-slash-command-option --builtin          /stop
  mol-slash-command-option__divider-row
    atom-section-label --with-rule            CUSTOM
  mol-slash-command-option --user             /deploy
  mol-slash-command-option --user             /release
  mol-slash-command-option --project          /refactor-relay
```

## Badge color conventions

| Source | `atom-badge` variant | Colour |
|--------|---------------------|--------|
| Built-in | `--neutral` | `--surface-soft` / `--text-body` |
| User | `--live` | `--state-live-fg` (green) |
| Project | `--accent` | `--accent-primary` |

## Popover positioning

`view-composer-slash-menu__popover` uses `position: absolute` anchored to the
`view-composer-slash-menu__composer` footer (`position: relative`).
`bottom` is calculated as:
```
calc(var(--touch-target-min) + var(--composer-min-height) + var(--space-1))
```
This lifts the popover above both the toolbar (44px min-height) and the composer
row, matching the `@rn-primitives/popover` floating behavior specified in UC-COMP-01 §C.

## Stylesheets (load order)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

View-local rules use only `.view-composer-slash-menu__*` selectors.
No `.atom-*` or `.mol-*` rules are redefined.

## Tokens used (no inline values)

- `--surface-overlay` — popover background
- `--border-subtle` — popover border
- `--radius-default` — popover corner radius
- `--elevation-overlay` — popover drop-shadow
- `--touch-target-min` — toolbar height baseline for popover bottom offset
- `--composer-min-height` — composer row height baseline
- `--space-*` — all spacing
- `--safe-area-bottom` — home indicator clearance

## Accessibility

- Popover: `role="listbox"` + `aria-activedescendant` pointing to highlighted option
- Textarea: `aria-controls`, `aria-expanded="true"`, `aria-haspopup="listbox"`, `aria-autocomplete="list"`, `aria-activedescendant`
- Each option: `role="option"` + `aria-selected` (`true` only on highlighted)
- Toolbar is `aria-hidden="true"` while popover is open (focus trapped in popover)
- All decorative SVGs: `aria-hidden="true"`
