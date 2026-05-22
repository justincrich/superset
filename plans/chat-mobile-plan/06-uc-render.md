---
stability: FEATURE_SPEC
last_validated: 2026-05-22
prd_version: 2.0.1
functional_group: RENDER
---

# Use Cases: Message Rendering (RENDER)

| ID | Title | Description |
|----|-------|-------------|
| UC-RENDER-01 | Render user and assistant messages | System displays user and assistant message bubbles with text content, role-styled alignment, and timestamps. |
| UC-RENDER-02 | Render streaming assistant text | System displays assistant text as it arrives, with atomic snapshot updates via periodic polling (matching desktop's polling pattern). |
| UC-RENDER-03 | Render markdown content | System renders markdown elements (code blocks, lists, links, tables, inline code) inside assistant messages. |
| UC-RENDER-04 | Render tool call blocks (collapsed) | System renders agent tool calls as collapsed cards showing tool name and status; expansion deferred to a future mobile-chat PRD. |
| UC-RENDER-05 | Render plan blocks and reasoning blocks | System renders agent plan blocks (read-only) and reasoning blocks (collapsed extended-thinking) inside the message list. |
| UC-RENDER-06 | Render subagent execution as nested group | System displays subagent runs as a nested read-only message group within the parent turn. |
| UC-RENDER-07 | Auto-scroll and scroll-back affordance | System keeps the list anchored to the latest message and provides a scroll-back button when the user scrolls up. |

---

## UC-RENDER-01: Render user and assistant messages

User and assistant messages are rendered in a `@shopify/flash-list` (inverted) with role-styled bubbles. User messages are right-aligned with `bg-secondary`-style background and capped at `max-w-[85%]`. Assistant messages are left-aligned and full-width, no bubble background. Both render via component-named ports of desktop's `UserMessage` and `AssistantMessage` (`apps/mobile/components/chat/UserMessage/`, `AssistantMessage/`).

### Wireframes

#### A. Message list — user + assistant + streaming

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│                                      │
│         ┌──────────────────────────┐ │
│         │ Can you refactor billing │ │  ← UserMessage, right-aligned
│         │ to use tRPC?             │ │     max-w-[85%], bg-secondary
│         │                    9:41  │ │
│         └──────────────────────────┘ │
│                                      │
│ Sure! Here's how I'd approach the    │  ← AssistantMessage, left-aligned
│ refactor:                            │     full-width, no bubble bg
│                                      │
│ 1. Move the billing router to…       │
│                                      │
│ The key change is replacing the      │
│ REST calls with tRPC mutations▌      │  ← ▌ blinking cursor (streaming)
│                                      │
├──────────────────────────────────────┤
│ [Sonnet 4.6] [⚡ low] [🔐 default]   │
│ ┌────────────────────────────────┐   │
│ │  Type a message…        [ ■ ] │   │  ← Stop visible; turn streaming
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

Caption: Both message roles in context. User bubble is right-aligned with `bg-secondary` and capped at `max-w-[85%]`; assistant text is full-width and unstyled. Blinking cursor `▌` appears at the end of the streaming assistant message (covers UC-RENDER-02 visually). The composer shows the Stop button per UC-COMP-03 §A.

**Acceptance Criteria:**
- ☐ User can see their submitted messages rendered right-aligned with a styled bubble background on the chat view
- ☐ User can see assistant messages rendered left-aligned, full-width, with no bubble background
- ☐ System caps user message width at `max-w-[85%]` so a margin is visible on the trailing edge
- ☐ System renders each message via the mobile `UserMessage` or `AssistantMessage` component in `apps/mobile/components/chat/`
- ☐ User can long-press a message to copy its text content to the clipboard

---

## UC-RENDER-02: Render streaming assistant text

While a turn is streaming, the assistant message's text content updates as each new snapshot arrives. Desktop achieves this via periodic polling (`refetchInterval` at ~4 FPS against `getDisplayState` + `listMessages` in `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts`). Mobile mirrors this polling pattern — atomic per-snapshot text replacement at a tunable interval (see TRD §"Open technical sub-decisions" for interval choice). An optional Reanimated blinking-cursor effect indicates active streaming.

### Wireframes

Visual surface is the streaming-cursor state shown in UC-RENDER-01 §A (the `▌` cursor at the end of the assistant message during an active turn). Snapshot replacement is behavioral — atomic per-snapshot text replacement with no layout jump — and is not separately wireframed.

**Acceptance Criteria:**
- ☐ User can see assistant message text update as each new snapshot arrives during a streaming turn
- ☐ System updates the assistant message text atomically per snapshot without character-by-character animation
- ☐ User can see a blinking-cursor visual affordance at the end of the streaming text while the turn is active
- ☐ System removes the cursor affordance and finalizes the message text when the streaming turn completes
- ☐ User can see the streaming message remain in place (no layout jump) when the host emits a new snapshot

---

## UC-RENDER-03: Render markdown content

Assistant messages frequently contain markdown. Desktop uses `streamdown` (web-only); mobile uses an RN markdown renderer (`react-native-markdown-display` or equivalent native lib). Supported elements: paragraphs, headings, lists (ordered + unordered), code blocks with syntax highlighting (via `react-native-syntax-highlighter` or similar), inline code, links (open in OS browser on tap), tables (basic), blockquotes, horizontal rules.

### Wireframes

#### A. Code block and inline code in assistant message

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

Caption: Code block with language label and long-press copy affordance. Inline code renders with contrasting background monospace. Long-press on the block copies the full content.

**Acceptance Criteria:**
- ☐ User can see paragraphs, headings, ordered lists, unordered lists, blockquotes, and horizontal rules rendered in assistant messages
- ☐ User can see code blocks rendered with monospace font, dark background, and syntax-highlight coloring
- ☐ User can see inline code rendered with a contrasting background and monospace font
- ☐ User can tap a markdown link in an assistant message to open it in the OS browser
- ☐ System renders basic tables with column borders and aligned cells inside assistant messages
- ☐ User can long-press a code block to copy its full content to the clipboard

---

## UC-RENDER-04: Render tool call blocks (collapsed)

When the agent invokes a tool, it appears in the message stream as a collapsed `ToolCallBlock`-styled card showing the tool name, status indicator (running / completed / failed), and a chevron. Mobile-chat v2 ships collapsed-only — expansion to view arguments/result is deferred. The component is named `ToolCallBlock` to match desktop's component tree.

### Wireframes

#### A. Tool call — three status states

```
│ ┌─────────────────────────────────┐   │
│ │ ⚙ bash                    ›    │   │  ← running; spinner implicit in ⚙
│ │   run_tests.sh                  │   │     chevron › = collapsed
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ ✓ bash                    ›    │   │  ← completed; ✓ = success
│ │   run_tests.sh                  │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ ⚠ bash                    ›    │   │  ← failed; ⚠ ← --color-destructive
│ │   run_tests.sh                  │   │
│ └─────────────────────────────────┘   │
```

Caption: All three `ToolCallBlock` status states in collapsed view. The chevron (›) always points right in v2; expansion is deferred per the UC body. Mirrors desktop `ToolCallBlock` naming.

**Acceptance Criteria:**
- ☐ User can see each tool call rendered as a collapsed card in the message list with tool name and status indicator
- ☐ User can see a status indicator showing running, completed, or failed state per the tool call lifecycle
- ☐ User can see the chevron pointing right (collapsed state) on tool call cards for mobile-chat v2
- ☐ System renders the tool call component at `apps/mobile/components/chat/ToolCallBlock/` with name parity to desktop
- ☐ System does NOT render an expansion UI for tool call arguments or result in mobile-chat v2 (deferred to a follow-up PRD)

---

## UC-RENDER-05: Render plan blocks and reasoning blocks

Plan blocks (`PlanBlock` per desktop naming) render the agent's proposed structured plan as a read-only card with the plan title and a collapsed steps list. Reasoning blocks (`ReasoningBlock` per desktop naming) render extended-thinking content in a collapsed-by-default container with a "Show reasoning" affordance. Neither is interactive in mobile-chat v2 beyond toggle expand/collapse.

### Wireframes

#### A. PlanBlock collapsed and expanded + ReasoningBlock collapsed

```
│ ┌─────────────────────────────────┐   │
│ │ 📦 Plan: Refactor billing  ∨   │   │  ← collapsed; ∨ = tap to expand
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 📦 Plan: Refactor billing  ∧   │   │  ← expanded; ∧ = tap to collapse
│ │ ─────────────────────────────── │   │
│ │  1. Extract billing router      │   │
│ │  2. Add tRPC procedures         │   │
│ │  3. Migrate REST endpoints      │   │
│ │  4. Update tests                │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 💭 Show reasoning          ∨   │   │  ← ReasoningBlock collapsed default
│ └─────────────────────────────────┘   │
```

Caption: `PlanBlock` in collapsed and expanded states. `ReasoningBlock` ships collapsed by default with "Show reasoning" label; expansion mirrors the PlanBlock toggle. Plans submitted via `submit_plan` open in the full-screen modal defined in UC-PAUSE-03 §A — this read-only block is the post-decision rendering once the plan has been approved/rejected.

**Acceptance Criteria:**
- ☐ User can see plan blocks rendered as cards with the plan title and a collapsed list of steps in the message stream
- ☐ User can tap a plan block to expand it and see the full steps list
- ☐ User can see reasoning blocks rendered collapsed with a "Show reasoning" affordance and an icon indicating extended thinking
- ☐ User can tap a reasoning block to expand its content and tap again to collapse
- ☐ System renders these components at `apps/mobile/components/chat/PlanBlock/` and `ReasoningBlock/` matching desktop names

---

## UC-RENDER-06: Render subagent execution as nested group

When a subagent runs inside the main turn, its events render as a nested group with visual indentation or a distinct container, matching desktop's `SubagentExecutionMessage` treatment. Mobile renders subagents read-only — users cannot interact with them directly (consistent with desktop).

### Wireframes

#### A. Nested subagent execution group

```
│ Running sub-task via agent…           │  ← parent turn text
│                                       │
│  ┊ ┌───────────────────────────────┐  │
│  ┊ │ ⚙ subagent: fix-tests        │  │  ← visual indent (┊ = left gutter)
│  ┊ │   ┌────────────────────────┐  │  │
│  ┊ │   │ ✓ bash run_tests.sh   │  │  │  ← nested ToolCallBlock
│  ┊ │   └────────────────────────┘  │  │
│  ┊ │   All 42 tests passing.       │  │  ← subagent assistant text
│  ┊ └───────────────────────────────┘  │
│                                       │
│ Sub-task complete. Continuing…        │  ← parent turn resumes
```

Caption: Subagent execution renders as a visually indented group using a left gutter marker (┊). Inner tool calls reuse `ToolCallBlock` from UC-RENDER-04 §A. Mirrors desktop `SubagentExecutionMessage` naming and read-only semantics.

**Acceptance Criteria:**
- ☐ User can see a subagent execution rendered as a visually nested group inside the parent assistant turn
- ☐ User can see the subagent's tool calls and text content rendered using the same `ToolCallBlock` and message components
- ☐ System indents or otherwise visually distinguishes the subagent group from the parent turn content
- ☐ System renders the component at `apps/mobile/components/chat/SubagentExecutionMessage/` with name parity to desktop

---

## UC-RENDER-07: Auto-scroll and scroll-back affordance

The message list (FlashList `inverted` or `maintainVisibleContentPosition`) keeps the view anchored to the most recent message. If the user scrolls up to read history, a floating "scroll to bottom" button appears with a Reanimated fade-in; tapping it returns the list to the latest message and the button fades out.

### Wireframes

#### A. Scroll-back button visible

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│  [older messages visible]            │
│                                      │
│  Aug 12, 2025  ─────────────────     │  ← user has scrolled up
│                                      │
│  User: Can you refactor billing?     │
│                                      │
│                      ┌────────────┐  │
│                      │ ↓ Latest  │  │  ← scroll-back FAB, Reanimated FadeIn
│                      └────────────┘  │
├──────────────────────────────────────┤
│ ┌──────────────────────────────── ┐  │
│ │  Type a message…         [ ▶ ] │  │
│ └──────────────────────────────── ┘  │
└──────────────────────────────────────┘
```

Caption: Floating "↓ Latest" button appears with Reanimated `FadeIn` when the user scrolls away from the bottom. Positioned above the composer, trailing edge. Fades out on tap or when the list returns to the bottom.

**Acceptance Criteria:**
- ☐ System keeps the message list scrolled to the most recent message when new messages arrive and the user is at the bottom
- ☐ System does NOT auto-scroll when the user has manually scrolled up to read older messages
- ☐ User can see a floating "scroll to bottom" button appear with fade animation when scrolled away from the bottom
- ☐ User can tap the scroll-back button to return the list to the latest message
- ☐ System uses Reanimated for the scroll-back button's appearance and disappearance animation
- ☐ System uses `@shopify/flash-list` for the message list to handle long histories without frame drops
