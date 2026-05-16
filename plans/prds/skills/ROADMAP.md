---
roadmap: 1
project: Multi-Harness Skill Import & Sync
generated: 2026-05-16T00:00:00Z
prd: plans/prds/skills/README.md
sprint_count: 8
---

# Sprint Roadmap: Multi-Harness Skill Import & Sync

## Overview

**Sprints:** 8 (7 planned, 1 proposed)
**Total Tasks:** ~55 across all 8 sprints
**Current Sprint:** none — this `skills-pr` PR ships documentation only. Sprint 1 starts when `skills-tsgo` opens.

Live PR / merge status: see [`STATUS.md`](./STATUS.md).

## Sprint Sequence

| # | Sprint | Gate | Tasks | Dependencies | Status |
|---|--------|------|-------|--------------|--------|
| 1 | [Sprint 01: tsgo migration](#sprint-01-tsgo-migration) | `bun run typecheck` completes in ≤5s warm-cache; all 28 packages succeed | 8 | — | 🔵 Planned |
| 2 | [Sprint 02: Agent-gated commit hooks](#sprint-02-agent-gated-commit-hooks) | Wrapped-agent commit runs strict lint+typecheck; plain-terminal commit skips clean | 5 | Sprint 01 | 🔵 Planned |
| 3 | [Sprint 03: Fallow dead-code gate](#sprint-03-fallow-dead-code-gate) | Wrapped-agent commit runs `fallow dead-code` and blocks regression; agents query Fallow via MCP during planning | 7 | Sprint 02 | 🟡 Proposed |
| 4 | [Sprint 04: Skills · Walking Skeleton](#sprint-04-skills--walking-skeleton) | User authors a custom skill in Settings → Skills, types `/skill-name` in chat, sees body inlined | 8 | Sprint 03 | 🔵 Planned |
| 5 | [Sprint 05: Skills · Filesystem Import](#sprint-05-skills--filesystem-import) | User clicks Refresh in Settings; Claude/plugin/project skills appear with source badges; `/source:skill` qualified form works | 7 | Sprint 04 | 🔵 Planned |
| 6 | [Sprint 06: Skills · Live Watch](#sprint-06-skills--live-watch) | User edits SKILL.md externally; Settings list reflects change within 2s without refresh | 5 | Sprint 05 | 🔵 Planned |
| 7 | [Sprint 07: Skills · Claude + Noop Exporters](#sprint-07-skills--claude--noop-exporters) | Fresh `claude` CLI session auto-invokes a Superset-authored skill via Claude Code's native Skill tool | 8 | Sprint 06 | 🔵 Planned |
| 8 | [Sprint 08: Skills · Mastra + OpenCode Exporters](#sprint-08-skills--mastra--opencode-exporters) | A mastracode session calls `load_skill({name})` and receives the body from Superset's registry | 7 | Sprint 07 | 🔵 Planned |

---

## Per-Sprint Details

### Sprint 01: tsgo migration

**Sequence:** 1
**Timeline:** Phase 1 (tooling foundation)
**Status:** 🔵 Planned
**PR branch:** `skills-tsgo` (stacked on `skills-pr`)

#### Human Testing Gate

**Gate:** A developer can run `bun run typecheck` on the monorepo root and see all 28 packages complete in under 5 seconds on a warm Turbo cache, with the same error format as `tsc` for editor/CI compatibility.

**Test Steps:**
1. Clone the repo fresh and run `bun install`.
2. Run `bun run typecheck` from the project root.
3. Confirm the output shows `28 successful, 28 total` and total time under 5 seconds with cache.
4. Edit one TypeScript file in any package, save, and re-run `bun run typecheck`.
5. Confirm only the affected package re-runs and others remain cached.
6. Introduce an obvious type error, run `bun run typecheck`, confirm the error is reported in the same format `tsc` used to emit.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| TSGO-001 | Remove deprecated `baseUrl` from 13 tsconfigs | node-implementer | 90 min |
| TSGO-002 | Fix `packages/auth` `emitDeclarationOnly` parent override | node-implementer | 15 min |
| TSGO-003 | Add `types: ["node"]` to `packages/email` tsconfig | node-implementer | 10 min |
| TSGO-004 | Add bun + CSS ambient declarations to `packages/ui/src/env.d.ts` | node-implementer | 30 min |
| TSGO-005 | Add CSS ambient declarations to `packages/panes` + `apps/mobile` | node-implementer | 30 min |
| TSGO-006 | Cast `Platform.select` branches in `apps/mobile/components/ui/{context-menu,dropdown-menu}.tsx` | react-native-ui-implementer | 30 min |
| TSGO-007 | Swap `tsc --noEmit` → `tsgo --noEmit` in 28 package.json scripts | node-implementer | 30 min |
| TSGO-008 | Add `@typescript/native-preview` dev dependency | node-implementer | 5 min |

#### Dependencies

- Blocks: Sprint 02
- Dependent on: None

#### PRD Coverage

- [TSGO functional group](./04-uc-tsgo.md) — UC-TSGO-01, UC-TSGO-02, UC-TSGO-03

---

### Sprint 02: Agent-gated commit hooks

**Sequence:** 2
**Timeline:** Phase 1 (tooling foundation)
**Status:** 🔵 Planned
**PR branch:** `skills-hooks` (stacked on `skills-tsgo`)

#### Human Testing Gate

**Gate:** A wrapped-agent `git commit` triggers `bun run lint` + `bun run typecheck` and blocks on failure; a plain-terminal `git commit` skips the gate cleanly with no behavior change to the human developer experience.

**Test Steps:**
1. From a plain shell session (no `SUPERSET_AGENT_ID` exported), run `git commit --allow-empty -m "human test"`.
2. Confirm lefthook output shows `(skip) hook setting` and the commit lands immediately with no lint or typecheck execution.
3. Run `SUPERSET_AGENT_ID=manual git commit --allow-empty -m "agent test"`.
4. Confirm lefthook runs `bun run lint` and `bun run typecheck` in parallel and the commit lands when both pass.
5. Introduce a lint warning in a TypeScript file, attempt the commit again with the env var set, and confirm the commit is blocked.
6. Attempt `SUPERSET_AGENT_ID=manual git commit --no-verify -m "bypass"` and confirm Claude Code denies the bash command at tool-call time.
7. Attempt `git push` with the env var set against a fresh branch — confirm `bun test` runs as the pre-push gate.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| HOOK-001 | Author `lefthook.yml` with phase-level `SUPERSET_AGENT_ID` skip | devops-engineer | 30 min |
| HOOK-002 | Add `lefthook` dev dependency + `lefthook install` to `scripts/postinstall.sh` | devops-engineer | 15 min |
| HOOK-003 | Write `.claude/settings.json` with deny + hooks block via `/init-project` | devops-engineer | 30 min |
| HOOK-004 | Append "Pre-existing claims require proof" rule to `CLAUDE.md` | devops-engineer | 5 min |
| HOOK-005 | Add Biome ignores for `.claude/settings.local.json` + `.spec/` | devops-engineer | 10 min |

#### Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01

#### PRD Coverage

- [HOOK functional group](./05-uc-hook.md) — UC-HOOK-01, UC-HOOK-02, UC-HOOK-03, UC-HOOK-04

---

### Sprint 03: Fallow dead-code gate

**Sequence:** 3
**Timeline:** Phase 1 (tooling foundation)
**Status:** 🟡 Proposed — concrete acceptance criteria locked in Sprint 3 planning kickoff
**PR branch:** `skills-fallow` (stacked on `skills-hooks`)

#### Human Testing Gate

**Gate:** A wrapped-agent `git commit` runs `npx fallow dead-code`, blocks the commit when the unused-export count regresses against the tracked baseline, and the agent can additionally query Fallow's MCP server during planning to identify existing dead code before writing new code.

**Test Steps:**
1. Run `npx fallow dead-code --json` against the monorepo and confirm it produces a JSON report listing unused exports and files.
2. Run `npx fallow baseline --update` and confirm `.fallow/baseline.json` is written and committed.
3. Introduce a new unused export in a package, attempt a wrapped-agent commit (`SUPERSET_AGENT_ID=manual git commit -m "regress dead code"`), and confirm the commit is blocked with a clear delta error listing the new unused export and its file path.
4. Remove the unused export, re-run the commit, and confirm it lands.
5. Confirm `.mcp.json` includes Fallow's MCP server entry and restart Claude Code in the workspace.
6. Ask Claude Code "list the current dead exports in `packages/shared`" and confirm the agent returns Fallow's findings via the MCP tool call.
7. Open a PR that increases dead-code count without an `fallow-allow:` note in the body, and observe the CI Fallow check fail with a delta report.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FALLOW-001 | SPIKE — verify Fallow MCP server stability for daily agent use | node-planner | 60 min |
| FALLOW-002 | Add `fallow` dev dependency | devops-engineer | 5 min |
| FALLOW-003 | Add `fallow dead-code` step to `lefthook.yml` pre-commit phase | devops-engineer | 30 min |
| FALLOW-004 | Establish initial baseline file + lock the budget policy (strict vs N-per-PR) | devops-engineer | 45 min |
| FALLOW-005 | Configure Fallow MCP in `.mcp.json` + document setup in project README | devops-engineer | 30 min |
| FALLOW-006 | Add Fallow check to CI workflow with PR-body `fallow-allow:` override | devops-engineer | 45 min |
| FALLOW-007 | Documentation in `README.md` + onboarding notes for the new team | devops-engineer | 30 min |

#### Dependencies

- Blocks: Sprint 04
- Dependent on: Sprint 02

#### PRD Coverage

- [FALLOW functional group](./06-uc-fallow.md) — UC-FALLOW-01, UC-FALLOW-02, UC-FALLOW-03

---

### Sprint 04: Skills · Walking Skeleton

**Sequence:** 4
**Timeline:** Phase 2 (skills foundation)
**Status:** 🔵 Planned
**PR branch:** `skills-walking-skeleton` (stacked on `skills-fallow`)

#### Human Testing Gate

**Gate:** A user can author a custom skill in Settings → Skills, type `/skill-name` in chat, and see the skill's body inlined into the prompt sent to whichever agent CLI is attached to the workspace.

**Test Steps:**
1. Launch Superset desktop and attach any agent (Claude Code, Cursor, anything wrapped) to a workspace.
2. Navigate to Settings → Skills → click "+ New custom skill".
3. Enter name `deploy-check`, a one-line description, and a multi-line markdown body. Save.
4. Return to the chat input, type `/deploy-check`, and press Enter.
5. Confirm the skill body is inlined into the prompt and submitted to the attached agent (the agent's response should reflect the body content).
6. Return to Settings → Skills, edit the body, save, and re-invoke `/deploy-check` in chat. Confirm the updated body is used.
7. Delete the skill via the AlertDialog confirmation. Confirm `/deploy-check` no longer auto-completes or resolves.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| SKILL-001 | Drizzle schema for `skills` table + `settings.skillSources` via `drizzle-kit generate` | node-implementer | 60 min |
| SKILL-002 | `SkillRepo` (Drizzle CRUD wrapper) | node-implementer | 60 min |
| SKILL-003 | `parseSkillFrontmatter` extending existing slash-commands frontmatter parser | node-implementer | 30 min |
| SKILL-004 | `SkillResolver` with 1s TTL cache + SQL query (first-wins ordering) | node-implementer | 90 min |
| SKILL-005 | Extend slash-command registry with `kind:"skill"` entries | node-implementer | 45 min |
| SKILL-006 | tRPC `skillsRouter` — list / get / create / update / delete procedures | node-implementer | 60 min |
| SKILL-007 | `bun:test` coverage for resolver priority + frontmatter parsing | node-implementer | 90 min |
| SKILL-008 | Settings UI — Skills sidebar entry, `SkillEditor` (markdown + frontmatter form), Delete dialog | react-vite-ui-implementer | 180 min |

#### Dependencies

- Blocks: Sprint 05
- Dependent on: Sprint 03

#### PRD Coverage

- [AUTH functional group](./09-uc-auth.md) — UC-AUTH-01, UC-AUTH-02, UC-AUTH-03
- [CHAT functional group](./10-uc-chat.md) — UC-CHAT-01 (custom-only path)

---

### Sprint 05: Skills · Filesystem Import

**Sequence:** 5
**Timeline:** Phase 3 (external skills + sources UI)
**Status:** 🔵 Planned
**PR branch:** `skills-filesystem-import` (stacked on `skills-walking-skeleton`)

#### Human Testing Gate

**Gate:** A user with the Claude Code `superpowers` plugin installed clicks "Refresh now" in Settings → Skills and sees plugin + Claude + project skills appear in the list with source badges; typing `/superpowers:brainstorming` in chat resolves to the plugin's skill via the qualified-form picker.

**Test Steps:**
1. Have Claude Code installed with the `superpowers` plugin (or any plugin with SKILL.md folders). Open Superset.
2. Navigate to Settings → Skills → click "Refresh now".
3. Within 5 seconds, confirm skills from `~/.claude/skills/`, `~/.claude/plugins/cache/superpowers/`, project `.agents/skills/`, and project `.claude/skills/` all appear in the list.
4. Confirm each row displays a source badge matching its origin (Claude Code orange, Plugin · superpowers violet, Project amber, etc.) with icon + label.
5. Navigate to Settings → Skills → Sources, confirm the four default sources are listed with drag handles and enable toggles.
6. Type `/brainstorming` in chat — confirm the slash picker shows all variants with their source badges and the unprefixed entry resolves to the first-wins match.
7. Type `/superpowers:brainstorming` (qualified) — confirm exact-match resolution bypasses first-wins ordering.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| IMPORT-001 | `SkillImporter` interface + `FilesystemImporter` implementation | node-implementer | 90 min |
| IMPORT-002 | `SkillSourceConfig` defaults seeded on first boot (4 default sources) | node-implementer | 45 min |
| IMPORT-003 | Plugin namespace handling (`plugin:<name>:<skill>`) + max-semver dedup | node-implementer | 60 min |
| IMPORT-004 | tRPC `skills.runImport` + `skills.listSources` + `skills.updateSources` | node-implementer | 60 min |
| IMPORT-005 | Settings UI — Sources panel sub-route with drag-priority + enable toggles | react-vite-ui-implementer | 240 min |
| IMPORT-006 | `SkillBadge` component (12 variants × 3 sizes) | react-vite-ui-implementer | 120 min |
| IMPORT-007 | `bun:test` fixtures with real `node:fs` (no mocks per project rules) | node-implementer | 90 min |

#### Dependencies

- Blocks: Sprint 06
- Dependent on: Sprint 04

#### PRD Coverage

- [SRC functional group](./07-uc-src.md) — UC-SRC-01, UC-SRC-02, UC-SRC-03
- [SYNC functional group](./08-uc-sync.md) — UC-SYNC-01, UC-SYNC-03, UC-SYNC-04
- [CHAT functional group](./10-uc-chat.md) — UC-CHAT-02

---

### Sprint 06: Skills · Live Watch

**Sequence:** 6
**Timeline:** Phase 4 (auto-sync + correctness)
**Status:** 🔵 Planned
**PR branch:** `skills-live-watch` (stacked on `skills-filesystem-import`)

#### Human Testing Gate

**Gate:** A user can edit a SKILL.md file in an external editor while Superset is running and see the Skills settings list reflect the change within 2 seconds without manually clicking Refresh.

**Test Steps:**
1. Open Superset, navigate to Settings → Skills, confirm at least one Claude Code skill is visible in the list.
2. Open that skill's SKILL.md file in an external editor (VS Code, vim, anywhere outside Superset).
3. Modify the `description` line in the YAML frontmatter, save the file.
4. Within 2 seconds, observe the Skills settings list show the updated description.
5. Type `/<skill-name>` in chat — confirm the autocomplete preview shows the updated description.
6. Delete the SKILL.md file from disk via `rm` or the OS file manager.
7. Within 2 seconds, observe the skill disappear from the Skills list and slash command autocomplete.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| WATCH-001 | `SkillSourceWatcher` using `@parcel/watcher` (per-source subscription) | node-implementer | 60 min |
| WATCH-002 | Per-source `p-queue` (concurrency=1) for watcher event serialization | node-implementer | 45 min |
| WATCH-003 | Cache invalidation hook fires AFTER importer transaction commit (NOT raw event) | node-implementer | 45 min |
| WATCH-004 | tRPC `skills.onChanged` subscription via `observable()` (NOT async generator, per trpc-electron) | node-implementer | 60 min |
| WATCH-005 | Renderer-side live UI updates via the subscription | react-vite-ui-implementer | 90 min |

#### Dependencies

- Blocks: Sprint 07
- Dependent on: Sprint 05

#### PRD Coverage

- [SYNC functional group](./08-uc-sync.md) — UC-SYNC-02
- [CHAT functional group](./10-uc-chat.md) — UC-CHAT-03

---

### Sprint 07: Skills · Claude + Noop Exporters

**Sequence:** 7
**Timeline:** Phase 5 (native skill registration)
**Status:** 🔵 Planned
**PR branch:** `skills-claude-exporters` (stacked on `skills-live-watch`)

#### Human Testing Gate

**Gate:** A user authors a custom skill in Superset and opens a fresh `claude` CLI session in a terminal; Claude Code auto-invokes the skill via its native Skill tool when the conversation context warrants it. The same workspace switched to a Cursor-attached agent falls back to typed `/skill-name` invocation with the body inlined, and a persistent banner explains the inline path is in use.

**Test Steps:**
1. With Superset running, author a custom skill named `pr-template` with a body describing how to draft a thorough PR description.
2. Open a fresh `claude` CLI session in a terminal in a project where Claude Code is configured.
3. In the Claude chat, ask "Draft a PR description for these changes" against a sample diff.
4. Confirm Claude Code invokes the `Skill(pr-template)` tool call automatically (visible in the chat UI as a Skill tile).
5. In Superset, switch the workspace to a Cursor-attached agent.
6. Type `/pr-template` in Superset chat, confirm the skill body is inlined as a user message and submitted to Cursor.
7. Confirm a persistent banner appears in Settings → Skills explaining that Cursor uses the inline-body path.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| EXPORT-001 | `SkillExporter` interface + `SkillExportOrchestrator` (debounced 2s on SkillRepo events) | electrobun-implementer | 60 min |
| EXPORT-002 | `ClaudeExporter` — builds `~/.superset/skills-bundle/` + symlinks bundle into `~/.claude/skills/superset-skills/` | electrobun-implementer | 120 min |
| EXPORT-003 | `ClaudeExporter` `realpath` loop check + atomic temp+rename | electrobun-implementer | 60 min |
| EXPORT-004 | `ClaudeExporter` materializes `kind='custom'` skills to staging dir before linking | electrobun-implementer | 45 min |
| EXPORT-005 | `NoopExporter` for cursor/gemini/codex/copilot/droid/pi/amp/opencode (logs once per session) | electrobun-implementer | 30 min |
| EXPORT-006 | `HarnessSupportBanner` UI component for unsupported agents | react-vite-ui-implementer | 60 min |
| EXPORT-007 | `skill-importer-init` action wired into `desktop-agent-setup.ts` boot path | electrobun-implementer | 30 min |
| EXPORT-008 | `skills.exportToHarness` tRPC manual trigger | node-implementer | 30 min |

#### Dependencies

- Blocks: Sprint 08
- Dependent on: Sprint 06

#### PRD Coverage

- [EXPORT functional group](./11-uc-export.md) — UC-EXPORT-01, UC-EXPORT-03 (Noop fallback)

---

### Sprint 08: Skills · Mastra + OpenCode Exporters

**Sequence:** 8
**Timeline:** Phase 5 (extended exporters)
**Status:** 🔵 Planned
**PR branch:** `skills-extended-exporters` (stacked on `skills-claude-exporters`)

#### Human Testing Gate

**Gate:** A mastracode CLI session can call `load_skill({name})` and receive the body from Superset's registry as the tool result. If the OpenCode integration spike succeeds, OpenCode agents get the equivalent surface.

**Test Steps:**
1. With Superset running and mastracode CLI installed, open a fresh mastracode session.
2. Ask the agent to list available Superset skills.
3. Confirm the agent enumerates the skill list via the generated `load_skill` tool's description field.
4. Ask the agent to apply a specific skill (e.g., "use the pr-template skill on this diff").
5. Confirm the agent calls `load_skill({name: 'pr-template'})` and receives the full body as the tool result.
6. Modify the skill body in Superset, restart the mastracode session, ask the agent to load the same skill, confirm the updated body returns.
7. (Stretch — if OpenCode spike succeeded) Repeat steps 1–6 with an OpenCode session; otherwise observe that OpenCode falls back to the `NoopExporter` from Sprint 07.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| EXPORT-009 | SPIKE — confirm mastracode tool auto-discovery contract for `~/.mastracode/tools/*.ts` | electrobun-implementer | 60 min |
| EXPORT-010 | SPIKE — confirm OpenCode plugin file location + JS-format expectations | electrobun-implementer | 60 min |
| EXPORT-011 | `MastraExporter` writes `~/.mastracode/tools/superset-skills.ts` with `load_skill` tool | electrobun-implementer | 120 min |
| EXPORT-012 | Loopback HTTP endpoint in Electron main using `@hono/node-server` | electrobun-implementer | 90 min |
| EXPORT-013 | `MastraExporter` loopback auth token management | electrobun-implementer | 60 min |
| EXPORT-014 | `OpenCodeExporter` (contingent on EXPORT-010 spike — Noop fallback if blocked) | electrobun-implementer | 90 min |
| EXPORT-015 | End-to-end test against real mastracode CLI (no mocks per project rules) | electrobun-implementer | 90 min |

#### Dependencies

- Blocks: (end of initiative)
- Dependent on: Sprint 07

#### PRD Coverage

- [EXPORT functional group](./11-uc-export.md) — UC-EXPORT-02; UC-EXPORT-03 promotion (OpenCode beyond Noop)

---

## Notes for the new team

- **No sprint has shipped yet.** This file is the planning artifact; live PR/merge state lives in [`STATUS.md`](./STATUS.md). Update STATUS as each PR opens and merges; this ROADMAP stays stable so re-planning (`--delta-replan`) diffs cleanly.
- **Sprint 3 (Fallow)** needs scope-lock before kickoff. Open scope questions live in `06-uc-fallow.md` — resolve the baseline strictness policy, the MCP integration scope, and the CI ownership before `/kb-sprint-plan --delta-replan` regenerates this sprint's section with concrete numbers.
- **Sprints 4–8 (skills)** are decomposed from the 5 implementation phases in [`13-technical-requirements.md`](./13-technical-requirements.md). The phase structure was reviewed during the original `/kb-prd-plan` ceremony with `node-planner` (EM) and `design-planner` — see [`12-team-contributions.md`](./12-team-contributions.md) for the architecture corrections that produced the dependency graph.
- **Estimates** are sprint-level placeholders. `/kb-sprint-tasks-plan` regenerates per-task estimates JIT when a sprint becomes active.
- **PR stacking**: each sprint becomes a PR stacked on its predecessor — `main ← skills-pr ← skills-tsgo ← skills-hooks ← skills-fallow ← skills-walking-skeleton ← skills-filesystem-import ← skills-live-watch ← skills-claude-exporters ← skills-extended-exporters`. Each downstream branch inherits all upstream content.
