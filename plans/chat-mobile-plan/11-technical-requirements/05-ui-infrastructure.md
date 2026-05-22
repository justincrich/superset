# UI Infrastructure

## Component-tree mirror to `apps/mobile/components/chat/`

Components follow AGENTS.md co-location rules (folder-per-component, barrel `index.ts`, subcomponents nest under parent's `components/`). See `12-component-organization-addendum.md` for full convention details.

In addition to the `components/chat/` tree below, **shell-level navigation components** (UC-NAV-* surfaces) live in `apps/mobile/screens/(authenticated)/(chat)/` per the project's screen co-location convention. **v2.0.0 flipped this surface from host-first to project-first** — `SelectedHostProvider`/`HostPickerSheet`/`WorkspaceSection`/`LoadMorePill`/`HostChip` are deleted; their successors are listed below:

- `SessionsListScreen/` — UC-NAV-01, UC-NAV-07, UC-NAV-08 (flat recency-sorted sessions list scoped to the selected project + FAB + search + filter sheet). Holds two pieces of in-memory state (cleared on screen exit): `searchQuery: string` and `activeFilters: { workspaceIds: string[]; statuses: SessionStatus[] }`. `FlashList` tuned with explicit `estimatedItemSize` for the two-line row and stable `keyExtractor` (`session.id`) so virtualization survives filter-set changes.
  - `components/ProjectChip/` — header project display + tap target (UC-NAV-08 trigger via `ProjectPickerSheet`). Renders as a static label (no chevron, no tap target) when the org has 1 project; renders as a tappable chip with `▾` when ≥2 projects.
  - `components/SessionSearchBar/` — header `TextInput` driving the project-scoped title filter (UC-NAV-07). Debounced query state (~100ms) feeds a memoized selector over the synced `chat_sessions` Electric collection joined to `v2_workspaces` — client-side filter only, no backend calls.
  - `components/FilterButton/` — ⚙ button to the right of the search input, opens `SessionFilterSheet` (UC-NAV-08). Renders a `·N` badge when `activeFilters` has ≥1 entry (`N = activeFilters.workspaceIds.length + activeFilters.statuses.length`).
  - `components/AppliedFilterTags/` — horizontally-scrollable row of removable chip tags below the search bar, one chip per applied workspace (`🌿 {branch} · {hostName}`) and one per applied status (`{icon} {label}`), plus a trailing `Clear ✕` affordance when ≥1 chip. Stale chips (referencing a workspace that has been tombstoned in the synced collection) silently drop on next render.
  - `components/SessionRow/` — single session row with status icon (`⌖ ⚠ ● ○`) and a two-line layout. Row truncation order: title (1 line, ellipsis), then `branch` ellipsis before `host` before `relativeTime`. TestID: `session-row-{sessionId}`.
  - `components/NewChatFab/` — floating "+" button (UC-NAV-04 trigger). TestID: `new-chat-fab`.
  - `components/SessionsEmptyState/` — UC-NAV-06 five-state renderer: no-projects, no-workspaces, no-sessions, search-no-match, filters-no-match.
- `ProjectPickerSheet/` — UC-NAV-08 surface (`@gorhom/bottom-sheet` + `BottomSheetFlatList` of `v2_projects` for the active organization). Project rows show workspace + session counts derived via `useLiveQuery` (cache-first per AGENTS.md TanStack DB rule). Renders only when the org has ≥2 projects.
- `SessionFilterSheet/` — UC-NAV-08 surface (`@gorhom/bottom-sheet` with stacked Workspace + Status multi-select sections + Clear all/Apply footer). Multi-select rows expose `accessibilityState={{ selected }}` and the sheet announces applied count via screen-reader hint on close.
- `NewChatSheet/` — UC-NAV-04 workspace-picker sheet, scoped to the selected project across all hosts; rows display `{branch} · {hostIcon} {hostName}`.
- `providers/SelectedProjectProvider/` — local state + `expo-secure-store` persistence of `selectedProjectId` keyed by `userId + organizationId`. First-launch default = project with most-recent activity, fallback to alphabetical-first. **One-time migration** on first launch post-upgrade: drop legacy `selectedHostId` from secure-store and seed `selectedProjectId` via the default-selection logic. Fallback when stored `selectedProjectId` is no longer accessible: re-run default selection + emit a brief toast.
- `hooks/useSelectedProject/` — read/write the selected project.
- `hooks/useAccessibleProjects/` — query `v2_projects` for the active organization (Electric collection).
- `hooks/useSessionsForProject/` — derived selector over `chat_sessions` + `v2_workspaces` Electric collections, scoped to the selected project + optional `activeFilters` + optional `searchQuery`. Cache-first per AGENTS.md TanStack DB rule.
- `utils/handleDeepLink/` — UC-NAV-05 routing logic invoked by the Expo notification handler. Awaits `v2_workspaces` collection readiness with a bounded timeout; on cold-launch race, falls back to a tRPC `chat.getSnapshot({ sessionId })` fetch to resolve the workspace inline before aligning `selectedProjectId` and pushing the chat route.

Plus, under the chat session route (`screens/(authenticated)/chat/[sessionId]/ChatScreen/hooks/`):
- `useChatTunnel/` — manages the lazy relay-tunnel lifecycle for the chat session route. Opens an HTTP+tRPC tunnel against `workspace.hostId` on mount; drops on unmount; drops on background; re-opens on foreground while chat is mounted. **De-duplicates concurrent opens to the same `hostId` across remounts** (single in-flight per host) to avoid flapping on rapid route transitions. Surfaces `{ status: 'connecting' | 'open' | 'error', retry }` for skeleton loader + inline retry banner UI.

**TestIDs for v2.0.0 new components** (referenced by Maestro E2E flows):
- `project-picker-chip`
- `project-picker-row-{projectId}`
- `filter-button`
- `filter-badge`
- `applied-filter-tag-workspace-{workspaceId}`
- `applied-filter-tag-status-{status}`
- `applied-filter-clear-all`
- `filter-sheet-workspace-row-{workspaceId}`
- `filter-sheet-status-row-{status}`
- `filter-sheet-apply`
- `filter-sheet-clear`
- `session-row-{sessionId}`
- `new-chat-fab`
- `tunnel-loading`
- `tunnel-error-retry`

```
components/chat/
├── ChatInterface/
│   ├── ChatInterface.tsx
│   ├── components/
│   │   ├── MessageList/
│   │   │   ├── MessageList.tsx
│   │   │   ├── components/
│   │   │   │   ├── MessagePartsRenderer/
│   │   │   │   │   ├── MessagePartsRenderer.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── UserMessage/
│   │   │   │   │   ├── UserMessage.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── AssistantMessage/
│   │   │   │   │   ├── AssistantMessage.tsx
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── MessageMarkdown/
│   │   │   │   │   │   │   ├── MessageMarkdown.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   └── ReasoningBlock/
│   │   │   │   │   │       ├── ReasoningBlock.tsx
│   │   │   │   │   │       └── index.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ToolCallBlock/
│   │   │   │   │   ├── ToolCallBlock.tsx  (collapsed-only in v2)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── PlanBlock/
│   │   │   │   │   ├── PlanBlock.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── SubagentExecutionMessage/
│   │   │   │       ├── SubagentExecutionMessage.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── useMessageSnapshot.ts
│   │   │   └── index.ts
│   │   ├── ChatInputFooter/
│   │   │   ├── ChatInputFooter.tsx
│   │   │   ├── components/
│   │   │   │   ├── TiptapPromptEditor/
│   │   │   │   │   ├── TiptapPromptEditor.tsx  (port via @10play/tentap-editor)
│   │   │   │   │   ├── SlashCommandNode.tsx    (editor extension — single file)
│   │   │   │   │   ├── FileMentionNode.tsx     (editor extension — single file)
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useTiptapEditor.ts
│   │   │   │   │   ├── utils/
│   │   │   │   │   │   └── serializeEditorToText.ts  (portable as-is)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── SlashCommandMenu/
│   │   │   │   │   ├── SlashCommandMenu.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ModelPicker/
│   │   │   │   │   ├── ModelPicker.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── PermissionModePicker/
│   │   │   │       ├── PermissionModePicker.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── usePendingQuestion.ts
│   │   │   └── index.ts
│   │   ├── PendingApprovalCard/
│   │   │   ├── PendingApprovalCard.tsx  (inline card, container parity with desktop)
│   │   │   └── index.ts
│   │   ├── PendingApprovalFooter/
│   │   │   ├── PendingApprovalFooter.tsx  (NEW — sticky thumb-docked footer)
│   │   │   └── index.ts
│   │   ├── PendingQuestionSheet/
│   │   │   ├── PendingQuestionSheet.tsx  (bottom sheet via @gorhom/bottom-sheet)
│   │   │   └── index.ts
│   │   └── PendingActionIndicator/
│   │       ├── PendingActionIndicator.tsx  (NEW — floating "Tap to respond" pill)
│   │       └── index.ts
│   ├── hooks/
│   │   └── useChatScroll.ts
│   └── index.ts
```

### Desktop mirror mapping

| Mobile path | Desktop path |
|---|---|
| `ChatInterface/ChatInterface.tsx` | `.../Chat/ChatInterface/ChatInterface.tsx` |
| `MessageList/MessageList.tsx` | `.../ChatInterface/components/MessageList/MessageList.tsx` |
| `MessagePartsRenderer/MessagePartsRenderer.tsx` | `.../components/MessagePartsRenderer/MessagePartsRenderer.tsx` |
| `UserMessage/UserMessage.tsx` | `.../UserMessage/UserMessage.tsx` |
| `AssistantMessage/AssistantMessage.tsx` | `.../AssistantMessage/AssistantMessage.tsx` |
| `ToolCallBlock/ToolCallBlock.tsx` | `.../ToolCallBlock/ToolCallBlock.tsx` |
| `PlanBlock/PlanBlock.tsx` | `.../PlanBlock/PlanBlock.tsx` |
| `ReasoningBlock/ReasoningBlock.tsx` | `.../ReasoningBlock/ReasoningBlock.tsx` |
| `SubagentExecutionMessage/SubagentExecutionMessage.tsx` | `.../SubagentExecutionMessage/SubagentExecutionMessage.tsx` |
| `ChatInputFooter/ChatInputFooter.tsx` | `.../ChatInputFooter/ChatInputFooter.tsx` |
| `TiptapPromptEditor/TiptapPromptEditor.tsx` | `.../TiptapPromptEditor/TiptapPromptEditor.tsx` |
| `TiptapPromptEditor/SlashCommandNode.tsx` | `.../TiptapPromptEditor/SlashCommandNode.tsx` |
| `TiptapPromptEditor/serializeEditorToText.ts` | `.../TiptapPromptEditor/serializeEditorToText.ts` |
| `SlashCommandMenu/SlashCommandMenu.tsx` | `.../SlashCommandMenu/SlashCommandMenu.tsx` |
| `ModelPicker/ModelPicker.tsx` | `.../ModelPicker/ModelPicker.tsx` |
| `PermissionModePicker/PermissionModePicker.tsx` | `.../PermissionModePicker/PermissionModePicker.tsx` |
| `PendingApprovalCard/PendingApprovalCard.tsx` | `.../PendingApprovalMessage/PendingApprovalMessage.tsx` |
| `PendingApprovalFooter/PendingApprovalFooter.tsx` | NEW — no desktop analog |
| `PendingQuestionSheet/PendingQuestionSheet.tsx` | `.../PendingQuestionMessage/PendingQuestionMessage.tsx` (UX adapted: inline → bottom sheet) |
| `PendingActionIndicator/PendingActionIndicator.tsx` | NEW — no desktop analog |

## Screen structure

Routes live in `app/` (thin re-exports), screen logic lives in `screens/`. Navigation config (`_layout.tsx`) stays in `app/` per the hybrid approach documented in `plans/mobile-app-structure-comparison.md`.

```
app/(authenticated)/chat/
├── _layout.tsx                          # Stack layout config — STAYS IN APP
└── [sessionId]/
    ├── index.tsx                        # export { default } from "@/screens/..."
    └── plan-review/
        └── [planId].tsx                 # export { default } from "@/screens/..."

screens/(authenticated)/chat/[sessionId]/
├── ChatScreen/
│   ├── ChatScreen.tsx                   # Main chat screen
│   ├── components/
│   │   └── ChatHeader/
│   │       ├── ChatHeader.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useSessionResume.ts          # Reconnect/cursor protocol (UC-PLATF-02)
│   │   └── useChatNavigation.ts
│   └── index.ts
└── plan-review/
    └── [planId]/
        ├── PlanReviewScreen.tsx         # Full-screen plan approval (UC-PAUSE-03)
        └── index.ts
```

## Lib structure

```
lib/
├── host-service-client.ts               # HTTP+tRPC client against host-service via relay
├── collections/
│   ├── collections.ts                   # MODIFY — add chat_sessions Electric collection
│   └── index.ts
└── push-notifications/
    ├── token.ts                         # Expo push token registration
    ├── handlers.ts                      # Foreground/background notification handling
    └── index.ts
```

## Design tokens

**Path A committed 2026-05-22 — see [`14-token-migration-audit.md`](../14-token-migration-audit.md) for the full migration scope.** Mobile migrates from React Native Reusables cool-neutral (HSL 240 hues) to the desktop ember warm palette as canonical, sourced from `designs/tokens/tokens.css` at the worktree root. Sprint 01 Phase 0 rewrites `apps/mobile/global.css` + `apps/mobile/lib/theme.ts`; ~120 new token keys are introduced (status palette, spacing role aliases, typography scale, motion durations, elevation, surface/text/border variants, mobile chrome geometry, domain chat tokens).

The pre-migration `global.css` exposed only 20 flat semantic color tokens (`--color-background`, `--color-foreground`, …, `--color-ring`, `--radius`) under `@variant light` and `@variant dark`. Post-migration retains the flat-name convention (Path A) for rn-reusables CLI compatibility, with values flipped to ember and the additional 120 keys layered in.

Cross-app brand alignment (mobile ↔ desktop) is RESOLVED as part of Phase 0.

## Tailwind class translation rules (from design audit)

| Desktop pattern | Mobile substitute |
|---|---|
| `space-y-N` | `gap-N` on a `flex-col View` |
| `transition-colors`, `transition-opacity`, `transition-transform`, `duration-*`, `ease-*` | Reanimated `useAnimatedStyle` / `withTiming` / `FadeIn`/`FadeOut` |
| `hover:*` | `active:*` or `Platform.select({ web: 'hover:...' })` (skip web on RN) |
| `focus-visible:*`, `outline-none` | Platform.select web; skip on native |
| `dark:foo` prefix | `@variant dark { --color-foo: ... }` in `global.css` |
| `group-hover:*`, `group-data-[...]:*` | Reanimated shared values + conditional render |
| `whitespace-pre-wrap`, `select-text` | RN `Text` with `selectable` prop |
| `var(--radix-popover-trigger-width)` | Measure via `onLayout` |
| `[&_complex_selector]` | Per-element components |
| `max-w-[calc(100vw-2rem)]` | `Dimensions.get('window').width - 32` |
| `streamdown` markdown | `react-native-markdown-display` (or alternative) |

## Hit targets

All interactive controls in pause sheets (UC-PAUSE-01/02/03 actions) and composer toolbar (model/thinking/permission pickers, Send/Stop) MUST be at least 44pt tall to meet WCAG mobile guidelines. Desktop's `py-1 px-2` (8pt) is below threshold; mobile equivalents use `h-11` minimum.
