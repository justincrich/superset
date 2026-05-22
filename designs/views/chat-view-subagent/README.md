# chat-view-subagent

**Use-case:** UC-RENDER-06 §A — nested subagent execution group  
**File:** `chat-view-subagent.html`

## What it shows

A parent assistant turn that launches a named subagent, waits for it, and resumes streaming. The view demonstrates:

- A parent turn body line before the subagent group ("Running sub-task via agent…")
- An open `mol-collapsed-block --subagent` block with left-gutter visual nesting
- The subagent header row: "SUBAGENT · fix-tests · claude-haiku" using `atom-section-label` + `type-code` + `type-meta`
- A nested `mol-tool-call-card` with `atom-tool-status-rule--done` and "DONE · 1.2s" status
- Subagent assistant body: "All 42 tests passing."
- Parent turn resumes: "Sub-task complete. Continuing with the dashboard updates" + `atom-streaming-cursor`
- Streaming composer footer: `mol-composer-toolbar` + `mol-composer-row --streaming` (Stop button active)

## Composition

| Region | Classes used |
|---|---|
| Device frame | `atom-device-bezel` + sub-elements |
| Header | `mol-app-header` — "Fix billing tests" / "superset · billing-refactor" |
| Thread | `.view-chat-view-subagent__thread` (flex column, scroll region) |
| User message | `mol-user-message-bubble` — "Fix the failing billing tests" · 9:50 |
| Assistant head | `mol-assistant-message-head --idle` |
| Parent body line 1 | `.view-chat-view-subagent__body type-body` paragraph |
| Subagent gutter | `.view-chat-view-subagent__subagent-wrap` — left border + margin-left via view-local rule |
| Subagent block | `mol-collapsed-block --subagent` (`<details open>`) |
| Subagent header | `mol-collapsed-block__summary` with gear icon + `atom-section-label` label + chevron |
| Subagent body | `.view-chat-view-subagent__subagent-body` — flex column, `surface-sunken` bg |
| Nested tool call | `mol-tool-call-card` with `atom-tool-status-rule--done` + `atom-pill--sm` + DONE status |
| Subagent text | `type-body` paragraph — "All 42 tests passing." |
| Parent body line 2 | `.view-chat-view-subagent__body type-body` + `atom-streaming-cursor` |
| Composer toolbar | `mol-composer-toolbar` (model / thinking / permission triggers) |
| Composer row | `mol-composer-row --streaming` (textarea disabled + Stop button) |

## Stylesheet load order

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## View-local rules

All view-specific layout lives in `.view-chat-view-subagent__*` classes in the `<style>` block. No `.atom-*` or `.mol-*` rules are redefined. The left-gutter visual nesting for the subagent block (`border-left` + `margin-left`) is applied via `.view-chat-view-subagent__subagent-wrap` so the molecule's own CSS remains unmodified.
