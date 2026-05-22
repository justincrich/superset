# pause-pending-action-pill

**Use case**: UC-PAUSE-04 §A — floating pending pill when the approval card is off-screen.

## What this view shows

The user has scrolled up in the chat thread. The pending-approval-card is below the visible viewport. The `mol-pending-action-pill` (approval variant, "1 PENDING ↓") floats at the bottom-right of the scroll region, above the suppressed composer, alerting the user that an action awaits below.

## Composition

| Region | Component |
|---|---|
| Device frame | `atom-device-bezel` |
| Header | `mol-app-header` — "Fix auth bug" / "superset · main" |
| Thread | `view-pause-pending-action-pill__thread` — flex-1 scroll container with date separator and four messages |
| Pending pill | `mol-pending-action-pill --approval` + `atom-pill --warning --md` — absolute bottom-right above composer |
| Composer | `.view-pause-pending-action-pill__composer-stub` — `opacity: 0.3`, `pointer-events: none` |

## Thread content (scrolled UP context)

- Date separator: AUG 12, 2025
- 8:45 — User: "Can you refactor billing to use tRPC?"
- 8:46 — Assistant idle: "Sure, I'll start by extracting the router…"
- 9:30 — User: "Let's pick this up"
- 9:31 — Assistant idle: "Continuing from yesterday — drafting the procedures…"
- Approval card is **off-screen below** these messages

## Pending pill spec

| Property | Value |
|---|---|
| Variant | `--approval` |
| Label | `1 PENDING ↓` |
| Position | `absolute` bottom-right via `mol-pending-action-pill` CSS (`bottom: calc(var(--composer-min-height) + var(--space-3))`, `right: var(--space-4)`) |
| Color | `--state-warning-fg` (amber) — on `atom-pill --warning` background |
| State | Default visible (hover state default — no active animation freeze) |
| Icon leading | Crosshair target ⌖ (`atom-icon-glyph --xs`) |
| Icon trailing | Arrow-down ↓ (`atom-icon-glyph --xs`) |

## Stylesheets (6)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## Token compliance

- Zero hex literals in `.view-pause-pending-action-pill__*` rules
- Zero raw `font-size` / `font-weight` / `line-height` declarations
- All spacing via `var(--space-*)`, colors via semantic tokens
- `opacity: 0.3` on composer stub is a structural value per UC-PAUSE-04 §A spec
