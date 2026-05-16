---
stability: PRODUCT_CONTEXT
last_validated: 2026-05-16
prd_version: 1.3.0
---

# Multi-Harness Skill Import & Sync

## Product description

A unified, DB-backed skill registry inside Superset that **discovers SKILL.md folders from every relevant filesystem location** (Claude Code user dir, Claude Code plugin caches, project `.agents/skills/` and `.claude/skills/`, plus user-added custom roots), **persists them to local SQLite via an auto-syncing watcher**, and **surfaces them through two delivery channels**:

1. **Universal typed slash commands** (`/skill-name` or `/source:skill-name`) that work in chat against *any* underlying agent CLI by inlining the skill body into the prompt.
2. **Native skill registration** through per-harness exporters (Claude Code symlink bundle, Mastracode `load_skill` tool, OpenCode plugin) so models can auto-invoke skills via the agent's own mechanism where one exists.

Users can also **author custom skills directly in Superset** through a markdown editor; custom skills always win over imported ones with the same name.

## Problem statement

Superset is a multi-harness desktop chat — its `agent-setup/` layer wraps Claude Code, OpenCode, mastracode, Cursor, Codex, Gemini, Copilot, Droid, Pi, and Amp. Skills today live wherever each harness defines them:

- **Claude Code** has SKILL.md folders at `~/.claude/skills/` and inside plugin caches
- **Plugin packages** (`superpowers`, `pixel-perfect`, `frontend-design`, …) ship dozens of curated skills bundled inside `~/.claude/plugins/cache/`
- **Project conventions** put portable skills under `.agents/skills/` (per Superset's own AGENTS.md)
- **Other harnesses** (mastracode, OpenCode) have no native SKILL.md story, or have it in incompatible formats
- **No harness sees the others' skills** — switching workspaces from Claude Code to Codex makes your skill library invisible

The result: users retype the same instructions, copy SKILL.md bodies into prompts manually, or only use skills inside the one harness that knows about them. A `Skill(...)` tool-call UI tile already exists in Superset's chat for displaying upstream skill loads — but Superset itself has no skill registry of its own, no authoring path, and no cross-harness federation.

## Solution summary

Superset becomes the **canonical skill hub** across every attached harness:

- **One registry** — a `skills` table in `@superset/local-db` (SQLite) holds every skill from every source, auto-maintained by a `@parcel/watcher`-based filesystem watcher (already in the dependency tree via `packages/workspace-fs`).
- **Federated discovery** — default sources cover the four real-world locations users have today; any user can add custom roots in settings.
- **Two delivery channels** — typed `/skill-name` works on every harness; per-harness exporters bridge into native skill mechanisms (Claude Code symlink bundle at `~/.claude/skills/superset-skills/`, mastracode `load_skill` tool generation, OpenCode plugin file) where supported.
- **Author-back in v1** — a markdown editor in Settings → Skills creates custom skills (`kind='custom'`, `source_id='superset'`) that propagate through the same exporters to every harness that supports skills.
- **Deterministic resolution** — first-wins ordering (`custom` > `source_priority` desc > `created_at` asc) eliminates conflict UIs while still letting power users pin a specific source via the optional `/source:skill-name` qualified form.

The architecture is a strict superset of the existing `slash-commands` system in `packages/chat/src/server/desktop/slash-commands/`. Skills appear in the same picker, get the same `/foo` invocation surface, and inherit the same per-workspace project precedence.

The name "Multi-Harness Skill Import & Sync" reflects both the central value (multi-harness federation) and the two delivery directions (read sources in, export to harnesses out).

---

## Why the tooling investments (Sprints 1–3)

The skills feature is documented in the use case files below. But **before any of it ships**, three tooling sprints (1–3) deliver the infrastructure that makes the skills work safe to build with a multi-agent team. **This section makes the case for that infrastructure** to anyone reviewing the Sprint 1–3 PRs — particularly teammates new to the codebase who reasonably ask why a feature PRD is leading with three sprints of tooling.

Each tooling sprint exists because of a specific failure mode the team will hit *without* it.

### Sprint 1 — tsgo migration (PR `skills-tsgo`) — without it, Sprint 2 is unworkable

**The status quo cost.** Today's `bun run typecheck` takes minutes across the 28-package monorepo. That's tolerable when you run it occasionally — but Sprint 2's pre-commit gate will run typecheck on **every agent commit**. A minutes-long pre-commit blocks agent iteration and trains agents to bypass the gate. A fast typechecker is the precondition for fast agent feedback loops.

**What tsgo will deliver.** Microsoft's official Go port of TypeScript (`@typescript/native-preview`) checks the same code 5–10× faster. The Superset monorepo's full type check should run in **~3s cold / ~377ms warm** (measured during a spike). Per-package incremental checks complete in under 1 second.

**Side benefits the team gets for free.**
- Catches real type bugs in `apps/mobile/components/ui/{context-menu,dropdown-menu}.tsx` that tsc silently accepts — `Platform.select` returning Falsy strings to an `AbsoluteFillStyle` slot. Pre-existing, latent, fixed during the migration.
- Cleans up 13 tsconfigs with deprecated `baseUrl` settings. TS 7 removes `baseUrl`; the migration future-proofs the codebase.
- One dev dependency, no runtime additions. Migration is mechanical and reversible (a `FORCE_TSC=1` env-var rollback ships as part of the same PR).

**The risk of not doing this.** Sprint 2's pre-commit gate either ships and slows every agent commit by minutes (defeating the gate's purpose), or doesn't ship at all (no agent-discipline floor). The skills work (Sprints 4–8) involves heavy cross-package refactoring; without the typecheck safety net, agent regressions reach review and CI instead of being caught at commit.

### Sprint 2 — Agent-gated commit hooks (PR `skills-hooks`) — closes the regression loop

**The status quo cost.** Agents make broad changes across many files. Type errors and lint failures often land in PRs because the agent didn't run the checks locally. Reviewers waste cycles on `bun run typecheck` failures that should have been caught at commit. Worse, agents have a documented tendency to rationalize away pre-existing failures ("not my concern", "out of scope", "pre-existing") — even when they introduced the breakage themselves.

**What the agent-gated lefthook will deliver.** A pre-commit phase that runs `bun run lint` + `bun run typecheck` in parallel — *but only when* `SUPERSET_AGENT_ID` is set. Superset's existing wrapper layer (`apps/desktop/src/main/lib/agent-setup/`) already exports `SUPERSET_AGENT_ID="<agent-name>"` for every wrapped agent CLI (claude, codex, opencode, mastracode, cursor, gemini, copilot, droid, pi, amp). Plain-terminal human commits skip the entire phase with minimal overhead (~30ms lefthook startup). Pre-push runs `bun test`. A secondary `SUPERSET_AGENT_GATE_ENABLED=0` env var provides per-developer opt-out without touching the lefthook config.

**Defense in depth.** Claude Code project settings deny `git commit --no-verify` and Edit/Write to `.claude/settings.json` and `.claude/hooks/**`, so agents cannot bypass the gate or tamper with the deny list.

**The risk of not doing this.** Agent regressions ship through review. CI catches them but only after a human has spent time reading the diff. As agent usage scales — and Superset's whole pitch is multi-harness agent usage — this cost compounds. The discipline floor needs to be automatic, not aspirational.

### Sprint 3 — Fallow dead-code gate (PR `skills-fallow`, 🟡 proposed) — catches the cruft agents leave behind

**The status quo cost.** Agents are productive but messy. They add new modules and leave old ones unused. They export functions they "might use later". They create utility files that get imported once and forgotten. Without a deletion-confidence signal, **dead code accumulates faster than humans can clean it**. Multi-agent codebases rot faster than single-agent ones.

**What Fallow delivers.** [Fallow](https://docs.fallow.tools/) is a TypeScript/JavaScript static analyzer that detects unused files, unused exports, unused dependencies, and code duplication. It runs as `npx fallow dead-code` (CLI), surfaces findings in VS Code via Code Lens, and exposes an MCP server that Claude Code and Cursor can query during agent planning. The free tier covers static analysis; a paid runtime layer adds production execution data for high-confidence deletion.

**Sprint 3 deliverable (proposed).** Integrate Fallow into:
1. **The agent-gated lefthook from Sprint 2** — agent commits run `fallow dead-code` and fail the commit if the unused-export count regresses.
2. **The Superset agent MCP surface** — agents can query Fallow's MCP server during planning so they don't ship dead exports in the first place.
3. **A CI gate** — PRs fail if total unused-file count regresses without an explanatory note.

Concrete acceptance criteria and the human testing gate land in Sprint 3's planning kickoff (`/kb-prd-plan --feedback "Fallow scope: <one-line summary>"`).

**The risk of not doing this.** Six months of multi-agent development without Fallow looks like a codebase where ~30% of exports are unused, refactors are scary because nobody knows what's dead, and onboarding a new engineer takes longer because they can't tell live code from drift. The cost is invisible until it's overwhelming — exactly the kind of risk worth catching now while the team is small.

### The overall case

Sprints 1–3 are **platform investments, not feature work**. They cost ~1–2 sprints of EM time each but pay off for *every* sprint after them — both the skills work in Sprints 4–8 and any future feature work the team takes on. They're scoped to this PRD because they are the **enabling pre-conditions for the skills feature to be safely built with this many agents**, but each is written so the team can review and merge them independently as `skills-tsgo`, `skills-hooks`, and `skills-fallow` PRs ahead of the skills work.

**Summary table for reviewers in a hurry:**

| Sprint | Without it | With it | Cost |
|---|---|---|---|
| 1 — tsgo | minutes-long typecheck, unusable in pre-commit | ~3s cold / 377ms warm | 1 dev dep, 14 tsconfig edits, 28 script swaps |
| 2 — commit hooks | agent regressions land in PRs; reviewers waste cycles | every agent commit runs strict lint+typecheck; humans untouched | 1 dev dep, 1 yaml config, postinstall + denylist |
| 3 — Fallow | invisible dead-code accumulation as agents scale | regressions blocked at commit + queryable by agents via MCP | 1 dev dep (free tier), 1 CI workflow, 1 hook command — to scope in Sprint 3 kickoff |

---

## Change gating summary

Each Sprint's PR ships its implementation behind a containment mechanism so the new team can land changes incrementally without all-or-nothing risk. Reviewers can see at a glance what's behind which gate and how to roll back if a regression bites. Per-sprint detail lives in the corresponding UC file's **Change gating & blast radius** section.

| Sprint | Default after merge | Per-developer opt-out | Team-wide rollback | What this change cannot break |
|---|---|---|---|---|
| 1 — tsgo | **On** — `bun run typecheck` uses tsgo | `FORCE_TSC=1 bun run typecheck` (per-shell) | Revert PR; the `typecheck:tsc` fallback script stays in tree | Any runtime code — this is build tooling only |
| 2 — commit hooks | **On for wrapped agents only**; humans bypass via the existing `SUPERSET_AGENT_ID` skip | `SUPERSET_AGENT_GATE_ENABLED=0` (per-shell); `LEFTHOOK=0 git commit` (per-commit) | Flip the default in `lefthook.yml`'s skip condition | Non-agent workflows; CI; existing `git push` flows |
| 3 — Fallow | **Proposed: off until baseline locked**; agents see the rule but it doesn't block | `SUPERSET_FALLOW_ENABLED=0` (per-shell) | Flip the default in `lefthook.yml` | Typecheck, lint, runtime; existing Biome rules |
| 4–8 — skills feature | **Off until `SUPERSET_SKILLS_ENABLED=1`** at app boot | Unset the env var (default state) | Flip the default in `apps/desktop/src/main/lib/feature-flags.ts` (lands with Sprint 4) | Every existing chat surface, slash command, or agent flow |

The Sprint 4–8 hybrid gate uses three layers: env var checked in the Electron main process at boot, tRPC middleware short-circuiting `skills.*` procedures when the gate is off, and a Settings UI conditional that hides the Skills sidebar entry. Documented in detail in [`13-technical-requirements.md` § Feature flag layout](./13-technical-requirements.md).
