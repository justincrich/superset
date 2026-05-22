# delete-session-dialog

**UC-SESS-05 §A** — Delete confirmation dialog

## Purpose

Centered iOS-style alert dialog asking the user to confirm permanent deletion of a chat session. Appears over a dimmed chat-view background. Not a bottom sheet.

## Composition

| Region | Implementation |
|---|---|
| Device frame | `atom-device-bezel` + `atom-device-bezel__viewport` |
| Behind dialog | `.view-delete-session-dialog__chat-stub` — faux thread rows, `aria-hidden` |
| Scrim | `.view-delete-session-dialog__overlay` — `rgba(0,0,0,0.55)` matching `atom-backdrop--scrim`; `display:flex; align-items:center; justify-content:center` for dialog centering |
| Dialog card | `.view-delete-session-dialog__card` — `var(--surface-overlay)` bg, `var(--radius-xl)` corners, `var(--elevation-modal)` shadow, `var(--space-5)` padding, `max-width: 280px` |
| Title | `<h2 class="type-title">` — "Delete "Fix auth bug"?" |
| Body | `<p class="type-body">` — permanent deletion warning |
| Cancel button | `atom-button atom-button--secondary atom-button--md`, `flex: 1` |
| Delete button | `atom-button atom-button--destructive atom-button--md`, `flex: 1` |

## Stylesheets (6)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## Tokens used

| Token | Role |
|---|---|
| `--surface-overlay` | Dialog card background |
| `--surface-raised` | Faux chat message row fill |
| `--radius-xl` | Dialog card corner radius |
| `--elevation-modal` | Dialog card drop shadow |
| `--space-2/3/4/5/6` | Internal spacing |
| `--state-danger-fg` | Destructive button fill (via `atom-button--destructive`) |
| `--surface-soft` | Secondary button fill (via `atom-button--secondary`) |
| `--text-heading` | Title color (via `type-title`) |
| `--text-body` | Body copy color (via `type-body`) |

## Design notes

- The overlay is `position: absolute` (not `position: fixed`) so it is clipped to the device viewport rather than the browser window.
- The faux chat stub (`aria-hidden="true"`) provides visual depth without interactive noise for accessibility.
- Both Cancel and Delete buttons are `flex: 1` so they share equal width within the button row regardless of label length.
- The dialog uses `role="dialog" aria-modal="true" aria-labelledby` for correct screen-reader semantics.
- Renders in both dark (default) and light themes as stacked panes.
