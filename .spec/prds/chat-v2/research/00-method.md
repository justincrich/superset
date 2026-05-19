# 00 — Method

How these findings were produced. Use this to know what's in-scope, what's not, and what to re-validate before relying on a finding.

## Inputs

| Source | Type | Captured | Notes |
|---|---|---|---|
| [Chat UI V2 — Notion](https://www.notion.so/Chat-UI-V2-365b9d5bf61681f1908bf98108d80e2d) | PRD draft | 2026-05-19 | Page was read end-to-end via the Notion web app; full text captured into `01-prd-digest.md`. |
| `fork/main` @ `5da928183` | Source tree | 2026-05-19 | This branch (`chat-v2`) was created from this commit. |
| `apps/desktop/AGENTS.md` | Project rule | 2026-05-19 | Carries the `trpc-electron` observable-only constraint. |
| `chat-polish-spec` worktree | Sibling PRD | 2026-05-19 | Read for layout convention; scope is V2-GA polish, not this clean-slate V2. |

## What was crawled

- `packages/chat/src/**` — runtime service, client provider/hook, server desktop chat-service + slash-commands + title-gen, server trpc + hono surfaces, shared utilities.
- `packages/host-service/src/runtime/chat/**` and `packages/host-service/src/trpc/router/chat/**` — the host-service chat runtime + its tRPC router.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/.../ChatPane/**` — current canonical UI tree.
- `apps/desktop/src/renderer/components/Chat/ChatInterface/**` — older / parallel UI tree.
- `apps/desktop/src/lib/trpc/routers/chat-{runtime-,}service/**` — Electron IPC routers fronting the package.
- `apps/api/src/app/api/chat/**` — cloud chat endpoints (out of V2 scope but relevant for delta).
- `packages/db/src/schema/schema.ts` — `chatSessions`, `chatAttachments` table definitions.
- `packages/ui/src/components/ai-elements/**` — shared UI primitives already targeted by V2.
- `package.json` files for the chat + ui + desktop + host-service surfaces — captured exact versions of `ai`, `@ai-sdk/*`, `@mastra/*`, `mastracode`.

## What was NOT crawled

- The Mastra / `mastracode` internals. Treated as opaque dependency; V2 drops it so depth here adds cost without value.
- The `@openai/codex-sdk` source/docs. Not yet a dependency — needs a separate research pass before adapter design.
- Workspace lifecycle (`workspaces` schema, runtime-resolver) beyond the chat boundary.
- MCP server source (`packages/mcp`, the API at `/api/agent/mcp`). Referenced in the V2 PRD as a custom-tool host; depth here is a brainstorm follow-up.
- E2E tests, Playwright suites, Storybook — not relevant to the architectural decisions we need to land first.
- The web app's chat surface (mostly absent — confirmed via grep).
- Mobile (Expo) chat — not yet a target.

## Confidence

- **High** on the V1 code shape: every claim in `02-v1-state.md` points at a real file path that was opened or grep'd.
- **High** on the PRD digest: it's a paraphrase of a page I read in full, not synthesis from training data.
- **Medium** on the cutover decisions in `04-open-decisions.md`: those depend on context I don't have (the team's plans for the two parallel runtime surfaces and the two parallel renderer trees) — the brainstorm has to answer them.
- **Low** on the Codex SDK side: nothing in this research validates that `@openai/codex-sdk` supports the V2 plan's tool-registration shape — flagged in `04-open-decisions.md`.

## Re-validate before relying on

- The Notion PRD if more than a week has passed — owner may have iterated.
- The dependency versions if a workspace install ran on `fork/main` since 2026-05-19 — `ai@6.x` releases weekly.
- The two-parallel-surfaces situation (host-service `chatRouter` vs `packages/chat/.../ChatRuntimeService`) if any chat-package work merged after this commit.
