# 04 — Open decisions

What the brainstorm has to answer before a PRD-proper can be authored. Each item names the question, why it matters, and the candidate answers we already see.

## 1. Which V1 chat-runtime surface is the cutover target?

**Question.** `packages/host-service/src/trpc/router/chat/chat.ts` (host-service flavor) or `packages/chat/src/server/trpc/service.ts` (`ChatRuntimeService` standalone)? Can the other die at parity?

**Why it matters.** V2 has one runtime. If we cut over into the wrong surface, the legacy surface festers and routes diverge.

**Candidates.**
- **A.** Cut into host-service. Delete `ChatRuntimeService`. Pro: matches the actual IPC entry point today. Con: ties chat runtime to host-service lifecycle.
- **B.** Cut into `ChatRuntimeService`. Delete host-service flavor. Pro: portable package, web-app friendly. Con: host-service still owns the SQLite DB, so the runtime+log split adds an extra boundary.
- **C.** Build V2 as a third surface, port both V1 surfaces away from chat over time. Pro: keeps V1 stable during build. Con: three flavors in `main` during the cutover window.

## 2. Which V1 renderer tree is canonical?

**Question.** `apps/desktop/src/renderer/screens/main/.../ChatPane/*` or the older `apps/desktop/src/renderer/components/Chat/ChatInterface/*`?

**Why it matters.** V2's `SessionStore` + reducer needs to plug into the canonical tree; if both stay, we wire two consumers, leading to drift.

**Candidates.**
- **A.** `ChatPane/*` is canonical; older `Chat/ChatInterface/*` is legacy / dead-code. Delete the old tree as part of V2 cutover. (Most likely based on file activity, but unverified.)
- **B.** Both trees serve different surfaces (e.g. `ChatPane` for the workspace tab, `ChatInterface` for a popover/preview). If so, V2 supports both via the shared store.

## 3. How do we square `trpc-electron` (observable-only) with PRD's `tracked()` / `lastEventId`?

**Question.** Spec says async-iterable subscription with offset resume. Electron-IPC link doesn't support async generators. What's the bridge?

**Candidates.**
- **A.** **Observable adapter on the Electron link only.** Wrap the host's `tracked()` async-iterable in an observable in the Electron-IPC router. The wire shape stays the same; only the in-process glue changes. Cheap; preserves single web/RN/desktop code path on the client.
- **B.** **Move the desktop renderer off `trpc-electron`** onto a `wsLink` talking to a localhost host process. Removes the IPC special-case entirely, makes desktop look exactly like web. Cost: a real local WebSocket server inside the desktop main process; lifecycle / auth / port-management complexity.
- **C.** **Polyfill async iteration in `trpc-electron`** upstream. Right thing to do long-term; out of V2 scope.

## 4. `chat_sessions.title` — drop or deprecate?

**Question.** PRD says drop. Easier said than done if any cloud surface still reads the column.

**Candidates.**
- **A.** Drop now. Migration in `packages/db/drizzle/`. Any reader updates simultaneously.
- **B.** Deprecate: stop writing, leave the column nullable, schedule deletion post-cutover.
- **C.** Keep, write the latest title from the projection at session-close as a denormalized hint (lets us list sessions cross-device without spinning up the host). Trades one round-trip for one extra write.

## 5. `@openai/codex-sdk` capability — can it host our two MCP servers?

**Question.** V2 wants the harness to connect to (a) the existing Superset MCP server at `/api/agent/mcp` for product tools and (b) the new host-local MCP for interactions. Does the SDK expose MCP-server registration the way we need?

**Why it matters.** If the SDK only takes a single MCP endpoint or only ships built-in tools, the adapter needs a wrapper (federation, proxy MCP, or in-process bridge).

**Action.** Stub-research the Codex SDK before brainstorm: tool-registration API, MCP support, abort semantics, thread-resume support, sandbox-mode coarseness. Out of scope for this digest; flagged here so it lands on the brainstorm agenda.

## 6. Snapshot cadence + log compaction policy

**Question.** When does the host snapshot the log? When does it compact? Does compaction discard old events or archive them?

**Why it matters.** Determines SQLite schema + cold-load latency + replay window.

**Candidates (sketch).**
- Snapshot every N events (e.g. N=200) and at end-of-turn. Compact never (append-only forever) — disk cost is low and search is preserved.
- Snapshot at end-of-turn only. Compact at idle ≥1h: discard pre-snapshot events older than M turns. Trades replay-window length for disk.
- Snapshot every N events, archive compacted events to a per-session tail file. Best of both — but more code.

## 7. Slash-command + title-gen surface placement

**Question.** Both are already host-side and harness-independent. Keep them in `@superset/chat/server/desktop/*` and call them from the new V2 runtime, or move them inside the Codex adapter for cohesion?

**Candidates.**
- **A.** Keep in `@superset/chat/server/desktop/*`. Pro: ready to serve a Claude-SDK adapter (or any future harness) without copy-paste. Matches the spirit of the "harness is one adapter" decision.
- **B.** Move into the Codex adapter. Pro: one less seam. Con: copy-paste cost when a second adapter lands.

## 8. `chat_attachments` — strict "no user content" or pragmatic exception?

**Question.** PRD: no user conversation content on Superset servers. Attachments today live on Neon-fronted blob storage. Strict reading → relocate. Pragmatic reading → attachments are different.

**Candidates.**
- **A.** Strict. Move attachments to host (SQLite blob, or host-local file store). Same WS pipe streams them. Adds significant V1 scope.
- **B.** Pragmatic. Keep attachments on Superset blob (with consent disclosure). Conversation text stays host-only; attachments are an explicit exception called out in the PRD.
- **C.** Hybrid: attachments stay on Superset blob; their content-hashed manifests are pointed to from the canonical event log via `tool.started` payloads referencing a Superset URL. Decryption / signed URLs scoped to the user only.

## 9. `workspaceId` vs `v2WorkspaceId`

**Question.** `chat_sessions` carries both. Which does V2 join against?

**Candidates.**
- **A.** Use `v2WorkspaceId` exclusively; drop `workspaceId` post-cutover.
- **B.** Use both, prefer `v2WorkspaceId`, fall back to `workspaceId` during the V1→V2 desktop migration.

## 10. Cloud-session-list semantics without `title`

**Question.** V2 strips `title` from Neon. The cross-device session list needs SOMETHING to display.

**Candidates.**
- **A.** Render the list with a placeholder ("untitled / 2026-05-19 11:43") until the device with the host data loads. Pro: zero new fields. Con: ugly UX.
- **B.** Cache the latest `session.titled` on the host and `chat.updateMeta`-push it to Neon as a denormalized hint (overlaps with #4-C). Pro: clean UX cross-device. Con: small leak of metadata-derived content.
- **C.** Each device that has loaded the session locally renders the cached title; new devices render the placeholder until first load.

## Suggested brainstorm order

1, 2 → cuts decide what we're replacing.
3 → the constraint that shapes the transport layer.
5 → the constraint that shapes the harness layer.
6 → the storage shape that the event schema has to support.
7, 8, 9, 10 → bounded scope decisions that follow once 1-6 are clear.
4 → trivially follows from 6 + 10.
