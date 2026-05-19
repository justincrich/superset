# 02 — V1 state in the repo

Snapshot of chat as it lives today, against `fork/main` @ `5da928183`. Organized by concern so you can read the section that matches your role (renderer, runtime, transport, auth, …) without scanning the whole file.

## Harness

- **Dependency stack:** `mastracode@0.18.1` (the team's coding-agent SDK on top of Mastra) + `@mastra/core@1.33.1`, `@mastra/memory@1.18.0`, `@mastra/mcp@1.7.0`. **Not** Codex.
- **Per-session runtime:** `ChatRuntimeManager` at `packages/host-service/src/runtime/chat/chat.ts` (~800 LOC). Holds a per-`sessionId` `RuntimeSession` in a `Map`, dedupes in-flight creation, isolates sandbox-question handling, normalizes error messages, owns lifecycle disposal.
- **Two parallel chat-runtime surfaces today:**
  1. **Host-service flavor** — `packages/host-service/src/trpc/router/chat/chat.ts` (the one `ChatPane` uses today via IPC).
  2. **Standalone flavor** — `packages/chat/src/server/trpc/service.ts` (`ChatRuntimeService` class, ~400 LOC). Has its own `subscribeToSessionEvents`, MCP overview, `LifecycleEvent` type — lifts the runtime out of host-service for portability.
- **One global rule the runtime writes:** `ensureGlobalAgentInstructions()` drops a managed `~/.mastracode/AGENTS.md` telling the agent to use the `ask_user` MCP tool for questions — preserves the V2 UI overlay model even on the V1 harness. Only overwrites a file it previously wrote (marker check).

## Transport

- **tRPC over HTTP `httpBatchLink`** with **polling at 4 fps** (`refetchInterval = 250 ms`).
- Polls are partially converged: a `getSnapshot` query returns `{ displayState, messages }` in one round-trip to dedupe the dual-query race; the client also runs `getDisplayState` + `listMessages` independently in `useChatDisplay`.
- **No WebSocket, no SSE, no event stream** on the desktop chat path.
- **Side note (unrelated to desktop runtime):** `apps/api/src/app/api/chat/[sessionId]/stream/route.ts` does SSE-proxy a `DurableStream` to a cloud chat surface — separate from the V2 plan, not used by the ChatPane.

## State model

- The harness exposes `getDisplayState()` → `{ currentMessage, isRunning, pendingQuestion, ... }` and `listMessages()` → flat history.
- Reducer logic lives client-side in `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts`. Key behaviors:
  - Optimistic user-message merging (`setOptimisticUserMessage`, `optimisticTextRef`).
  - `withoutActiveTurnAssistantHistory` dedupe pass that strips active-turn assistant messages from history if the current message references them.
  - `findLatestAssistantErrorMessage` walks the history to surface a recent error.
- **Snapshots, not deltas.** No streaming-deltas concept exists — the renderer reconstructs from sequential snapshots, which is why the polling rate is 4 fps not 60 fps.

## Storage

- Mastra `Memory` (`observationalMemory: false`).
- Edit-and-resend goes through Mastra's storage abstraction `harness.config.storage.getStore("memory")` — clones the thread up to the target message ID, switches the harness onto the clone, re-sends.
- **No append-only log, no offsets, no cursors.**
- Cloud `chat_sessions` (Neon Postgres, `packages/db/src/schema/schema.ts`) carries:
  - `id` (uuid), `organizationId` (FK orgs), `createdBy` (FK users)
  - `workspaceId` (FK workspaces, nullable) AND `v2WorkspaceId` (FK v2Workspaces, nullable) — both present today
  - `title` (nullable text) — the field V2 plans to drop
  - `lastActiveAt`, `createdAt`, `updatedAt`
- Cloud `chat_attachments` (Neon) — stores blob pathnames + media types + filenames, keyed to a chat session. **If V2 keeps "no user content on Superset servers" strictly, this table needs a new home.**

## Interactions

- `pendingQuestion` lives on `displayState` and is harness-emitted.
- Sandbox-access requests are a separate shim: the runtime catches `sandbox_access_request` events from the harness and overlays a synthetic pending question (`Grant sandbox access to "X"?` / Yes-No options).
- Plan and tool approvals route through `respondToPlanApproval` / `respondToToolApproval` on the harness directly.
- **Not MCP-tool-based today** — the V2 plan replaces both the sandbox shim and the harness-emitted question with blocking MCP tools on a host-local server.

## Auth (`ChatService`, harness-independent)

- `packages/chat/src/server/desktop/chat-service/chat-service.ts` (~670 LOC).
- OAuth flows for **Anthropic** and **OpenAI**: keychain integration, mastracode `authStorage`, env-file persisted config (`anthropic-env-config.ts`), loopback callback server (`openai-oauth-loopback.ts`), refresh tokens via mastracode's `getApiKey`, external-credential pickup from `~/.claude` and the macOS keychain.
- `OAuthFlowController` brokers the start / cancel / complete flow with TTL-based session slots.
- The runtime resolver is called with `prepareRuntimeEnv()` before harness creation to ensure ambient process env carries the right credentials.
- **Survives a harness swap.** Codex-SDK auth requirements differ in detail (it needs an `OPENAI_API_KEY` or a logged-in `codex` session), but the OAuth scaffolding, keychain, and env-file machinery is reusable.

## Slash commands & title generation

- **Slash commands:** `packages/chat/src/server/desktop/slash-commands/` (builtins, custom-from-`.claude/commands/`, frontmatter parsing, named-argument resolution). All host-side and harness-independent.
- **Title generation:** `packages/chat/src/server/desktop/title-generation/` — small-model call via `getSmallModel` (`packages/chat/src/server/shared/small-model/`). **Matches V2's intended pattern exactly.**
- **These pass through to V2 essentially as-is.**

## Renderer

- **Canonical V1 UI tree:** `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/ChatPane/`
  - `ChatPane.tsx` → `ChatPaneInterface.tsx` → `ChatMessageList.tsx`.
  - Per-role message components co-located under `ChatMessageList/components/`: `AssistantMessage`, `UserMessage`, `ThinkingMessage`, `PendingApprovalMessage`, `PendingQuestionMessage`, `PendingPlanApprovalMessage`, `SubagentExecutionMessage`, `ToolPreviewMessage`, plus `MessageScrollbackRail` and `UserMessageActions`.
  - State comes from `useChatDisplay` (the polling hook above).
  - Preferences (model, thinking level, draft) live in `apps/desktop/src/renderer/stores/chat-preferences/store.ts`.
  - Uses `@superset/ui/ai-elements/*` (conversation, message, prompt-input, thinking-toggle, shimmer-label) — same toolkit V2 targets.
- **Older / parallel UI tree:** `apps/desktop/src/renderer/components/Chat/ChatInterface/` — `MentionPopover`, `ModelPicker`, `ToolCallBlock` + ~10 tool-specific variants (`SubagentToolCall`, `SkillToolCall`, `RequestSandboxAccessToolCall`, `LspInspectToolCall`, `ListTaskStatusesToolCall`, `SupersetToolCall`, `AskUserQuestionToolCall`, `GenericToolCall`, plus `TaskItemDisplay`), `TiptapPromptEditor` + `SlashCommandPreviewPopover`, `PlanBlock`, `MessageList` + `MessageScrollbackRail`.
- **Two-tree status unconfirmed.** Both are present in `main`. Likely the older tree is being phased out in favor of `ChatPane/*` — needs confirmation before V2 cutover.

## Existing dependencies that line up with V2

| Dep | Version | V2 fit |
|---|---|---|
| `ai` | 6.0.141 | ✅ PRD specifies "AI SDK v6" |
| `@ai-sdk/react` | 3.0.143 | ✅ Provides stream-part assembler V2 reducer needs |
| `@ai-sdk/anthropic` | 3.0.64 | Used today; survives the harness swap as the auth-side provider model |
| `@ai-sdk/openai` | 3.0.36 | Same |
| `@superset/ui/ai-elements/*` | local | Already rich: `artifact`, `bash-tool`, `chain-of-thought`, `checkpoint`, `code-block`, `confirmation`, `conversation`, `edge`, `file-diff-tool`, `image`, `inline-citation`, `loader`, `message`, `model-selector`, `node`, `plan`, `prompt-input`, `reasoning`, `read-file-tool`, … |
| `trpc-electron` | bundled | Used today for IPC; constraint below |
| `@openai/codex-sdk` | — | **NOT installed.** First V2 add. |

## Constraints discovered

- **`trpc-electron` only supports observables, NOT async generators.** Verbatim from `apps/desktop/AGENTS.md`:
  > While standard tRPC recommends async generators for subscriptions, `trpc-electron` (used for Electron IPC) **only supports observables**. The library explicitly checks `isObservable(result)` and throws an error otherwise.
  This matters for V2: the PRD says `chat.stream` uses tRPC v11 `tracked()` / `lastEventId` (async-iterable shape). That works for browser / web clients, but the Electron IPC link needs either an observable adapter that emits the same wire shape, OR the desktop renderer needs to talk `wsLink` → a localhost host process instead of going through `trpc-electron`.
- **Mastra deps are pinned upstream by policy** (`AGENTS.md` rule 5): no fork tarballs / patches. V2 drops `mastracode` entirely, so this stops mattering on the V2 path — but the V1 surface keeps the constraint until cutover.
- **Lint policy is strict** (`AGENTS.md` rule 7): Biome warnings fail CI. Anything added must lint clean.
- **`packages/chat` discovers slash commands from `.claude/commands`** (per `AGENTS.md` rule 3) — so the V2 chat will inherit the same source. Symlink convention in the worktree stays.
- **Plan & doc placement** (`AGENTS.md` rule 6): the canonical home for plans is `plans/` or `apps/<app>/plans/`; PRDs live under `.spec/prds/{slug}/`. This folder follows the second rule.
