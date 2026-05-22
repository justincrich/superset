# Wireframe → Component Audit (Chat View Focus)

**Date:** 2026-05-22
**Source:** `plans/chat-mobile-plan/{04-uc-sess, 05-uc-comp, 06-uc-render, 07-uc-pause, 08-uc-platf}.md`
**Scope:** Chat-view wireframes only (sessions-list/nav surfaces out of scope per user direction)
**Approach:** Inventory every component the wireframes require, cross-reference against the existing build, identify gaps. Build bottom-up: atoms → molecules → organisms → views.

---

## CHAT-VIEW WIREFRAMES IN SCOPE (18)

| # | Wireframe | UC | What it shows |
|---|---|---|---|
| 1 | Chat view — loading history | UC-SESS-02 §A | Header · skeleton message list · composer disabled |
| 2 | Chat view — error + retry | UC-SESS-02 §B | Header · error banner · retry CTA · composer hidden |
| 3 | Session overflow menu | UC-SESS-04 §A | Bottom-sheet/menu over dimmed chat |
| 4 | Delete confirmation dialog | UC-SESS-05 §A | Modal with title + body + Cancel/Delete buttons |
| 5 | Composer — idle / empty | UC-COMP-01 §A | Toolbar (model · thinking · perm) · placeholder · disabled Send |
| 6 | Composer — typing + Send enabled | UC-COMP-01 §B | Toolbar · typed content · active Send |
| 7 | Composer — slash command popover | UC-COMP-01 §C | Popover w/ built-in + custom divider · cursor after `/` |
| 8 | Composer — streaming / Stop | UC-COMP-03 §A | Toolbar · disabled input · Stop replaces Send |
| 9 | Model picker popover | UC-COMP-04 §A | Popover w/ radios · Anthropic/OpenAI divider · "new" tag |
| 10 | Thinking-level popover | UC-COMP-05 §A | Popover w/ radios · token-budget hint per row |
| 11 | Message list — user + assistant + streaming | UC-RENDER-01 §A | **CANONICAL HERO** — header · user bubble · assistant body · streaming cursor · composer |
| 12 | Code block + inline code | UC-RENDER-03 §A | Code fence w/ language label + Copy · inline code w/ contrasting bg |
| 13 | Tool call — 3 status states | UC-RENDER-04 §A | Running / Completed / Failed collapsed cards w/ chevron |
| 14 | PlanBlock collapsed/expanded + ReasoningBlock | UC-RENDER-05 §A | Expand-collapse blocks with icons (📦 plan · 💭 reasoning) |
| 15 | Nested subagent execution | UC-RENDER-06 §A | Left-gutter indented subagent group w/ nested tool calls |
| 16 | Scroll-back button visible | UC-RENDER-07 §A | Floating "↓ Latest" FAB above composer when scrolled up |
| 17 | PendingApprovalCard inline + sticky footer | UC-PAUSE-01 §A | Inline card · sticky `1 of 1 [Approve][Decline][Always]` footer |
| 18 | ask_user bottom sheet | UC-PAUSE-02 §A | Sheet drag-handle · question · pills · BottomSheetTextInput · keyboard panel |
| 19 | Plan review — full-screen modal | UC-PAUSE-03 §A | `✕ Review Plan` header · scrollable markdown · expandable feedback · docked Reject/Approve |
| 20 | PendingActionIndicator floating pill | UC-PAUSE-04 §A | Floating `⌖ 1 pending — ↓` pill above composer |
| 21 | Chat view — host offline banner | UC-PLATF-03 §A | `⚠ Host offline · Retry` banner · disabled Send |
| 22 | Dispatch-outcome variants | UC-PLATF-03 §B | `⚠ Host plan required` + `⚠ Dispatch failed` banners |

---

## ATOM AUDIT

### ✅ Existing atoms (25) — covered by wireframes
| Atom | Used in |
|---|---|
| `button` | Approve / Decline / Always (UC-PAUSE-01), Cancel/Delete (UC-SESS-05), Reject/Approve (UC-PAUSE-03), Enable notifications, Retry, Open Settings |
| `icon-button` | Send (▶), Stop (■), Close (✕), Back (←), More (···), Copy (📋) |
| `icon-glyph` | All inline icons — see catalog extension below |
| `text-input` | Plan review feedback field |
| `textarea` | Composer · ask_user BottomSheetTextInput |
| `pill` | Toolbar chips (Sonnet 4.6 · ⚡ low · 🔐 default) · suggested-answer pills · slash-command-pill (atomic in editor) · pending-action-pill |
| `status-dot` | Status icons in absence of full icon-glyph (rare — most status visualized via tool-status-rule + icon) |
| `streaming-cursor` | `▌` at end of streaming assistant text (UC-RENDER-01) |
| `divider` | Hairlines in popovers · between tool-call cards · message gaps |
| `backdrop` | Behind sheets · plan-review modal · delete dialog · ask_user sheet |
| `spinner` | UC-SESS-02 §A loading history · in-button loading |
| `progress-dots` | Slash-command preview loading |
| `toast-base` | Error toast when message send fails |
| `section-label` | "── custom ──", "── OpenAI ──" section dividers · "STREAMING", "BUILT-IN", "PROJECT" labels |
| `tool-status-rule` | 3px left rule on PendingApprovalCard · tool-call-card variants |
| `fab-base` | Sessions list `+` FAB (out of scope) · scroll-back FAB (UC-RENDER-07) |
| `hit-target-wrapper` | 44pt tap zones for compact close ✕ glyphs, chevrons |
| `scroll-fade` | Top/bottom of chat thread + sheet content |
| `badge` | "new" tag on Opus 4.7 model option · "1 of N" approval counter · `·N` filter count |
| `device-bezel` | Every view's iPhone frame |
| `home-indicator` | Bottom of every view · sheet drag-handle (via `--sheet-handle` variant) |
| `avatar` | Assistant "A" head (used by `assistant-message-head` molecule) |
| `live-activity-dot` | Dynamic Island pulsing (out of immediate chat view scope) |
| `kbd` | Not used in chat-view wireframes (skip for now) |
| `tooltip` | Not used in chat-view wireframes (long-press affordances use system menu) |

### ❌ Missing atoms (2 + 1 catalog extension)

| Atom | Justification | Wireframes |
|---|---|---|
| **`radio`** | `● selected · ○ unselected` rows in model picker, thinking-level picker, permission-mode picker, filter checklist. Distinct from `status-dot` (purely visual) and `pill --selected` (interactive but different shape). | UC-COMP-04, UC-COMP-05 |
| **`checkbox`** | `[✓] / [ ]` filter rows in filter sheet (out of immediate scope, but needed for the filter view). Also used inline in markdown task lists. | UC-NAV-08 §C |
| **`icon-glyph` catalog extension (+9 icons)** | Append to existing atom: `package` (📦 project), `git-branch` (already there), `laptop` (💻 host), `cloud` (☁️ host), `bell` (🔔 notif), `copy` (📋 copy code), `shield` (🔐 perm), `zap` (⚡ thinking), `settings` (⚙ filter), `menu` (☰ hamburger). | UC-COMP, UC-PLATF, UC-NAV |

---

## MOLECULE AUDIT

### ✅ Existing molecules (12) — directly usable
| Molecule | Used in |
|---|---|
| `user-message-bubble` | UC-RENDER-01 user message |
| `assistant-message-head` | UC-RENDER-01 assistant message head |
| `tool-call-card` | UC-RENDER-04 three states |
| `collapsed-block` | UC-RENDER-05 (plan + reasoning variants) · UC-RENDER-06 (subagent variant) |
| `scroll-back-button` | UC-RENDER-07 |
| `search-bar` | Composer search? No — out of immediate scope (sessions list) |
| `host-chip` | Out of immediate scope |
| `host-picker-row` | Out of immediate scope |
| `session-row` | Out of immediate scope |
| `workspace-section-header` | Out of immediate scope |
| `load-more-pill` | Out of immediate scope |
| `empty-state` | UC-SESS-01 §B empty session list (adjacent to chat) |

### ❌ Missing molecules (chat-view scope — 14)

| # | Molecule | Composes | Where |
|---|---|---|---|
| 1 | `app-header` | icon-button (back) · type-title · type-meta (subtitle) · icon-button (more) | Every chat view header |
| 2 | `modal-header` | icon-button (close) · type-title | UC-PAUSE-03 plan review |
| 3 | `picker-trigger` | pill base + icon-glyph + label + chevron-down | Composer toolbar (model · thinking · perm) |
| 4 | `composer-toolbar` | 3 × picker-trigger in horizontal scroll | UC-COMP-01 §A toolbar row |
| 5 | `composer-row` | textarea (composer) + icon-button (send/stop, variant by state) | Every composer state |
| 6 | `slash-command-option` | icon-glyph (forward-slash) · type-code (name) · type-body-sm (description) · badge (source) | UC-COMP-01 §C popover row |
| 7 | `model-picker-option` | radio · type-body (model name) · badge ("new") · type-meta (section like "Anthropic") | UC-COMP-04 popover row |
| 8 | `thinking-level-option` | radio · type-label (level) · type-meta (`~1K tokens` budget hint) | UC-COMP-05 popover row |
| 9 | `pending-approval-card` | tool-status-rule (pending) · icon-glyph · type-body (header) · type-code (args preview) · divider | UC-PAUSE-01 inline card |
| 10 | `approval-footer` | badge (1-of-N) · 3 × button (Decline/Approve/Always) — sticky | UC-PAUSE-01 sticky bar |
| 11 | `suggested-answer-pill` | pill (accent) wrapped tappable | UC-PAUSE-02 horizontal-scroll pill row |
| 12 | `pending-action-pill` | pill (warning) · icon-glyph (⌖) · type-label (count) · icon-glyph (↓) | UC-PAUSE-04 floating pill |
| 13 | `banner` | tool-status-rule (warning/danger) · icon-glyph · type-body · button-link (CTA). Variants: offline / unpaid / dispatch-failed / permission-denied | UC-PLATF-03 §A/B · UC-PLATF-01 §B |
| 14 | `code-block` | type-meta (language label) · icon-button (Copy) · divider · type-code (body w/ syntax) | UC-RENDER-03 code block |

### ❌ Optional molecules (composing inline is fine)

| Molecule | Why optional | Inline approach |
|---|---|---|
| `assistant-message-body` | The body is just markdown content — can be done inline in views with `.type-body` + `.type-code` | View-level inline |
| `confirmation-dialog-body` | Title + body + buttons — simple enough to inline | View-level inline |
| `expandable-feedback-section` | `<details>` w/ textarea — already a primitive pattern | Inline using `collapsed-block` pattern |
| `inline-code` | Just `<code>` with token styling | View-level inline |
| `keyboard-panel` | Just a stand-in `<div>` mimicking iOS keyboard | View-level inline |

---

## ORGANISM AUDIT

### ❌ Missing organisms (chat-view scope — 10)

| # | Organism | Composes | Where |
|---|---|---|---|
| 1 | `chat-header` | app-header (or its parts) inside the chat-view-frame top region | Every chat view |
| 2 | `chat-thread` | scroll region containing user-message-bubble · assistant-message-head + body · tool-call-card · collapsed-block · etc. | Every chat view body |
| 3 | `composer` | composer-toolbar + composer-row inside footer region · variant by state (idle / typing / streaming / disabled / hidden) | UC-COMP all states |
| 4 | `slash-command-popover` | floating above composer, contains list of slash-command-option + custom divider | UC-COMP-01 §C |
| 5 | `picker-popover` | floating above composer toolbar, contains list of model-picker-option / thinking-level-option / permission-mode-option | UC-COMP-04, UC-COMP-05 |
| 6 | `pause-approval-overlay` | inline pending-approval-card + sticky approval-footer (composer suppressed) | UC-PAUSE-01 |
| 7 | `bottom-sheet` | backdrop + atom-home-indicator (sheet-handle variant) + content slot | UC-PAUSE-02 ask_user · UC-SESS-04 overflow menu |
| 8 | `plan-review-screen` | full-screen overlay: modal-header + scrollable markdown + expandable feedback + docked Reject/Approve | UC-PAUSE-03 |
| 9 | `confirmation-dialog` | backdrop + centered card with title + body + Cancel/Destructive buttons | UC-SESS-05 |
| 10 | `loading-skeleton` | placeholder message bubble shapes (alternating widths) for UC-SESS-02 §A | UC-SESS-02 §A |

---

## VIEW AUDIT (22 chat views)

All compose `device-bezel` + chat content. Each is full mobile screen mock, stacked dark + light theme panes (vertical, NEVER side-by-side per skill rule).

| # | View | UC | Organisms composed |
|---|---|---|---|
| 1 | `chat-view-loading` | UC-SESS-02 §A | chat-header · loading-skeleton · composer (disabled) |
| 2 | `chat-view-error-retry` | UC-SESS-02 §B | chat-header · banner (error) · button (retry centered) |
| 3 | `session-overflow-menu` | UC-SESS-04 §A | chat-thread (dimmed) · bottom-sheet (Rename/End/Delete options) |
| 4 | `delete-session-dialog` | UC-SESS-05 §A | chat-thread (dimmed) · confirmation-dialog |
| 5 | `composer-idle` | UC-COMP-01 §A | chat-thread · composer (idle/empty) |
| 6 | `composer-typing-send` | UC-COMP-01 §B | chat-thread · composer (typing, Send enabled) |
| 7 | `composer-slash-menu` | UC-COMP-01 §C | chat-thread · slash-command-popover · composer (with `/` typed) |
| 8 | `composer-streaming-stop` | UC-COMP-03 §A | chat-thread (streaming) · composer (Stop button) |
| 9 | `composer-model-picker` | UC-COMP-04 §A | chat-thread · picker-popover (model) · composer |
| 10 | `composer-thinking-picker` | UC-COMP-05 §A | chat-thread · picker-popover (thinking) · composer |
| 11 | `chat-view-thread` | UC-RENDER-01 §A | **CANONICAL** — chat-header · chat-thread (user+assistant+streaming) · composer (streaming/Stop) |
| 12 | `chat-view-markdown` | UC-RENDER-03 §A | chat-header · chat-thread (with code-block + inline-code) · composer (idle) |
| 13 | `chat-view-tool-calls` | UC-RENDER-04 §A | chat-header · chat-thread (3 × tool-call-card states) · composer (streaming) |
| 14 | `chat-view-reasoning-plan` | UC-RENDER-05 §A | chat-header · chat-thread (PlanBlock collapsed + expanded + ReasoningBlock) · composer (idle) |
| 15 | `chat-view-subagent` | UC-RENDER-06 §A | chat-header · chat-thread (nested subagent) · composer (idle) |
| 16 | `chat-view-scroll-back` | UC-RENDER-07 §A | chat-header · chat-thread (scrolled up) · scroll-back-button (visible) · composer (idle) |
| 17 | `pause-approval-inline-footer` | UC-PAUSE-01 §A | chat-header · chat-thread + pending-approval-card · approval-footer (sticky) · composer (suppressed) |
| 18 | `pause-ask-user-sheet` | UC-PAUSE-02 §A | chat-thread (dimmed) · bottom-sheet (question + pills + BottomSheetTextInput + keyboard panel) |
| 19 | `pause-plan-review-modal` | UC-PAUSE-03 §A | full-screen plan-review-screen organism (no chat-header — modal owns chrome) |
| 20 | `pause-pending-action-pill` | UC-PAUSE-04 §A | chat-header · chat-thread (scrolled up) · pending-action-pill (floating) · composer (suppressed) |
| 21 | `chat-view-host-offline` | UC-PLATF-03 §A | chat-header · banner (offline) · chat-thread · composer (disabled Send) |
| 22 | `chat-view-dispatch-outcomes` | UC-PLATF-03 §B | banner variants stacked (unpaid + dispatch-failed) — composition demo |

---

## BUILD ORDER (proposed)

### Wave 1 — Atom gaps (1 dispatch each, parallel)
1. `radio` atom
2. `checkbox` atom
3. `icon-glyph` catalog extension (+9 lucide icons appended to the existing atom)

### Wave 2 — Core molecules (parallel batches of 3-4)
**Batch 2A** (composer):
4. `picker-trigger`
5. `composer-toolbar`
6. `composer-row`

**Batch 2B** (popover options):
7. `slash-command-option`
8. `model-picker-option`
9. `thinking-level-option`

**Batch 2C** (chrome):
10. `app-header`
11. `modal-header`
12. `code-block`
13. `banner` (4 variants — offline / unpaid / dispatch-failed / permission-denied)

**Batch 2D** (pause):
14. `pending-approval-card`
15. `approval-footer`
16. `suggested-answer-pill`
17. `pending-action-pill`

### Wave 3 — Organisms (parallel batches of 3)
**Batch 3A** (chrome):
1. `chat-header`
2. `chat-thread` (scrollable region pattern + bundles user/assistant message molecules)
3. `composer`

**Batch 3B** (popovers/sheets):
4. `slash-command-popover`
5. `picker-popover`
6. `bottom-sheet` (generic)

**Batch 3C** (pause + dialog):
7. `pause-approval-overlay`
8. `plan-review-screen`
9. `confirmation-dialog`
10. `loading-skeleton`

### Wave 4 — Views (parallel batches of 4)
22 views as listed. Realistic estimate: 6 batches × 4 = ~6 dispatch rounds.

---

## RUNTIME ESTIMATE

| Wave | Items | Approach | Est time |
|---|---|---|---|
| 1 (atom gaps) | 3 | Parallel single dispatch | 10 min |
| 2 (molecules) | 14 | 4 batches × 3-4 parallel | 45 min |
| 3 (organisms) | 10 | 3 batches × 3-4 parallel | 50 min |
| 4 (views) | 22 | 6 batches × 4 parallel | 90 min |
| **Total** | **49** | | **~3.25 hours** |

---

## DECISIONS TO CONFIRM

1. **Scope cut OK?** "Chat-view only" — sessions-list + nav surfaces (UC-NAV §A–F · UC-SESS-01 except chat-error states) are EXCLUDED. They can come in a later sprint.
2. **Atom gaps OK?** Add `radio` + `checkbox` + 9-icon extension to the existing `icon-glyph` atom.
3. **Optional-inline molecules OK?** `assistant-message-body`, `inline-code`, `confirmation-dialog-body`, `expandable-feedback-section`, `keyboard-panel` will be inlined in views rather than bottled as molecules.
4. **Banner = single molecule with 4 variants OK?** Rather than 4 separate molecules.
5. **Loading-skeleton at organism layer OK?** It's a section-level layout pattern, not a single primitive.
