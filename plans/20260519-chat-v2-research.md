# Chat UI V2 — research & V1 state digest

**Status:** Pre-plan. Captures the V2 PRD as authored and the V1 chat implementation as it lives in this repo today, plus the delta between them and the open decisions we need to make before designing the build.

**Inputs:**
- PRD: [Chat UI V2 — Notion](https://www.notion.so/Chat-UI-V2-365b9d5bf61681f1908bf98108d80e2d) (digested into §1 below — link is the source of truth)
- V1 implementation crawl: this branch's working tree on `origin/main` (`d81dec108`)

---

## 1. The V2 PRD (as authored)

### Premise

Chat must become a first-class Superset primitive — desktop on par with Codex CLI / Conductor, and the protocol portable to web and React Native later. Mobile tests proved a terminal-only flow won't carry on-the-go use cases. Major players (Codex app, Cursor agent UI, Conductor) are all investing in UI; if we don't, we lose the segment of the market that prefers UI.

### In / out of scope

**In scope.** Transport choice. Harness choice. Standard event-stream / UI-hook protocol that scales to web + RN + desktop. Storage format. Building the desktop UI to Conductor/Codex quality.

**Out of scope.** Building a harness from scratch. Working on the mobile / web UIs (except as portability proof). Supporting multiple harnesses. Inventing our own generic event types ungrounded from an existing shape.

### Locked-in decisions

- **One harness, no fork.** Ship `createCodexHarness` wrapping `@openai/codex-sdk`. The SDK spawns the real `codex` binary headless — full CLI capability, no feature loss. Mastra / `mastracode` is out for V2.
- **3-layer architecture.** `client (desktop · web · mobile)` ↔ `host (user's machine — system of record)` ↔ `harness`.
- **Adapter isolation.** Only the adapter imports `@openai/codex-sdk`. Codex `ThreadEvent`s are translated into our canonical events; Codex types never escape. The informal `Harness` interface (`threadId · sendMessage · abort · subscribe · dispose`) stays informal in V1 (one impl). Extracting a formal TS interface when a second adapter lands is hours, not days.
- **One Harness instance = one session.** It holds the underlying Codex thread internally.
- **Transport.** WebSocket per `client ↔ host`. tRPC `wsLink`. No Durable Objects, no Liveblocks, no S2.dev. The pipe is a dumb, swappable transport (Superset relay default; SSH / Tailscale for security-conscious orgs — they drop the relay and chat never touches Superset infra). **The host does its own fan-out** for the user's small-N devices — fan-out lives on the host precisely so the pipe stays swappable.
- **tRPC control surface (on the host).**
  - `chat.stream` — subscription: canonical event log; offset-resume via tRPC v11 `tracked()` / `lastEventId`.
  - `chat.sendMessage` — mutation: appends `user.message`, drives the harness, returns a fast ack `{ offset }` — **not the reply**. Optimistic send handled client-side via a `clientMessageId`.
  - `chat.abort`, `chat.respondToInteraction` — mutations.
- **Event format.** Superset-owned zod discriminated union, modeled on **AI SDK v6 UI message stream parts** (`text-delta`, `tool-input-delta`, `reasoning-delta`, `start` / `finish`, …). Owned by us so it's self-versioned, not coupled to the `ai` package's release cadence. Adds events no harness emits: `user.message`, `session.titled`, and a monotonic `offset` on every entry. Tools are generic — `tool.started` / `tool.delta` / `tool.ended` carrying `{ name, input, output, status }` — not one event type per built-in tool. The log is append-only. **An interactive prompt is just a `tool.started` with no matching `tool.ended` yet** — "pending" needs no special event type.
- **Storage.** Host SQLite append-only event log + periodic snapshots = system of record. **No user conversation content on Superset servers** — not in Neon, not in any cloud store. Neon's `chat_sessions` keeps metadata only (which sessions exist, `lastActiveAt`, workspace) for the cross-device session list. The `title` column is dropped — titles live in the log as `session.titled` events and render from a cheap host-side projection.
- **Client materialization.** Per-session `SessionStore` owns the WebSocket, folds the canonical event log into a view via a pure reducer, exposes it through `useSyncExternalStore`. The reducer reuses the **AI SDK v6 stream-part assembler** for the chunk → `UIMessage` step; view is `UIMessage[]` rendered by `ai-elements`. Cold load: snapshot@N + `chat.stream` since N. A persistent IndexedDB cache is **deferrable** — host snapshots already make cold load fast. **Explicitly NOT `useChat`** — `useChat` couples send → its own response stream, which the multi-device shared-log model breaks.
- **Interactions (questions / plan / approvals).** Questions and plan approval are **blocking MCP tools** — `ask_user`, `submit_plan` — on a **host-local MCP server**. Uniform across any harness; Q&A content never leaves the host. Per-tool-call approval (gating bash/edit before they run) is harness-native and uneven (Codex `sandboxMode`; Claude `canUseTool`); handle differences when adapters multiply.
- **Title generation.** Host-side small-model call (`getSmallModel` → AI SDK `generateText`) using the user's own credentials, direct to the provider — no Superset hop. Emitted as a `session.titled` event into the log; harness-independent.

### V1 ship / deferred

**V1.** Codex adapter · canonical event schema · host SQLite log + snapshots · host fan-out over the relay · chat tRPC router · `SessionStore` + reducer · host-local interaction MCP server · desktop UI.

**Deferred.** Claude Agent SDK adapter · formal `Harness` TS interface · IndexedDB client cache · E2EE cloud copy for offline history · `switchModel` / `editAndResend`.

### Assumptions baked into the plan

- In 6 mo – 2 yr, AI-coding subsidies melt away or become walled gardens. Don't architect to benefit from subsidies.
- Harnesses commoditize; value sits in the platform. We can support one harness.
- We don't have bandwidth for multiple harnesses in the next two months — pick one and go.
- Enterprise / security-conscious users may chafe at us storing chats — hence host-as-system-of-record.

### Build sequence (PRD-stated)

1. Canonical event schema (zod) — the contract everything depends on.
2. Codex adapter — `createCodexHarness`; Codex `ThreadEvent` → canonical events.
3. Host — SQLite log writer + snapshots, the chat tRPC router, fan-out.
4. Client — `SessionStore` + reducer + `useSyncExternalStore`, wired to `ai-elements`.
5. Host-local MCP server — `ask_user` / `submit_plan`.
6. Cut over the desktop UI; delete the legacy chat once at feature parity.

### Success metrics

- ~5% of users use chat daily today; stickiness ~22%. Target: stickiness moves directionally up the week after launch.
- Chat is ready for cross-platform use (schema + reducer reusable by web + RN).

---

## 2. V1 chat state — what's in the repo today

### Harness

- `mastracode@0.18.1` (forked / owned Mastra coding agent) + `@mastra/core@1.33.1`, `@mastra/memory@1.18.0`, `@mastra/mcp@1.7.0`. **Not** Codex.
- Per-session runtime: `ChatRuntimeManager` at `packages/host-service/src/runtime/chat/chat.ts` (~800 LOC). Per-`sessionId` `RuntimeSession` map; in-flight creation dedupe; sandbox-question shim; error-message normalization; lifecycle disposal.
- A second runtime surface exists: `ChatRuntimeService` at `packages/chat/src/server/trpc/service.ts` (~400 LOC) — has its own `subscribeToSessionEvents`, MCP overview, `LifecycleEvent` type. Lifts the runtime out of host-service for portability. **Two parallel V1 chat-runtime surfaces today; confirm the cutover target before V2 design.**

### Transport

- tRPC over **HTTP `httpBatchLink`** with **polling at 4 fps** (`refetchInterval = 250 ms`).
- Polls converged: a `getSnapshot` query returns `{ displayState, messages }` in one round-trip to dedupe the dual-query race; client also runs `getDisplayState` + `listMessages` independently in `useChatDisplay`.
- **No WebSocket, no SSE, no event stream** on the desktop chat path.
- **Side note (unrelated to desktop runtime):** `apps/api/src/app/api/chat/[sessionId]/stream/route.ts` does SSE-proxy a `DurableStream` to a cloud chat surface — separate from the V2 plan.

### State model

- Harness exposes `getDisplayState()` → `{ currentMessage, isRunning, pendingQuestion, ... }` and `listMessages()` → flat history.
- Reducer logic lives in `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts`: optimistic user message, a `withoutActiveTurnAssistantHistory` dedupe pass, error extraction.
- **Snapshots, not deltas.** Streaming-deltas concept doesn't exist — the renderer reconstructs from sequential snapshots.

### Storage

- Mastra `Memory` (`observationalMemory: false`).
- Edit-and-resend goes through Mastra's storage abstraction `harness.config.storage.getStore("memory")` — clones the thread up to the target message ID.
- **No append-only log, no offsets, no cursors.**
- Cloud `chat_sessions` (Neon, Postgres) carries `title`, `lastActiveAt`, `workspaceId` (and `v2WorkspaceId`), `organizationId`, `createdBy`.

### Interactions

- `pendingQuestion` lives on `displayState` (harness-emitted).
- Sandbox-access requests are a separate shim: the runtime catches `sandbox_access_request` events and overlays a synthetic pending question (`Grant sandbox access to "X"?` / Yes-No).
- Plan and tool approvals are routed through `respondToPlanApproval` / `respondToToolApproval` on the harness.
- **Not MCP-tool-based today.**

### Auth (independent of harness)

- `ChatService` at `packages/chat/src/server/desktop/chat-service/chat-service.ts` (~670 LOC). OAuth flows for Anthropic + OpenAI: keychain, mastracode `authStorage`, env-file persisted config, loopback callback server, refresh tokens, external-credential pickup from `~/.claude` / keychain.
- **Survives a harness swap** — the V2 work is orthogonal to this.

### Slash commands & title generation

- Already host-side and harness-independent.
- Slash commands: `packages/chat/src/server/desktop/slash-commands/` (builtins, custom-from-`.claude/commands/`, frontmatter parsing, argument resolution).
- Title gen: `packages/chat/src/server/desktop/title-generation/` — small-model call via `getSmallModel` (matches V2's intended pattern exactly).
- **These pass through to V2 essentially as-is.**

### Renderer

- **Canonical V1 UI tree:** `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/ChatPane/`
  - `ChatPane.tsx` → `ChatPaneInterface.tsx` → `ChatMessageList.tsx`
  - Per-role message components: `AssistantMessage`, `UserMessage`, `ThinkingMessage`, `PendingApprovalMessage`, `PendingQuestionMessage`, `PendingPlanApprovalMessage`, `SubagentExecutionMessage`, `ToolPreviewMessage`
  - Uses `@superset/ui/ai-elements/*` (conversation, message, prompt-input, thinking-toggle, shimmer-label)
- **Older/parallel UI tree:** `apps/desktop/src/renderer/components/Chat/ChatInterface/` — MentionPopover, ModelPicker, ToolCallBlock + ~10 tool-specific variants (Subagent, Skill, RequestSandboxAccess, LspInspect, ListTaskStatuses, Superset, AskUserQuestion, Generic), TiptapPromptEditor, PlanBlock. **Likely being phased out; confirm before V2 cutover plan.**

### Existing dependencies that line up with V2

- `ai@6.0.141` ✅ (PRD specifies "AI SDK v6")
- `@ai-sdk/react@3.0.143`, `@ai-sdk/anthropic@3.0.64`, `@ai-sdk/openai@3.0.36`
- `@superset/ui/ai-elements/*` — already rich (artifact, bash-tool, chain-of-thought, checkpoint, code-block, confirmation, conversation, edge, file-diff-tool, image, inline-citation, loader, message, model-selector, node, plan, prompt-input, reasoning, read-file-tool, …)
- `trpc-electron` already in use — see constraint below.

### Constraints discovered

- **`trpc-electron` only supports observables, NOT async generators.** From `apps/desktop/AGENTS.md`:
  > While standard tRPC recommends async generators for subscriptions, `trpc-electron` (used for Electron IPC) **only supports observables**. The library explicitly checks `isObservable(result)` and throws an error otherwise.
  This matters for V2: the PRD says `chat.stream` uses tRPC v11 `tracked()` / `lastEventId` (async-iterable shape). That works for browser/web clients, but the Electron IPC link will need an observable adapter that emits the same wire shape, OR the desktop renderer needs to talk wsLink → localhost host process instead of going through `trpc-electron`.
- **Mastra deps are pinned upstream by policy** (AGENTS.md rule 5): no fork tarballs / patches. V2 drops `mastracode` entirely, so this stops mattering on the V2 path — but the V1 surface keeps the constraint until cutover.
- **Lint policy is strict** (AGENTS.md rule 7): Biome warnings fail CI. Anything written here must lint clean before push.

---

## 3. Delta — V1 today → V2 target

| Concern | V1 today | V2 target |
|---|---|---|
| Harness | `mastracode` (Mastra-based) | `@openai/codex-sdk` via `createCodexHarness` |
| Transport | tRPC HTTP, polling @ 4 fps | tRPC `wsLink` subscriptions w/ offset resume |
| Event model | Snapshot (`displayState` + `messages[]`) | Append-only canonical event log; AI SDK v6 stream-part shape |
| Reducer | `useChatDisplay` (optimistic + dedupe hacks) | Pure `SessionStore` reducer + `useSyncExternalStore` |
| Storage | Mastra Memory (opaque) | Host SQLite append-only log + snapshots |
| Cloud (Neon) | `chat_sessions.title` persisted | Metadata only — title becomes `session.titled` event |
| Fan-out | Single client | Host fans WebSockets to user's N devices |
| Pipe | HTTP via desktop IPC | Swappable: relay default, SSH / Tailscale escape hatch |
| Interactions | `pendingQuestion` on display state + sandbox shim | Blocking MCP tools (`ask_user`, `submit_plan`) on host-local MCP |
| Multi-platform | Desktop-only | Schema + reducer reusable on web + RN |
| Title gen | Host-side small-model | **Same pattern — already V2-shaped** ✅ |
| Auth (`ChatService`) | OAuth + keychain + env | **Survives** — orthogonal to harness ✅ |

---

## 4. Open decisions to land before designing the build

1. **Two V1 chat surfaces** (host-service `chatRouter` vs `packages/chat/.../ChatRuntimeService`) — which one is the cutover target, and can the other die at parity?
2. **Two V1 renderer trees** (`ChatPane/*` vs `components/Chat/ChatInterface/*`) — same question. Which set of components does V2 inherit?
3. **`trpc-electron` constraint.** PRD says "tRPC v11 `tracked()` / `lastEventId`" — works in browser, breaks under Electron IPC. Options:
   1. Adapter layer that wraps `tracked()` semantics inside an observable on the Electron link only.
   2. Move the desktop renderer off `trpc-electron` onto a `wsLink` talking to a localhost host process (matches the web/RN clients exactly — single transport path).
4. **`chat_sessions.title`** — drop the column outright (PRD), or keep nullable for back-compat during cutover and stop writing to it?
5. **Codex SDK custom-tool model.** PRD says the harness connects to (a) existing Superset MCP at `/api/agent/mcp` for product tools and (b) the new host-local MCP for interactions. Confirm `@openai/codex-sdk` exposes MCP-server registration the way we need, or design a wrapper.
6. **Snapshot cadence + log compaction.** Not specified. Need a policy before SQLite design (event count threshold? time? size? compact-and-discard or compact-and-archive?).
7. **Slash commands + title gen surface.** They're already host-side and harness-independent — confirm they stay in `@superset/chat/server/desktop/*` rather than getting re-implemented inside the Codex adapter.
8. **`chat_attachments` table.** Lives in Neon today (`packages/db/src/schema/schema.ts`). If V2 keeps "no user content on Superset servers," attachment storage needs a new home (local blob store? Tailscale share? still on Neon as the one exception?).
9. **`v2WorkspaceId` migration.** `chat_sessions` already carries both `workspaceId` and `v2WorkspaceId` — V2 needs to pick one for its session-list semantics.

---

## 5. Pointers — files to read when designing

- Runtime: `packages/host-service/src/runtime/chat/chat.ts`, `packages/chat/src/server/trpc/service.ts`
- Host tRPC router: `packages/host-service/src/trpc/router/chat/chat.ts`
- Client hook: `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts`
- Client provider: `packages/chat/src/client/provider/{provider,client}.{tsx,ts}`
- Auth: `packages/chat/src/server/desktop/chat-service/chat-service.ts`
- Slash commands: `packages/chat/src/server/desktop/slash-commands/`
- Title gen: `packages/chat/src/server/desktop/title-generation/`
- Renderer (canonical V1): `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/ChatPane/`
- Renderer (older/parallel): `apps/desktop/src/renderer/components/Chat/ChatInterface/`
- AI-elements: `packages/ui/src/components/ai-elements/`
- Cloud chat session schema: `packages/db/src/schema/schema.ts` (`chatSessions`, `chatAttachments`)
- Cloud SSE (separate from V2 scope): `apps/api/src/app/api/chat/[sessionId]/stream/route.ts`
- Electron IPC constraint: `apps/desktop/AGENTS.md` (tRPC Subscriptions section)

---

## 6. Next step

Brainstorm the V2 design against this digest. The open decisions in §4 are the spine — answer those first, then the build sequence in §1 maps to concrete tasks.
