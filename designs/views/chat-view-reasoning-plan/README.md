# chat-view-reasoning-plan

**Use case**: UC-RENDER-05 §A — PlanBlock collapsed/expanded + ReasoningBlock collapsed

## Overview

Static design view showing a completed assistant turn in a chat session. The assistant
returns a plan block (shown in both collapsed and expanded states side-by-side) followed
by an interleave sentence and a collapsed reasoning block. The turn is complete so the
composer is in idle state with a send button.

## Composition

| Region | Component |
|---|---|
| Device frame | `atom-device-bezel` |
| Header | `mol-app-header` — "Refactor billing module" / "superset · billing-refactor" |
| User message | `mol-user-message-bubble` — "Show me the plan first" · 9:32 |
| Assistant head | `mol-assistant-message-head --idle` |
| Assistant intro | View-local prose — "Here's the proposed refactor plan:" |
| Plan collapsed (block 1) | `mol-collapsed-block --plan` — collapsed; label "PLAN · Refactor billing · 4 steps" |
| Plan expanded (block 2) | `mol-collapsed-block --plan` with `open` attribute — expanded; same label + 4 steps |
| Body interleave | View-local prose — "Here's my reasoning behind this approach:" |
| Reasoning collapsed (block 3) | `mol-collapsed-block --reasoning` — collapsed; "REASONING · 3.4s · 245 tokens" |
| Composer | `mol-composer-toolbar` + `mol-composer-row --idle` with send button |

## States rendered

- **Plan collapsed**: `<details class="mol-collapsed-block mol-collapsed-block--plan">` — chevron pointing down
- **Plan expanded**: `<details class="mol-collapsed-block mol-collapsed-block--plan" open>` — chevron rotated 180° via `_molecules.css` `[open]` selector
- **Reasoning collapsed**: default state, no `open` attribute; preview body is present in DOM for when the user taps to expand

## Stylesheets (load order)

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

All view-local layout lives in the `<style>` block under the `.view-chat-view-reasoning-plan__*`
namespace. No atom or molecule rules are redefined.

## Token compliance

- Zero hex literals or raw color values in view-local CSS
- All spacing via `var(--space-*)` / `var(--spacing-*)` tokens
- All typography via `var(--font-*)`, `var(--line-height-*)` tokens
- Device geometry via `var(--safe-area-*)` tokens

## File

`chat-view-reasoning-plan.html` — self-contained; dark pane first, light pane second.
