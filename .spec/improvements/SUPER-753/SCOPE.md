---
ticket_id: SUPER-753
ticket_url: https://linear.app/superset-sh/issue/SUPER-753/nail-the-start-flow-for-new-chat-sessions-kill-the-message-flicker
tracker: linear
branch: improvement/SUPER-753-chat-start-flicker
worktree: .claude/worktrees/SUPER-753-chat-start-flicker
status: binding
chosen_option: challenger-smaller (Option 4 — findLastUserMessageIndex micro-patch)
loc_budget: 3
task_chunks: 1
investigator_specialist: electron-reviewer
challenger_specialist: code-reviewer
binding_at: 2026-05-20
binding_rationale: |
  Deep research (holocron js7f89mppq9p4h7hthdp883a0h8735de) confirmed every
  production reference architecture (OpenCode, Vercel AI SDK useChat,
  assistant-ui, ChatGPT/Claude.ai) has converged on push-based SSE/observable
  streams with server-authoritative message IDs — exactly what Options 2/3
  would build toward. But two greenfield worktrees (chat-v2,
  justinrich-chatbugs) are already building that rewrite on the same files
  Options 2/3 would touch. Landing a competing rewrite via SUPER-753 invites
  merge hell. Option 4 is the minimal-conflict-surface stopgap that fixes
  the user-visible flicker on the v1 polling stack while the greenfield
  proceeds in parallel.
---

# SUPER-753 — Nail the start flow for new chat sessions, kill the message flicker

## Defect

When the user sends the first message in a new chat session, the assistant
reply briefly **flickers** — the in-flight assistant message appears twice:
once via `currentMessage` (from `getDisplayState`), once via the history list
(from `listMessages`). The dedup filter `withoutActiveTurnAssistantHistory`
silently no-ops because `findLastUserMessageIndex` lands on the *optimistic*
user message (which `ChatPaneInterface.tsx:326` injects into the `listMessages`
TanStack cache via `setData`), making the active-turn slice empty and the
dedup filter a no-op.

## Reproduction

**Failing test**: `packages/chat/src/client/hooks/use-chat-display/use-chat-display-race.test.ts`

Run: `bun test packages/chat/src/client/hooks/use-chat-display/use-chat-display-race.test.ts`

Evidence: `.spec/improvements/SUPER-753/evidence/failing-test-output.txt`

The test deterministically reproduces the race by constructing the exact
merged-list state the UI enters during the flicker window and asserting that
no assistant messages survive in `historicalMessages`. The committed test
output (27 lines) shows:

```
expect(received).toEqual(expected)
- []
+ ["a_1"]
(fail) dual-poll race — flicker reproduction (FAILING)
0 pass / 1 fail / 1 expect() calls
```

## Root cause

`packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts:33-38` —
`findLastUserMessageIndex` walks the merged message list from the tail looking
for `role === "user"`. **It does not distinguish optimistic messages from real
user messages.** When the optimistic message sits AFTER an in-flight assistant
message in the list (which is the universal state during the new-session
first-send window), it lands on the optimistic message and reports the wrong
turn boundary. Downstream, `activeTurnMessages = messages.slice(turnStartIndex)`
becomes empty, the dedup filter runs on `[]`, and the in-flight assistant
message survives in `historicalMessages` while ALSO rendering via
`currentMessage`. Two simultaneous renders → flicker.

Both optimistic-message creation sites use the prefix `"optimistic-"`:
- `use-chat-display.ts:240` → `` `optimistic-${Date.now()}` ``
- `apps/desktop/.../optimisticUserMessage.ts:16` → `` `optimistic-${crypto.randomUUID()}` ``

The fix exploits this invariant.

## Binding scope (chosen: challenger-smaller / Option 4)

### Acceptance criteria

- **AC-1**: `bun test packages/chat/src/client/hooks/use-chat-display/use-chat-display-race.test.ts` exits 0.
- **AC-2**: `bun test packages/chat/src/client/hooks/use-chat-display/use-chat-display.test.ts` exits 0 (no regression in the adjacent existing tests).
- **AC-3**: Human verification — start a fresh chat session, send a message, observe **no duplicate/flickering assistant message** in the first response turn. (A residual brief user-message flash from the dual optimistic-channel state is a separate issue tracked as FU-2 and is OUT OF SCOPE here.)

### Files in scope

- `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts`
- `packages/chat/src/client/hooks/use-chat-display/use-chat-display-race.test.ts` (the failing test the investigator added; must pass after the fix)

Anything outside these two paths is OUT OF SCOPE and the implementer must refuse.

### Out of scope

- Consolidating the dual optimistic-message injection paths (Path A
  `ChatPaneInterface.setData` + Path B `useChatDisplay.setOptimisticUserMessage`).
  Tracked as FU-2.
- H10 text-equality reconciliation in the `optimisticUserMessage` `useEffect`.
  Tracked as FU-2.
- The `fps: 60` polling override at `ChatPaneInterface.tsx:273`. Tracked as
  FU-1 (one-line fix, separate ticket).
- Introducing a tRPC subscription / push-based stream. That is FU-3 / the
  Option 3 strategic direction, owned by the `chat-v2` and `justinrich-chatbugs`
  greenfield worktrees.
- Closing the "session still starting" gap (`use-chat-display.ts:224-229`).
  Tracked as FU-4 — the ticket author's other concern, separate defect.

### Risks

- **R-1**: The `"optimistic-"` prefix is an informal convention, not a typed
  contract. If a future code-path creates an optimistic user message with a
  different ID format, the dedup filter will silently break again.
  Mitigation: the inline `// INVARIANT` comment on the patched predicate
  anchors the convention at the read site; the existing failing test will
  re-fail if the convention is broken.
- **R-2**: The fix does NOT consolidate the dual optimistic-message paths,
  so a residual brief *user-message* flash can occur when both paths fire
  simultaneously. This is the H10 / FU-2 family bug and is explicitly
  out of scope here. AC-3 verification should focus on the
  *assistant-message* flicker; a user-message flash is a known separate
  issue.
- **R-3**: Two worktrees (`chat-v2`, `justinrich-chatbugs`) are concurrently
  rewriting `use-chat-display.ts` to a reducer-based subscription
  architecture. The 3-LOC change here will need a trivial rebase resolution
  when those land (or will be deleted outright as part of the rewrite). Risk
  is minimal — the change is inside a private function with no exported-API
  rename, no new public surface.

## Considered alternatives

- **Option 1 — investigator minimum (~20 LOC)**.
  Same conceptual fix (exclude optimistic messages from turn-boundary search)
  but with a larger LOC footprint and bundles in AC-4 (consolidate dual
  optimistic paths). **Rejected**: superseded by Option 4. The dual-path
  consolidation is FU-2 cleanup, not part of the flicker fix.

- **Option 2 — moderate (~50 LOC)**.
  Option 1 plus delete `ChatPaneInterface`'s `setData` injection so all
  optimistic state flows through one channel. **Rejected**: touches
  `ChatPaneInterface.tsx` lines 319-348, which is the exact region under
  active rewrite in both greenfield worktrees. Medium-high conflict surface
  for a structural improvement that belongs in FU-2 anyway.

- **Option 3 — strategic (~400-600 LOC, push-based tRPC subscription)**.
  The ticket author's proposed approach and confirmed by deep research as
  the universal industry pattern (OpenCode, Vercel AI SDK, assistant-ui).
  **Rejected for this ticket** — not because it's wrong, but because it's
  already being built by the `chat-v2` and `justinrich-chatbugs` greenfield
  worktrees. Landing a competing SUPER-753 PR would create direct merge
  conflict and duplicate work. Deferred to the greenfield sprint
  (`plans/v2-chat-greenfield-architecture.md`).

## Challenger notes

Challenger (`code-reviewer`, fresh-eyes) made three load-bearing contributions:

1. **Caught a vacuous evidence file** — the investigator's
   `failing-test-output.txt` initially contained only the bun version header,
   not the actual test failure. Orchestrator re-ran the test and saved the
   genuine 27-line failure transcript. Bug verified code-provable, so status
   remained `proposal` not `investigation-incomplete`.
2. **Proposed Option 4 — the 3-LOC micro-patch** — by reading
   `findLastUserMessageIndex` carefully and recognizing that the entire fix
   collapses to a single predicate change inside the existing private
   function. The investigator's ~20 LOC Option 1 had over-scoped.
3. **Flagged scope creep in Options 2 and 3** — pointed out that
   `ChatPaneInterface.tsx` changes (Option 2) and the new server-side
   procedures (`runtime.ts`, `zod.ts`, `service.ts` in Option 3) aren't
   required by the failing test and are cleanly separable as follow-ups.

## Long-term direction (research-anchored)

Deep research (holocron `js7f89mppq9p4h7hthdp883a0h8735de`, HIGH confidence,
15 sources) confirms the long-term architecture is the push-based stream that
Option 3 / `chat-v2` / `justinrich-chatbugs` are building toward:

- **One tRPC subscription** (observable, per `apps/desktop/AGENTS.md`)
  forwarding the mastracode harness event stream.
- **Client-side reducer** folding events into a single `messages` array.
- **Server-authoritative message IDs** so optimistic / committed states match
  by ID and no heuristic dedup is needed.
- **Pre-create the session** before the input mounts (Vercel canonical
  pattern) so the `"session still starting"` guard is dead code.

When that lands, `withoutActiveTurnAssistantHistory`, the
optimistic-reconciliation `useEffect`, and both optimistic-injection paths all
get deleted together. This 3-LOC patch is a deliberate stopgap and is expected
to be deleted as part of the greenfield rewrite.

## Scope amendments

_(none — populated only if scope changes during implementation; any amendment
requires re-binding.)_

## Deferred follow-ups

See `.spec/improvements/SUPER-753/follow-ups.md` for FU-1 (60fps polling
override), FU-2 (dual optimistic paths + H10 text reconciliation), FU-3
(eliminate dedup filter via subscription — owned by greenfield), FU-4
(session-start gap).
