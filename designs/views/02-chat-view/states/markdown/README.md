# chat-view-markdown

UC-RENDER-03 §A — code block + inline code rendering in a completed assistant message.

## Purpose

Renders an assistant message that contains a fenced code block (with language label and copy affordance) and a trailing paragraph with inline `<code>` spans. Demonstrates how `mol-code-block` composes inside the standard chat viewport shell without any modification to atom or molecule rules.

## PRD Wireframe Reference

```
│ Here's the updated handler:           │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ typescript          [Copy 📋]   │   │  ← language label + copy affordance
│ │ ─────────────────────────────── │   │
│ │ export const billing =          │   │  ← syntax-highlighted monospace
│ │   router({                      │   │
│ │     getInvoice: publicProc      │   │
│ │       .input(z.string())        │   │
│ │   });                           │   │
│ └─────────────────────────────────┘   │
│                                       │
│ Call it with `trpc.billing            │  ← inline code, contrasting bg
│ .getInvoice.query(id)`.               │
```

## Anatomy

```
atom-device-bezel
└── atom-device-bezel__viewport
    ├── atom-device-bezel__dynamic-island
    ├── atom-device-bezel__status-bar
    ├── mol-app-header
    │   ├── mol-app-header__back        → atom-icon-button (chevron-left)
    │   ├── mol-app-header__title-wrap  → type-title + type-meta
    │   └── mol-app-header__actions     → atom-icon-button (more-vertical)
    ├── [main role=log] view-chat-view-markdown__thread
    │   ├── atom-scroll-fade--top (hidden)
    │   ├── mol-user-message-bubble
    │   │   ├── mol-user-message-bubble__bubble  type-body
    │   │   └── mol-user-message-bubble__meta    type-meta
    │   ├── [article] view-chat-view-markdown__assistant
    │   │   ├── mol-assistant-message-head --idle
    │   │   │   ├── atom-avatar --accent --sm
    │   │   │   ├── __label  (mol-assistant-message-head__label)
    │   │   │   ├── __separator
    │   │   │   └── __time
    │   │   └── view-chat-view-markdown__body  type-body
    │   │       ├── <p> lead-in paragraph
    │   │       ├── figure.mol-code-block
    │   │       │   ├── mol-code-block__head
    │   │       │   │   ├── mol-code-block__lang  ("typescript")
    │   │       │   │   └── mol-code-block__copy
    │   │       │   │       ├── atom-icon-glyph --sm --muted  (copy icon)
    │   │       │   │       └── atom-button --ghost --sm      ("Copy")
    │   │       │   └── pre.mol-code-block__body
    │   │       │       └── <code> with .mol-code-block__kw / __fn spans
    │   │       └── <p> with <code class="type-code"> inline code
    │   └── atom-scroll-fade--bottom
    └── [footer] view-chat-view-markdown__composer
        ├── mol-composer-toolbar
        │   ├── atom-pill (model)
        │   ├── atom-pill (thinking)
        │   └── atom-pill (permission)
        └── mol-composer-row --idle
            ├── atom-textarea --composer  (empty, placeholder shown)
            └── atom-icon-button --primary --pill .is-disabled  (send)
```

## Composition Table

| Region | Class(es) used | Note |
|---|---|---|
| Device frame | `atom-device-bezel` | iPhone 16 Pro Max |
| Status bar | `atom-device-bezel__status-bar`, `__time`, `__indicators`, `__battery` | 9:38 AM |
| Header | `mol-app-header`, `mol-app-header__back`, `__title-wrap`, `__actions` | "Refactor billing module" |
| Back button | `atom-icon-button --ghost --md` | chevron-left SVG |
| More button | `atom-icon-button --ghost --md` | more-vertical SVG |
| User bubble | `mol-user-message-bubble`, `__bubble`, `__meta` | `type-body`, `type-meta` |
| Asst head | `mol-assistant-message-head --idle` | hides `__status` slot via `--idle` |
| Asst avatar | `atom-avatar --accent --sm` | "A" initial |
| Prose body | `view-chat-view-markdown__body type-body` | flex column, gap `var(--space-3)` |
| Code block | `figure.mol-code-block` | `__head` + `__body` |
| Lang label | `mol-code-block__lang` | uppercase monospace |
| Copy icon | `atom-icon-glyph --sm --muted` | clipboard SVG |
| Copy button | `atom-button --ghost --sm` | "Copy" text label |
| Code body | `mol-code-block__body` | `__kw`, `__fn` highlight spans |
| Inline code | `<code class="type-code">` | inside body `<p>` |
| Composer toolbar | `mol-composer-toolbar` | 3 `atom-pill --default --md` triggers |
| Composer row | `mol-composer-row --idle` | idle variant |
| Textarea | `atom-textarea --composer` | placeholder "Type a message…" |
| Send button | `atom-icon-button --primary --md --pill .is-disabled` | arrow-up, disabled |

## Token Recipe

| Property | Token |
|---|---|
| Thread gap | `var(--space-5)` |
| Prose body gap | `var(--space-3)` |
| Thread padding | `var(--space-4)` |
| Composer safe-area padding | `var(--safe-area-bottom)` |
| Code syntax — keyword | `var(--syntax-keyword)` → `var(--accent-primary)` |
| Code syntax — function | `var(--syntax-function)` → `var(--_purple)` |
| Code syntax — string | `var(--syntax-string)` → `var(--state-success-fg)` |
| Code syntax — comment | `var(--syntax-comment)` → `var(--text-faint)` |
| Code line-height | `var(--line-height-code)` → `var(--line-height-normal)` |

## Accessibility

- `<main role="log" aria-live="polite">` — screen reader announces new messages.
- `<article aria-label="Assistant message">` — each turn is a landmark.
- `<figure aria-label="TypeScript code block">` — code block is a figure landmark.
- Copy button has `aria-label="Copy code to clipboard"`.
- Send button `disabled` attribute + `.is-disabled` — both semantic and visual.
- All SVGs are `aria-hidden="true"` with parent element aria labels.

## ATOM_GAP

Two token variables are consumed by `_molecules.css` (`mol-code-block`) but not yet defined in `tokens.css`. They are declared in the view's local `<style>` block:

- `--syntax-keyword` — maps to `var(--accent-primary)` (ember)
- `--syntax-string` — maps to `var(--state-success-fg)` (green)
- `--syntax-function` — maps to `var(--_purple)` (purple)
- `--syntax-comment` — maps to `var(--text-faint)` (muted italic)
- `--line-height-code` — maps to `var(--line-height-normal)` (1.5)

These should be promoted to `tokens.css` under the Typography section when the gap is closed.
