# 05 — File pointers

Code map for designers and implementers. Each entry: path, what's there, why you'd open it.

## Chat package

| Path | What | Open it when |
|---|---|---|
| `packages/chat/src/server/desktop/chat-service/chat-service.ts` | `ChatService` — OAuth + keychain + env auth (~670 LOC) | Wiring Codex-SDK auth or adding a new provider |
| `packages/chat/src/server/desktop/chat-service/anthropic-env-config.ts` | Persisted env-file config for Anthropic credentials | Adding env-file support for a new provider |
| `packages/chat/src/server/desktop/chat-service/oauth-flow-controller.ts` | OAuth start / cancel / complete brokering with TTL slots | Adding an OAuth flow for a new provider |
| `packages/chat/src/server/desktop/chat-service/openai-oauth-loopback.ts` | Loopback callback server for OpenAI OAuth | Re-using the loopback pattern |
| `packages/chat/src/server/desktop/auth/{anthropic,openai}/` | Provider-specific auth utilities | Source of truth for credential shapes |
| `packages/chat/src/server/desktop/slash-commands/` | Slash-command discovery (builtins + custom), resolver, frontmatter, named-args | V2 keeps this surface; called by the new runtime |
| `packages/chat/src/server/desktop/title-generation/` | Host-side small-model title call | Re-wire to emit `session.titled` event in V2 |
| `packages/chat/src/server/desktop/router/router.ts` | Desktop tRPC router glue (file search, MCP overview) | Reference for V2 router shape |
| `packages/chat/src/server/shared/small-model/get-small-model.ts` | Small-model factory for title-gen + cheap calls | Same on V2 |
| `packages/chat/src/server/trpc/service.ts` | `ChatRuntimeService` — second runtime surface (~400 LOC) | Open-decision #1; one of the two surfaces V2 collapses |
| `packages/chat/src/server/trpc/utils/runtime/runtime.ts` | Mastra runtime helpers shared by `ChatRuntimeService` | Reference for what the new Codex adapter must replace |
| `packages/chat/src/server/trpc/utils/runtime/superset-mcp.ts` | Superset MCP client wiring | Reference for V2's `/api/agent/mcp` re-use |
| `packages/chat/src/server/hono/hono.ts` | Hono-based HTTP surface | Reference if V2 needs a non-tRPC HTTP escape hatch |
| `packages/chat/src/server/shared/auth-provider-ids.ts` | Provider ID constants | Same on V2 |
| `packages/chat/src/client/provider/provider.tsx` | `ChatRuntimeServiceProvider` React provider | Will be replaced by V2's `SessionStoreProvider` |
| `packages/chat/src/client/provider/client.ts` | `createChatRuntimeServiceHttpClient` (tRPC `httpBatchLink`) | Replaced by `wsLink` client in V2 |
| `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts` | Polling-based reducer hook | Reference for behavior to preserve in the V2 reducer; gets deleted |
| `packages/chat/src/shared/slash-command-arguments.ts` | Slash-command arg parser | Same on V2 |
| `packages/chat/src/shared/slash-command-matching.ts` | Slash-command name matching | Same on V2 |
| `packages/chat/src/shared/slash-command-named-arguments.ts` | Named-arg parser | Same on V2 |

## Host service

| Path | What | Open it when |
|---|---|---|
| `packages/host-service/src/runtime/chat/chat.ts` | `ChatRuntimeManager` — per-session runtime map, dispose, sandbox shim (~800 LOC) | Open-decision #1; the cutover target candidate |
| `packages/host-service/src/trpc/router/chat/chat.ts` | Host-service tRPC chat router (`getDisplayState`, `getSnapshot`, `sendMessage`, …) | Reference for V2 router shape; the V1 control surface |
| `packages/host-service/src/db/schema.ts` | SQLite schema (workspaces, projects, terminal sessions, …) | Where V2's event-log + snapshots tables will live |
| `packages/host-service/src/db/db.ts` | Drizzle SQLite client init | Reference for migration pattern |
| `packages/host-service/src/providers/model-providers/` | Model provider runtime resolver | Hands credentials to the harness; reused by V2 |
| `packages/host-service/src/trpc/index.ts` | tRPC base setup (superjson, error mapping, timeouts) | Where V2's `wsLink` subscription procedures slot in |

## Desktop renderer

| Path | What | Open it when |
|---|---|---|
| `apps/desktop/src/renderer/screens/main/.../ChatPane/ChatPane.tsx` | Outer pane, session selector, provider wiring | Top-level V2 entry point to re-wire |
| `apps/desktop/src/renderer/screens/main/.../ChatPane/ChatPaneInterface/ChatPaneInterface.tsx` | Composer + message list, preferences, send-message orchestration | Where the V2 store gets consumed |
| `apps/desktop/src/renderer/screens/main/.../ChatPane/ChatPaneInterface/components/ChatMessageList/` | Per-role message components (assistant, user, thinking, pending-*, subagent, tool-preview) | Source of truth for visual variants V2 must preserve |
| `apps/desktop/src/renderer/screens/main/.../ChatPane/hooks/useChatPaneController/` | Session lifecycle, fresh-session handoff, organization scoping | Where V2 session-bootstrap logic plugs in |
| `apps/desktop/src/renderer/components/Chat/ChatInterface/` | Older / parallel UI tree | Open-decision #2; likely deleted in V2 |
| `apps/desktop/src/renderer/stores/chat-preferences/store.ts` | Zustand store for model + thinking level + draft preferences | Survives V2 as-is |
| `apps/desktop/src/renderer/lib/dev-chat.ts` | Dev-mode chat helper | Reference only |
| `apps/desktop/src/renderer/lib/agent-session-orchestrator/adapters/chat-adapter.ts` | Adapter to the agent-session orchestrator | Open if integrating V2 sessions into orchestrator |
| `apps/desktop/src/lib/trpc/routers/chat-runtime-service/index.ts` | Electron IPC router fronting `ChatRuntimeService` | Where the `trpc-electron` observable constraint shows up |
| `apps/desktop/src/lib/trpc/routers/chat-service/` | Electron IPC router fronting `ChatService` (auth) | Survives V2 |

## Cloud API surface

| Path | What | Open it when |
|---|---|---|
| `apps/api/src/app/api/chat/[sessionId]/route.ts` | PUT (create session), PATCH (update title) | Title PATCH goes away with V2's title-as-event |
| `apps/api/src/app/api/chat/[sessionId]/stream/route.ts` | SSE-proxy to a `DurableStream` (separate cloud chat surface) | Reference only — not used by ChatPane |
| `apps/api/src/app/api/chat/lib.ts` | Durable-streams helpers + auth | Reference only |
| `apps/api/src/app/api/chat-attachments/` | Attachment upload endpoint | Open-decision #8 (attachments-on-Superset) |
| `packages/trpc/src/router/chat/chat.ts` | Cross-cutting tRPC chat router (cloud) | Where Neon-side metadata reads/writes live |
| `packages/trpc/src/router/chat/utils/upload-chat-attachment/` | Attachment-upload helper | Open-decision #8 |

## Schema

| Path | What | Open it when |
|---|---|---|
| `packages/db/src/schema/schema.ts` | `chatSessions` (line 678), `chatAttachments` (line 712) | Open-decisions #4, #8, #9 |
| `packages/db/drizzle/` | Auto-generated migration SQL — **do not edit by hand** | Source of truth for current Neon schema; new migrations go here via `drizzle-kit generate` |

## UI primitives

| Path | What | Open it when |
|---|---|---|
| `packages/ui/src/components/ai-elements/` | AI-SDK-aligned primitives (conversation, message, prompt-input, plan, reasoning, tool variants, …) | Anywhere V2 renders chat content |
| `packages/ui/src/components/ai-elements/message.tsx` | Message + MessageContent | Per-role component implementations consume these |
| `packages/ui/src/components/ai-elements/conversation.tsx` | Conversation container + context | Scroll / focus behavior lives here |
| `packages/ui/src/components/ai-elements/prompt-input.tsx` | Composer primitives | Reused by V2 composer |
| `packages/ui/src/components/ai-elements/thinking-toggle.tsx` | Thinking-level selector | Survives V2 |

## Project rules (must-read before changing the surface)

| Path | Why |
|---|---|
| `AGENTS.md` (repo root) | Structure rules, lint policy, plan placement, ticket format |
| `apps/desktop/AGENTS.md` | `trpc-electron` observable constraint, error-text selectability |
| `.spec/prds/chat-v2/research/02-v1-state.md` | Index of what's there today |
| `.spec/prds/chat-v2/research/04-open-decisions.md` | Index of what's not yet decided |
