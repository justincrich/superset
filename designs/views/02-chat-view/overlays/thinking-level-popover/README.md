# composer-thinking-picker

**Use case**: UC-COMP-05 §A — thinking-level picker popover open

Static view showing the thinking-level picker popover surfaced above the composer toolbar, with the thinking trigger pill in its `is-open` state (chevron flipped 180°). Model and permission trigger pills remain in their closed default state.

## Composition

| Region | Component |
|---|---|
| Device frame | `atom-device-bezel` (iPhone 16 Pro Max) |
| App header | `mol-app-header` |
| Thread | Brief stub — `mol-user-message-bubble` + `mol-assistant-message-head` |
| Thinking picker popover | View-local `.view-composer-thinking-picker__popover` — `--surface-overlay` bg, `--radius-default` corners, `--elevation-overlay` shadow; contains `mol-thinking-level-option --thinking` rows inside a `fieldset` radiogroup |
| Composer toolbar | `mol-composer-toolbar` — thinking pill in `is-selected` / `aria-expanded="true"` state with chevron rotated 180°; model and permission pills remain closed |
| Composer row | `mol-composer-row --idle` |

## Popover contents

```
mol-thinking-level-option --thinking    off      No extended thinking
mol-thinking-level-option --thinking    low      ~1K tokens             ← is-selected / checked radio
mol-thinking-level-option --thinking    medium   ~5K tokens
mol-thinking-level-option --thinking    high     ~10K tokens
mol-thinking-level-option --thinking    xhigh    ~20K tokens
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

Only `.view-composer-thinking-picker__*` rules. No `.atom-*` or `.mol-*` rules redefined.

Key view-local classes:

| Class | Purpose |
|---|---|
| `.view-composer-thinking-picker__thread` | Flex-1 scroll region for chat messages |
| `.view-composer-thinking-picker__composer` | `position: relative` footer containing toolbar + row |
| `.view-composer-thinking-picker__popover` | `position: absolute; bottom: calc(100% + var(--space-1))` — floats above composer, anchored left of toolbar |
| `.view-composer-thinking-picker__popover-list` | Flex column inside popover |
| `.view-composer-thinking-picker__assistant` | Flex column for assistant head + body |
| `.view-composer-thinking-picker__body` | Prose container |

## Design notes

- **low selected state**: `mol-thinking-level-option` row gets `is-selected` class; radio gets `is-checked` class and `checked` attribute. Background resolves to `--surface-active`.
- **Thinking pill open state**: `atom-pill--warning is-selected` — warning tint signals active extended thinking; chevron SVG receives `transform: rotate(180deg)` inline. `aria-expanded="true"` communicates state to assistive technology.
- **Popover positioning**: anchored to the bottom of the composer `footer` element via `position: absolute; bottom: calc(100% + var(--space-1))`. Left-aligned to the toolbar start edge (`left: var(--space-3)`).
- **Popover width**: 260px — sized for the longest hint string ("No extended thinking") without overflow.
- **Model trigger**: remains in default `atom-pill--default` closed state with `aria-expanded="false"`.
- **Permission trigger**: remains in default `atom-pill--default` closed state with `aria-expanded="false"`.
- **Panes**: dark pane first, light pane second. Each pane gets independent radio `name` attributes (`dark-thinking-picker`, `light-thinking-picker`) so radio groups are independent.
