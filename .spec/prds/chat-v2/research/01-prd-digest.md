# 01 — V2 PRD digest

Faithful paraphrase of the [Chat UI V2 — Notion](https://www.notion.so/Chat-UI-V2-365b9d5bf61681f1908bf98108d80e2d) page as of 2026-05-19. Re-fetch if you suspect drift; the page is the source of truth, this doc is a working copy.

## Premise

Chat must become a first-class Superset primitive — desktop on par with Codex CLI / Conductor — and the protocol must be portable to web and React Native later. Mobile tests proved a terminal-only flow won't carry on-the-go use cases. Major players (Codex app, Cursor agent UI, Conductor) are all investing in UI; not investing here loses the segment of the market that prefers UI.

## In / out of scope

**In scope.** Transport choice. Harness choice. Standard event-stream / UI-hook protocol that scales to web + RN + desktop. Storage format. Building the desktop UI to Conductor / Codex quality.

**Out of scope.** Building a harness from scratch. Working on the mobile / web UIs (except as portability proof). Supporting multiple harnesses. Inventing our own generic event types ungrounded from an existing shape.

## Locked-in decisions

### Harness — one, no fork

Ship `createCodexHarness` wrapping `@openai/codex-sdk`. The SDK spawns the real `codex` binary headless — full CLI capability, no feature loss. Mastra / `mastracode` is out for V2.

### Architecture — three layers

`client (desktop · web · mobile)` ↔ `host (user's machine — system of record)` ↔ `harness`.

### Adapter isolation

Only the adapter imports `@openai/codex-sdk`. Codex `ThreadEvent`s are translated into our canonical events; Codex types never escape. The informal `Harness` interface (`threadId · sendMessage · abort · subscribe · dispose`) stays informal in V1 (one impl). Extracting a formal TS interface when a second adapter lands is hours, not days. **One Harness instance = one session;** it holds the underlying Codex thread internally.

### Transport

WebSocket per `client ↔ host`. tRPC `wsLink`. No Durable Objects, no Liveblocks, no S2.dev. The pipe is a dumb, swappable transport: Superset relay default (thin, minimal exposure); SSH / Tailscale for security-conscious orgs — they drop the relay entirely and chat never touches Superset infra. **The host does its own fan-out** for the user's small-N devices — fan-out lives on the host precisely so the pipe stays swappable.

### tRPC control surface (on the host)

| Procedure | Type | Behavior |
|---|---|---|
| `chat.stream` | subscription | Canonical event log; offset-resume via tRPC v11 `tracked()` / `lastEventId`. |
| `chat.sendMessage` | mutation | Appends `user.message`, drives the harness, returns a fast ack `{ offset }` — **not the reply.** Optimistic send handled client-side via a `clientMessageId`. |
| `chat.abort` | mutation | Interrupts the harness. |
| `chat.respondToInteraction` | mutation | Answers a pending `ask_user` / `submit_plan` MCP call. |

### Event format

Superset-owned zod **discriminated union**, modeled on **AI SDK v6 UI message stream parts** (`text-delta`, `tool-input-delta`, `reasoning-delta`, `start` / `finish`, …). Owned by us so it's self-versioned, not coupled to the `ai` package's release cadence. Adds events no harness emits: `user.message`, `session.titled`, and a monotonic `offset` on every entry. Tools are generic — `tool.started` / `tool.delta` / `tool.ended` carrying `{ name, input, output, status }` — not one event type per built-in tool. The log is append-only. **An interactive prompt is just a `tool.started` with no matching `tool.ended` yet** — "pending" needs no special event type.

### Storage

Host SQLite append-only event log + periodic snapshots = system of record. **No user conversation content on Superset servers** — not in Neon, not in any cloud store. Neon's `chat_sessions` keeps metadata only (which sessions exist, `lastActiveAt`, workspace) for the cross-device session list. The `title` column is dropped — titles live in the log as `session.titled` events and render from a cheap host-side projection.

### Client materialization

Per-session `SessionStore` owns the WebSocket, folds the canonical event log into a view via a pure reducer, exposes it through `useSyncExternalStore`. The reducer reuses the **AI SDK v6 stream-part assembler** for the chunk → `UIMessage` step; view is `UIMessage[]` rendered by `ai-elements`. Cold load: snapshot@N + `chat.stream` since N. A persistent IndexedDB cache is **deferrable** — host snapshots already make cold load fast. **Explicitly NOT `useChat`** — `useChat` couples send → its own response stream, which the multi-device shared-log model breaks.

### Interactions (questions / plan / approvals)

Questions and plan approval are **blocking MCP tools** — `ask_user`, `submit_plan` — on a **host-local MCP server**. Uniform across any harness; Q&A content never leaves the host. Per-tool-call approval (gating bash / edit before they run) is harness-native and uneven (Codex has `sandboxMode`; Claude has `canUseTool`); handle differences when adapters multiply.

### Title generation

Host-side small-model call (`getSmallModel` → AI SDK `generateText`) using the user's own credentials, direct to the provider — no Superset hop. Emitted as a `session.titled` event into the log; harness-independent.

## V1 ship vs deferred

**V1 ship.** Codex adapter · canonical event schema · host SQLite log + snapshots · host fan-out over the relay · chat tRPC router · `SessionStore` + reducer · host-local interaction MCP server · desktop UI.

**Deferred.** Claude Agent SDK adapter · formal `Harness` TS interface · IndexedDB client cache · E2EE cloud copy for offline history · `switchModel` / `editAndResend`.

## Assumptions baked into the plan

- In 6 mo – 2 yr, AI-coding subsidies melt away or become walled gardens. Don't architect to benefit from subsidies.
- Harnesses commoditize; value sits in the platform. We can support one harness.
- We don't have bandwidth for multiple harnesses in the next two months — pick one and go.
- Enterprise / security-conscious users may chafe at us storing chats — hence host-as-system-of-record.

## Build sequence (PRD-stated)

1. Canonical event schema (zod) — the contract everything depends on.
2. Codex adapter — `createCodexHarness`; Codex `ThreadEvent` → canonical events.
3. Host — SQLite log writer + snapshots, the chat tRPC router, fan-out.
4. Client — `SessionStore` + reducer + `useSyncExternalStore`, wired to `ai-elements`.
5. Host-local MCP server — `ask_user` / `submit_plan`.
6. Cut over the desktop UI; delete the legacy chat once at feature parity.

## Success metrics

- ~5% of users use chat daily today; stickiness ~22%. Target: stickiness moves directionally up the week after launch.
- Chat is ready for cross-platform use (schema + reducer reusable by web + RN).

## User segment

About 5% of our user base is on the chat each day; stickiness is somewhat low.

## Design ownership

Ad-hoc — up to Justin to communicate. Screenshots from other tools dropped into tickets is the suggested propagation pattern to keep Satya / the team aligned.
