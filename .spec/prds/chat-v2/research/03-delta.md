# 03 — Delta: V1 → V2

Single-page diff between what's in `02-v1-state.md` and what's in `01-prd-digest.md`.

## At-a-glance

| Concern | V1 today | V2 target | Effort signal |
|---|---|---|---|
| Harness | `mastracode` (Mastra-based) | `@openai/codex-sdk` via `createCodexHarness` | **HIGH** — net-new adapter; full Codex SDK research before design |
| Transport | tRPC HTTP, polling @ 4 fps | tRPC `wsLink` subscriptions w/ offset resume | **HIGH** — Electron-IPC observable constraint complicates spec |
| Event model | Snapshot (`displayState` + `messages[]`) | Append-only canonical event log; AI SDK v6 stream-part shape | **HIGH** — zod schema is the cross-cutting contract; design it first |
| Reducer | `useChatDisplay` (snapshot + dedupe hacks) | Pure `SessionStore` reducer + `useSyncExternalStore` | **MEDIUM** — clean rewrite; reuse v6 stream-part assembler |
| Storage | Mastra Memory (opaque) | Host SQLite append-only log + snapshots | **MEDIUM** — net-new; needs compaction / snapshot policy |
| Cloud (Neon) | `chat_sessions.title` persisted, `chat_attachments` table | Metadata only — title becomes `session.titled` event; attachments need new home | **MEDIUM** — schema migration + attachment relocation |
| Fan-out | Single client | Host fans WebSockets to user's N devices | **MEDIUM** — host needs subscription tracker per session |
| Pipe | HTTP via desktop IPC | Swappable: relay default, SSH / Tailscale escape hatch | **LOW** (V1) — relay only ships first; SSH/Tailscale later |
| Interactions | `pendingQuestion` on display state + sandbox shim | Blocking MCP tools (`ask_user`, `submit_plan`) on host-local MCP | **MEDIUM** — net-new MCP server; replaces shim |
| Multi-platform | Desktop-only | Schema + reducer reusable on web + RN | **LOW** (V1) — desktop only; web / RN are validation |
| Title gen | Host-side small-model | **Same pattern — already V2-shaped** ✅ | **LOW** — re-wire to emit `session.titled` event |
| Auth (`ChatService`) | OAuth + keychain + env | **Survives** — orthogonal to harness ✅ | **LOW** — Codex SDK auth glue is incremental |
| Slash commands | Host-side, harness-independent | Same surface, called by Codex adapter | **LOW** — re-wire only |
| Sandbox-access shim | Synthetic `pendingQuestion` overlay | Codex `sandboxMode` (coarse) — drop the shim | **LOW** — deletion, not addition |

## Things that DELETE in V2

- `mastracode` dep + all `@mastra/*` deps from the chat surface (rule-5 cleanup follows naturally).
- The polling-based hook (`useChatDisplay` polling path) and its dedupe machinery.
- The dual-surface `ChatRuntimeService` + `ChatRuntimeManager` (V2 has one runtime; collapse to one surface).
- The sandbox-access overlay shim in `ChatRuntimeManager.subscribeToSessionEvents`.
- `chat_sessions.title` column (V2) and writes to it.
- Likely: the older `apps/desktop/src/renderer/components/Chat/ChatInterface/` UI tree (assuming `ChatPane/*` is canonical).

## Things that SURVIVE intact

- `ChatService` (auth) — only Codex-SDK glue is incremental.
- Slash-command discovery + resolver (`packages/chat/src/server/desktop/slash-commands/`).
- Title-gen small-model path (`packages/chat/src/server/desktop/title-generation/`) — re-wire output as `session.titled` event.
- `@superset/ui/ai-elements/*` primitives — V2 renderer uses them as-is.
- `chat_attachments` schema if we decide to keep it (open decision).
- The `chat_sessions` metadata columns (`organizationId`, `workspaceId`, `v2WorkspaceId`, `lastActiveAt`).

## Things that are NEW in V2

- Canonical event-log zod schema (the contract).
- `createCodexHarness` adapter.
- Host SQLite log writer + snapshot writer + compaction.
- `chat.stream` tRPC subscription + Electron-IPC adapter for it.
- Host-local MCP server hosting `ask_user` and `submit_plan`.
- Per-session `SessionStore` + reducer + `useSyncExternalStore` consumer.
- Per-session WebSocket subscription tracker on the host (fan-out).
- Snapshot resume protocol (snapshot@N + stream-since-N).
- A `clientMessageId` round-trip for optimistic-send reconciliation.
