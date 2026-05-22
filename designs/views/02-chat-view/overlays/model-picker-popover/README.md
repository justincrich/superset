# composer-model-picker

**Use case**: UC-COMP-04 §A — model picker popover open

Static view showing the model picker popover surfaced above the composer toolbar, with the model trigger pill in its `is-open` state.

## Composition

| Region | Component |
|---|---|
| Device frame | `atom-device-bezel` (iPhone 16 Pro Max) |
| App header | `mol-app-header` |
| Thread | Brief stub — `mol-user-message-bubble` + `mol-assistant-message-head` |
| Model picker popover | View-local `.view-composer-model-picker__popover` — `--surface-overlay` bg, `--radius-default` corners, `--elevation-overlay` shadow; contains `mol-model-picker-option` rows and `atom-section-label --with-rule` divider |
| Composer toolbar | `mol-composer-toolbar` — model pill in `is-selected` / `aria-expanded="true"` state, chevron rotated 180° |
| Composer row | `mol-composer-row --idle` |

## Popover contents

```
mol-model-picker-option --featured is-selected    Claude Opus 4.7  [NEW badge]  ← checked radio
mol-model-picker-option --default                 Claude Opus 4.6
mol-model-picker-option --default                 Claude Sonnet 4.6
mol-model-picker-option --default                 Claude Haiku 4.5
mol-model-picker-option-divider  (atom-section-label --with-rule "OPENAI")
mol-model-picker-option --default                 GPT-5.5
mol-model-picker-option --default                 GPT-5.4
```

## Stylesheets (6)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## View-local CSS

Only `.view-composer-model-picker__*` rules. No `.atom-*` or `.mol-*` rules redefined.

Key view-local classes:

| Class | Purpose |
|---|---|
| `.view-composer-model-picker__thread` | Flex-1 scroll region for chat messages |
| `.view-composer-model-picker__composer` | `position: relative` footer containing toolbar + row |
| `.view-composer-model-picker__popover` | `position: absolute; bottom: calc(100% + var(--space-1))` — floats above composer |
| `.view-composer-model-picker__popover-list` | Flex column inside popover |
| `.view-composer-model-picker__assistant` | Flex column for assistant head + body |
| `.view-composer-model-picker__body` | Prose container |

## Design notes

- **Opus 4.7 selected state**: uses `mol-model-picker-option--featured is-selected` which resolves to `color-mix(in oklch, var(--accent-primary-subtle) 60%, var(--surface-active) 40%)` — ember-tinted background signals recommended/featured status.
- **Model pill open state**: `atom-pill is-selected` gives active background; chevron SVG receives `transform: rotate(180deg)` inline to signal open direction. `aria-expanded="true"` communicates state to assistive technology.
- **Popover positioning**: anchored to the bottom of the composer `footer` element via `position: absolute; bottom: calc(100% + var(--space-1))`. Left-aligned to the toolbar start edge.
- **"NEW" badge**: `atom-badge--accent atom-badge--sm` — ember background, dark foreground, uppercase mono label.
- **OpenAI divider**: `atom-section-label --with-rule` — muted uppercase label with `::after` rule extending to full width.
- **Panes**: dark pane first, light pane second. Each pane gets independent radio `name` attributes (`dark-model-picker`, `light-model-picker`) so radio groups are independent.
