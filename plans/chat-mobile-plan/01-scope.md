---
stability: FEATURE_SPEC
last_validated: 2026-05-22
prd_version: 2.0.0
scope_posture: full
---

# Mobile Chat v2 — Scope

## Scope Posture

**Full feature** (kb-prd-plan default). Mobile-chat v2 ships a complete, polished mobile chat experience scoped to read/respond/initiate on remote-or-cloud hosts. Features that build *on top of* chat (attachments, file mentions, linked tasks) belong to separate downstream PRDs and are explicitly deferred below.

## In Scope

- **Chat tab in mobile bottom navigation** as a new top-level surface alongside the existing Tasks and More tabs. The legacy `(home)/workspaces` tab is a stub and is intentionally omitted from the sessions-list footer wireframe; downstream sprint planning will decide whether to formally hide or delete the Home tab from `apps/mobile`. Default landing is a sessions list; see UC-NAV-01.
- **Project-first sessions list** with a header **project chip** displaying the currently-selected project (`📦 {projectName} ▾`). The chip is tappable (opens a `@gorhom/bottom-sheet` project picker listing accessible `v2_projects` for the active organization, with workspace + session counts) when the org has ≥2 projects, and renders as a static label (no chevron, no tap target) when the org has exactly 1 project. Selected project persisted locally in `expo-secure-store` keyed by `(userId, organizationId)`. First-launch default = project with most-recent activity, fallback to alphabetical-first. One-time migration on first launch post-upgrade drops any legacy `selectedHostId` and seeds `selectedProjectId`. See UC-NAV-01, UC-NAV-08.
- **Flat, recency-sorted sessions list** scoped to the selected project, sorted by `lastActiveAt` descending across all workspaces in the project. Workspace is rendered as inline row metadata (`🌿 {branch} · {hostIcon} {hostName} · {relativeTime}`), never as a section header. No sticky headers, no per-section pagination, no per-workspace caps. `FlashList` virtualization with explicit `estimatedItemSize` and stable `keyExtractor`. Row truncation order on overflow: title (1 line, ellipsis) → branch ellipsis → host → time. See UC-NAV-01.
- **Filter sessions by workspace and/or status** via a ⚙ button next to the search input that opens a `@gorhom/bottom-sheet` (`SessionFilterSheet`) with two stacked multi-select sections: Workspaces (rows enumerate `v2_workspaces` for the selected project as `{branch} · {hostIcon} {hostName}` so duplicates across hosts are disambiguated) and Status (`⌖ Streaming`, `⚠ Pause pending`, `● Idle`). Applied filters render as a horizontally-scrollable row of removable chip tags below the search bar, with a `·N` badge on the filter button. Workspace-axis OR-within-axis, status-axis OR-within-axis, cross-axis AND. Filter state is in-memory only (clears on screen exit). Stale workspace chips (referencing tombstoned rows) silently drop on next render. See UC-NAV-08.
- **Cross-workspace title search** scoped to the selected project via a `TextInput` in the sessions-list header. Case-insensitive substring match on `chat_sessions.title` across every workspace in the selected project; host appears only as row metadata, never as a filter axis. Search composes with active filter chips via AND. Filter runs client-side over the synced Electric collection — no new backend. See UC-NAV-07.
- **Floating "+" action button** opens a workspace-picker bottom sheet listing workspaces in the **currently-selected project** (`v2_workspaces` filtered by `projectId` + `organizationId`) across all hosts. Each row shows `{branch} · {hostIcon} {hostName}` so the user picks both branch and host in one tap. Selecting one creates a session via `chat.createSession` and routes into the empty chat view, where `useChatTunnel` opens the lazy relay tunnel against `workspace.hostId`. See UC-NAV-04.
- **Push-notification deep-linking** aligns the selected project to the session's `workspace.projectId` before routing to `(chat)/[sessionId]`. A bounded readiness gate awaits `v2_workspaces` collection sync; if the workspace row isn't synced by timeout (cold-launch race), the deep-link handler falls back to a tRPC `chat.getSnapshot({ sessionId })` fetch to resolve the workspace inline. Tunnel opens lazily on chat-route mount; chat view shows a skeleton loader during the handshake and an inline retry banner on failure. Active pauses open the corresponding UC-PAUSE container immediately after tunnel-open succeeds. See UC-NAV-05.
- **Empty-state handling** for five distinct conditions: no projects (copy directing to create on desktop, project chip omitted), no workspaces in selected project (project chip retained for switching, FAB hidden), no sessions in selected project (FAB emphasized + "Start your first chat" copy), search no-match (copy referencing the query, "Clear search" affordance), and filters no-match ("No sessions match the active filters", "Clear filters" affordance removing every chip). See UC-NAV-06.
- **Lazy tunnel lifecycle** managed by a new `useChatTunnel` hook on the chat-route. No tunnels open from the sessions-list screen (the list is fed entirely by the Electric collection, no relay needed). On chat-route mount the hook opens an HTTP+tRPC tunnel against `workspace.hostId`; on unmount it drops the tunnel; on app background it drops; on foreground re-entry while chat is mounted it re-opens and triggers `useSessionResume`. The hook de-duplicates concurrent opens to the same `hostId` across remounts to avoid flapping on rapid route transitions. Surfaces `{ status, retry }` for the skeleton + retry UI.
- **Session listing via existing ElectricSQL `chat_sessions` shape** (already published at `apps/electric-proxy/src/where.ts:136-137`, org-scoped — **no shape changes required**), filtered client-side by `selectedProjectId` (via `workspace.projectId` from the synced `v2_workspaces` collection) plus any active workspace/status filter chips and search query, ordered by `lastActiveAt` descending across all workspaces in the project (no sectioning). `useLiveQuery` joins are cache-first per AGENTS.md TanStack DB rule — render persisted rows even while `isReady` is false.
- **Session lifecycle**: start a new session, resume an existing one, end (dispose) a session, delete a session permanently with confirmation, rename a session title.
- **Auto-generated session titles** after first turn (host-service handles generation; mobile renders the synced value).
- **Message composition**: multiline text input via Tiptap (`@10play/tentap-editor`) for parity with desktop's slash-command and file-mention rendering.
- **Slash commands**: type `/` to open a popover with available commands from `chat.getSlashCommands`, preview expansion via `chat.previewSlashCommand`, resolve via `chat.resolveSlashCommand`. Mobile-friendly popover, not inline autocomplete.
- **Send / stop**: submit a message via `chat.sendMessage`, see optimistic append, stop a running turn via `chat.stop`.
- **Composer controls**: model picker (from `chat.getModels`), thinking-level picker (`off | low | medium | high | xhigh`), permission-mode picker — all rendered as `@rn-primitives/popover` panels.
- **Message rendering**: user messages (text), assistant messages (streaming text + parts), markdown (code blocks, lists, links, tables, inline code via `react-native-markdown-display` or equivalent), tool call blocks (collapsed by default), plan blocks (read-only render), reasoning blocks (collapsed extended-thinking), subagent execution (nested read-only group).
- **List virtualization** via `@shopify/flash-list` for histories ≥50 messages.
- **Auto-scroll to bottom + scroll-back affordance** using FlashList `inverted` or `maintainVisibleContentPosition`, with a Reanimated-faded scroll-back button.
- **Mid-turn interactive prompts** with container chosen per interaction shape (see UC-PAUSE-* and the Design Rationale section in `07-uc-pause.md` for the full evidence trail):
  - **Tool approval** → **inline card in the message stream + sticky thumb-docked action footer** (Approve / Decline / Always-allow-category). Queues 1-of-N when multiple approvals are pending. Mirrors Continue.dev's developer-tool chat pattern; preserves conversation context for frequent decisions. → `chat.respondToApproval`
  - **`ask_user` question** → **bottom sheet** (`@gorhom/bottom-sheet` with `BottomSheetTextInput`) for freeform answer + optional suggested-pill prefills. Keyboard handling is the decisive factor. → `chat.respondToQuestion`
  - **Plan approval** → **full-screen modal as a pushed expo-router route** (`/chat/[sessionId]/plan-review/[planId]`). Plan markdown gets full vertical scroll with docked Approve/Reject buttons; matches Apple HIG's recommendation of full-screen modals for "in-depth content or a task that involves multiple steps." → `chat.respondToPlan`
- **Pending-action indicator** (`PendingActionIndicator`): floating "Tap to respond" pill near the chat input that surfaces when a session has an active pause and the user has scrolled away from the inline card OR dismissed the sheet/modal without responding. Tapping it returns the user to the relevant container.
- **Multi-device session sync**: a session created on desktop or via Slack agent appears in mobile's session list in realtime (via `chat_sessions` Electric shape).
- **Push notifications** (Expo push, **v2 minimal scope**) delivered through a relay-side fanout: host-service pushes a new outbound `push:lifecycle` message on its existing tunnel WS to `apps/relay`; relay calls Expo Push API against registered tokens. Mobile registers/de-registers push tokens via new endpoints on `apps/relay` using the same JWT bearer it already uses for chat tRPC; tokens stored in Upstash KV (relay's existing infra). Two events fan out: `Stop` (turn complete) and `PermissionRequest` (any of the three PAUSE shapes collapses to one event per `packages/host-service/src/events/map-event-type.ts`). Permission flow follows Expo best practices (custom pre-prompt before the OS dialog, re-check on every cold launch, deny → "Re-enable in Settings"). Foreground suppression is local-only: `expo-notifications.setNotificationHandler` swallows the banner when the user is already on the matching `/(chat)/[sessionId]` route. Tap-to-open routing is specified by UC-NAV-05; wire-level design in `11-technical-requirements/07-notifications.md`.
- **Host-offline UX**: clear UI state when the user's host-service is unreachable; automatic reconnect when host returns.
- **Session resume after background/foreground**: app catches up missed events using `stream-next-offset` / cursor protocol on resume.
- **Authentication via JWT bearer** routed through the relay; mobile mints / refreshes per the chosen sub-decision (see TRD).
- **Component tree at `apps/mobile/components/chat/`** mirroring desktop component names (ChatInterface, MessageList, MessagePartsRenderer, UserMessage, AssistantMessage, ThinkingMessage, PendingApprovalMessage, PendingQuestionMessage, PendingPlanApprovalMessage, ToolCallBlock, ChatInputFooter, ModelPicker, SlashCommandMenu).
- **Tailwind/uniwind design parity** for the ~80% of desktop chat classes that compile under uniwind; mechanical translations applied per the design audit (`space-y-* → gap-*`, `transition-* → Reanimated`, `hover:* → active:*`, `dark:* → @variant dark` tokens).
- **Testing infrastructure** (see `13-testing-strategy.md`): Storybook 9 under a custom root toggle (`EXPO_PUBLIC_STORYBOOK=true`) with build-time stripping for production; Maestro for YAML-based E2E flows against the running app; Bun test for shared logic unit tests.
- **Storybook stories required for every chat UI component**, co-located as `ComponentName.stories.tsx`, covering all states (loading, empty, error, streaming, paused, etc.). Stories enable **isolated UI testing prior to service integration** — ensuring UI fidelity against design tokens and component contracts before any backend wiring begins. Atomic composition (one component + its stories at a time) ensures speed and accuracy during the build phase.
- **Maestro E2E flows required for every user-facing UC**, co-located in `.maestro/` named by UC ID. Each service-wiring sprint's gate is defined by its Maestro flows passing.

## Out of Scope

Each item below is tagged `[DEFERRED: separate PRD]` (could ship later as its own initiative) or `[NOT SUPPORTED]` (architectural/product decision; will not ship in any subsequent PRD without changing this assumption). Every item carries a one-sentence **Why** grounded in the conversation that produced this PRD.

- **Attachments — file picker, image picker, drag-drop, paste-image** — `[DEFERRED: separate PRD]`. Desktop's `ChatInputDropZone`, `FileDropOverlay`, `useDocumentDrag`, and the Plus-menu attach flows are excluded.
  **Why:** The user's scope statement was explicit — "allow sending messages for remote/cloud work" — text only. Attachments require `expo-document-picker` + `expo-image-picker` + the upload-to-`chat_attachments` flow. Adding them would push mobile-chat v2 over a single shippable initiative; better to validate the text-message platform end-to-end first.

- **File mentions** (`@src/foo.ts` autocomplete from the host's workspace file tree) — `[DEFERRED: separate PRD]`. The Tiptap node infrastructure is included via `tentap-editor` so a future mobile-chat PRD can layer this on without re-platforming.
  **Why:** Two reasons. (1) The host runs on a remote/cloud machine — mobile users don't carry a working mental map of that host's FS, so file-mentions are inherently less useful on mobile than desktop. (2) Implementing them requires the host file-search autocomplete UI + `FileMentionNode` port — meaningful work beyond mobile-chat v2's "list / read / send" scope. Better to ship the Tiptap shell first and confirm WebView perf before extending it.

- **User mentions** (`@username` for team contexts) — `[DEFERRED: separate PRD]`.
  **Why:** Mentions depend on team-membership infrastructure (`members` table + a mobile-side directory) that may not even exist yet on mobile. Mobile-chat v2 shouldn't block on cross-cutting team features whose timing it can't control.

- **Linked issues / linked tasks** (Linear ticket attachment in chat input, `LinkedIssuePill`, `IssueLinkCommand`) — `[DEFERRED: separate PRD]`.
  **Why:** Linear integration is a separate cross-cutting capability requiring Linear OAuth + ticket-search UI on mobile. It's a power-user convenience layered on top of chat, not a prerequisite for the "list / read / send" loop. Defer until the base mobile-chat v2 surface is validated.

- **Plus menu and overflow actions** — `[DEFERRED: separate PRD]`.
  **Why:** Desktop's Plus menu primarily exposes attachment-related actions (file attach, image upload, drag-drop alternatives). Since attachments are out of mobile-chat v2, shipping the Plus menu would produce a half-empty UI surface. Bring it back when the items inside it are also ready.

- **Restart-from-message** (branch a conversation from a prior message) — `[DEFERRED: separate PRD]`. Host-service procedure `chat.restartFromMessage` already exists.
  **Why:** Power-user feature outside the user's explicit "list / read / send" scope. Backend is ready; the mobile-chat v2 deferral is purely a UI port that can drop into a future PRD without touching the host.

- **Edit-last-user-message** (re-send a different message) — `[DEFERRED: separate PRD]`.
  **Why:** Same power-user category as restart-from-message. Also introduces non-trivial UX questions (in-place edit vs re-send a new message; how to represent edits in the wire-format history) that don't pay off until base mobile-chat v2 ships and users actually ask for the feature.

- **MCP overview** (which MCP servers and tools are wired into this session) — `[DEFERRED: separate PRD]`.
  **Why:** Read-only diagnostic surface. Not in stated scope and not blocking any of the in-scope use cases. Adds a settings/picker screen with limited mobile-specific value; easy to graft on later.

- **Local chat code execution on the mobile device** — `[NOT SUPPORTED]`.
  **Why:** The user's scope statement was emphatic — "allow sending messages for remote/cloud work (**not local code on mobile device**)". The mobile device doesn't run a host-service; mobile chat REQUIRES a reachable remote or cloud host. This is a stated product boundary, not a deferral, and it will not be revisited in a follow-up PRD.

- **Rich text formatting in composed messages** (bold, italic, lists, headings) — `[NOT SUPPORTED]`.
  **Why:** Desktop's Tiptap prompt editor doesn't expose these either — desktop chat input is plain text + atomic slash-command and file-mention tokens, nothing more. The wire format passed to the agent doesn't carry rich text. Adding rich-text formatting on mobile would be a UX divergence from desktop with zero functional value for the agent loop.

- **Multi-keystroke shortcuts** (Cmd+Enter to send, Cmd+K for command palette, etc.) — `[NOT SUPPORTED]`.
  **Why:** Mobile OSes don't have a Cmd/Ctrl modifier key model. Mobile uses on-screen Send button plus the iOS/Android keyboard's "send" affordance. This is platform-structural, not deferred.

- **Pure-Electric message persistence** (mirror host runtime memory into a new `chat_messages` table for shape-based sync) — `[DEFERRED: separate PRD]`.
  **Why:** Architecture research (`plans/20260521-mobile-chat-research.md` on `local-setup-no-env`) confirmed messages currently live only in host runtime memory — no `chat_messages` table, no `messages` JSON column. Persisting them is a large cross-cutting schema + dual-write change that mobile-chat v2 doesn't need to block on; messages can be read via relay-routed tRPC instead. If host-side persistence ships later in a separate workstream, mobile-chat v2 can swap to a shape-based read path without touching its UI tree.

- **Cross-platform UI component library** (a shared `packages/chat-ui` consumed by both web/desktop and mobile) — `[NOT SUPPORTED]`.
  **Why:** Validated against the `cadra-app/monorepo` reference (private repo, accessed via `gh` CLI 2026-05-21): web shadcn components and React Native primitives are fundamentally incompatible at the JSX layer — Radix vs `@rn-primitives`, `<div>` vs `<View>`. Cadra ships parallel implementations with name + Tailwind parity, zero shared code at the UI layer, after explicit consideration of the alternative. Shared design tokens via Tailwind class names is the correct boundary; shared JSX is not.

- **Real-time tRPC subscriptions for chat** — `[NOT SUPPORTED]` in mobile-chat v2; superseded by streaming sub-decision.
  **Why:** Repo-wide grep (research finding) confirmed zero tRPC subscriptions in the chat path today. Mobile-chat v2 reads via request/response tRPC (with cursor protocol for resume) and defers live-token streaming to a sub-decision in technical requirements §"Open technical sub-decisions" (SSE-through-relay vs cloud DurableStreams vs polling). Adopting tRPC subscriptions would require infrastructure changes outside this PRD's scope.

- **Attachment payload UI in messages (file chips, image previews, link cards)** — `[DEFERRED: separate PRD]`.
  **Why:** Consequence of the attachments deferral above. The host-service `chat_attachments` table is read-only to mobile, but rendering attachment payloads in user/assistant messages introduces media-handling, image-caching, and download flows that don't pay off until users can also upload attachments. Pair the render with the send.

- **Notification preferences (mute, ringtone, custom sound, volume)** — `[DEFERRED: separate PRD]`. Desktop ships these via `local-db` settings (`notificationVolume`, `notificationSoundsMuted`, `selectedRingtoneId`, custom ringtone file path); mobile-chat v2 uses default OS-provided sound only.
  **Why:** v2 minimal posture — push delivery is the foundational capability; preferences ride on top once we have a stable register/deliver/tap loop. Adding a settings surface, persistence schema, and a ringtone picker UI doubles the surface for an MVP we still need to validate end-to-end.

- **iOS Time-Sensitive interruption level + entitlement** — `[DEFERRED: separate PRD]`.
  **Why:** Time-Sensitive (iOS 15+) bypasses Focus modes for `PermissionRequest` (pause) events and is genuinely valuable, but it requires the `com.apple.developer.usernotifications.time-sensitive` entitlement, EAS-side credential configuration, and per-notification `interruptionLevel` plumbing. v2 minimal uses the default `active` level on both platforms.

- **iOS interactive notification action buttons** (Approve / Decline from lock screen) — `[DEFERRED: separate PRD]`.
  **Why:** Notification actions would let users resolve a `PermissionRequest` without opening the app, but they require notification categories declared at app startup, action handlers in the foreground/background notification response handler, and a relay-side response-without-app-foreground path. Worthwhile follow-up; out of v2 minimal.

- **Per-workspace / per-host notification preferences** — `[DEFERRED: separate PRD]`.
  **Why:** v2 minimal has no preferences at all — adding per-host or per-workspace toggles compounds the deferred preferences UI. Useful when users have many active hosts and want quieter notifications from some.

- **In-app activity center mirroring desktop's `V2NotificationStatusIndicator`** — `[DEFERRED: separate PRD]`. Desktop's sidebar status indicator surfaces "this workspace had recent agent activity even though you weren't watching."
  **Why:** Mobile-chat v2 relies on `chat_sessions.lastActiveAt`-ordered list ordering + OS push notifications + the session-row status icons defined in `09-uc-nav.md` UC-NAV-01. A dedicated in-app activity surface is duplicative until users tell us list-ordering isn't enough.

- **Server-side presence tracking for push suppression** — `[NOT SUPPORTED]` in mobile-chat v2.
  **Why:** Desktop suppresses notifications locally based on the focused pane (`shouldSuppressForVisiblePane` in `apps/desktop/src/main/lib/notifications/notification-manager.ts`). Mobile v2 mirrors that locally via `expo-notifications.setNotificationHandler` route-checking. Building server-side presence (mobile pings relay on session open / close, relay skips push if "active") adds a heartbeat protocol + a presence cache for marginal benefit when local-only suppression already covers the common case.

- **Universal Links / App Links** (`apple-app-site-association`, `assetlinks.json` hosted at `app.superset.sh`) — `[DEFERRED: separate PRD]`.
  **Why:** Universal Links would let `https://app.superset.sh/chat/{sessionId}` URLs from email/Slack/web open the mobile app directly. v2 ships with custom scheme `superset://` only — sufficient for tap-from-notification (the in-scope path) and avoids the DNS + EAS-credential + entitlement work needed for Universal Links.

- **Notification grouping / threading** (iOS thread identifiers, Android `groupSummary`) — `[DEFERRED: separate PRD]`.
  **Why:** Multiple notifications for the same session or workspace would collapse into a thread; multiple sessions could group by workspace. Nice quality-of-life when users see notification spikes, but v2 minimal uses default unrelated stacking — server-side dedup by `sessionId` already prevents most duplication noise.

- **App-icon badge with unread count** — `[DEFERRED: separate PRD]`.
  **Why:** Requires tracking "unread" state somewhere — either mobile-local (every notification increments, every tap decrements) or server-derived (relay maintains an unread count per token). Both are meaningful state-management additions. v2 explicitly sets `shouldSetBadge: false` in the notification handler.

- **"Agent failed" notifications** — `[DEFERRED: separate PRD]`.
  **Why:** Host-service emits no failure event today (`AgentLifecycleEventType = "Start" | "Stop" | "PermissionRequest" | "Attached" | "Detached"` in `packages/host-service/src/events/map-event-type.ts`). Adding a `Failed` event is a host-side cross-cutting change with its own scope (where to catch turn errors, how to represent the failure payload, how to render in desktop too) — it's a precursor that earns its own initiative. v2 ships with `Stop` + `PermissionRequest` only.

- **Workspace section grouping / sticky workspace headers / per-workspace pagination** (the v1.x sessioned-by-workspace UI that v1.6.0 introduced and v1.8.0 refined) — `[NOT SUPPORTED]` in v2.
  **Why:** v2.0.0 flipped the sessions list from host-first to **project-first** with workspace as inline row metadata, not as a section header. Re-introducing workspace sections would put nested grouping (project → workspace → sessions) back on the screen — exactly the "grouping hell" the v2 refactor was designed to avoid. Users who want to focus on a single workspace use UC-NAV-08 filter chips instead. The retired UC-NAV-02 captures the v1.x behavior for git history continuity.

- **Header host picker / global "switch host" affordance** — `[NOT SUPPORTED]` in v2.
  **Why:** v2's project-first model treats host as **metadata on individual rows**, not as a top-level filter. Tapping a session that lives on a different host naturally opens a tunnel to that host (via `useChatTunnel`) — there is no need for a global host switcher. The retired UC-NAV-03 captures the v1.x host-picker for git history continuity.

- **Workspace creation on mobile** — `[DEFERRED: separate PRD]`.
  **Why:** Confirmed during the v2.0.0 brainstorming pass — mobile v2 lists, filters, and selects workspaces; **does not create them**. Workspace creation today happens on desktop via `apps/desktop`'s new-workspace flow, which writes both the `v2_workspaces` row and provisions the underlying git worktree on the host's filesystem. Adding mobile-side creation would require either (a) remote-invoking the host-service to create a worktree (large surface) or (b) creating a `v2_workspaces` row without a backing worktree (broken state). Neither earns its scope inside v2.

- **Host axis in the filter bottom sheet (UC-NAV-08)** — `[DEFERRED: separate PRD]`.
  **Why:** Workspace filter rows already disambiguate by host (`branch · host`) and the resulting chip tags carry the host suffix, so users can already narrow to "sessions on cloud-1" by selecting the cloud-1 workspaces. A dedicated host axis would be redundant for the current model. Re-evaluate if users tell us they want to filter by host without naming workspaces.

- **Date / activity-range filter in the filter bottom sheet (UC-NAV-08)** — `[DEFERRED: separate PRD]`.
  **Why:** Recency sort already surfaces "what mattered most recently" by default. Adding an explicit date axis is straightforward to layer on later if users ask for it; not a precondition for the project-first MVP.

## Scope size check

Mobile-chat v2 reads as one shippable initiative organized around six tight functional groups (session lifecycle, composition, rendering, mid-turn interactive prompts, platform integration, navigation). Each group corresponds to a sprintable unit of work with a clear human-testable gate. The Tiptap port carries the bulk of the implementation risk; the rest is mechanical against existing transport and UI primitives.

If sprints reveal that a group (especially `RENDER` or `COMP`) needs splitting, run `/kb-sprint-plan --delta-replan`; do not retroactively widen this PRD.
