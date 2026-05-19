# Downstream Branches — Multi-Harness Skill Import & Sync

**Source of truth**: this branch (`skills`) is the local integration / scratch home for all work on the [Multi-Harness Skill Import & Sync](./README.md) initiative. The branches listed below are clean, reviewable slices of that work, each rebased into the stacked-PR shape the new team needs to land it incrementally.

The `skills` branch is **never pushed as a PR**. It exists only so the maintainer can keep cumulative context locally while the per-sprint branches ship through review.

> **Important model change (2026-05-19):** The per-PR branches now strip `plans/prds/skills/**` content. The PRD scaffolding lives only on `skills` (this branch). Each PR branch carries the **tooling / runtime** delta its sprint introduces — no PRD doc updates inside the PR. Upstream reviewers see clean, focused diffs; the maintainer keeps the PRD work locally on `skills`.

## Stack diagram

```
upstream main (superset-sh/superset)
  └─ tsgo            ← PR #2  (Sprint 1 — tsgo)         ✅ OPEN — superset-sh/superset#4725
       └─ skills-hooks   ← PR #3  (Sprint 2 — lefthook + init-project)  ✓ committed locally
            └─ skills-fallow              ← PR #4 (Sprint 3 — Fallow, 🟡 proposed)
                 └─ skills-walking-skeleton   ← PR #5 (Sprint 4)
                      └─ skills-filesystem-import ← PR #6 (Sprint 5)
                           └─ skills-live-watch        ← PR #7 (Sprint 6)
                                └─ skills-claude-exporters  ← PR #8 (Sprint 7)
                                     └─ skills-extended-exporters ← PR #9 (Sprint 8)
```

**Removed from stack:** `skills-pr` (the docs-only PR #1 branch). With PRDs excluded from upstream PRs, the docs-only PR is no longer meaningful — the umbrella PRD lives entirely on `skills`.

Each downstream branch inherits all upstream tooling content. `skills-hooks` sees everything `tsgo` ships; the eventual `skills-extended-exporters` will see everything.

## Existing local branches

| Branch | Base | Worktree | Last commit | Ships |
|---|---|---|---|---|
| `tsgo` | `origin/main` (upstream) | `.claude/worktrees/skills-tsgo` | `chore(tooling): migrate typechecker from tsc to tsgo` | 49 files: 28 package.json typecheck swaps (`tsc --noEmit` → `tsgo --noEmit`), 14 tsconfig migrations, 3 new `env.d.ts`, 2 latent mobile type-fixes, `@typescript/native-preview` root dev dep, `bun.lock` updates. **No PRD content.** Open as PR #4725 against upstream main. |
| `skills-hooks` | `tsgo` | `.claude/worktrees/skills-hooks` | `chore(tooling): Sprint 2 — agent-gated commit hooks + init-project guardrails` | 7 files: `lefthook.yml`, postinstall hook install, `.claude/settings.json` deny + hooks, CLAUDE.md "Pre-existing claims" rule, biome.jsonc ignores, lefthook dev dep, `bun.lock` updates. **No PRD content.** |

## Planned branches (not yet created)

| Branch | Base | Ships when |
|---|---|---|
| `skills-fallow` | `skills-hooks` | Sprint 3 scope locks via `/kb-prd-plan --feedback` |
| `skills-walking-skeleton` | `skills-fallow` | Sprint 4 starts (custom-skill authoring + slash-resolution walking skeleton) |
| `skills-filesystem-import` | `skills-walking-skeleton` | Sprint 5 (external skills + Sources panel UI) |
| `skills-live-watch` | `skills-filesystem-import` | Sprint 6 (`@parcel/watcher` + live tRPC subscription) |
| `skills-claude-exporters` | `skills-live-watch` | Sprint 7 (ClaudeExporter symlink bundle + NoopExporter fallback) |
| `skills-extended-exporters` | `skills-claude-exporters` | Sprint 8 (MastraExporter + OpenCodeExporter, spike-gated) |

## How to navigate

```bash
# List the live worktrees mapped to each branch
git worktree list

# Switch into a specific PR branch's worktree
cd .claude/worktrees/skills-tsgo                       # contains the `tsgo` branch (dir name unchanged for now)
git log --oneline -3

# See what each PR's diff looks like against its base
cd .claude/worktrees/skills-tsgo    && git diff origin/main..HEAD --stat
cd .claude/worktrees/skills-hooks   && git diff tsgo..HEAD --stat
```

## How new sprint branches are created

Each new branch is built **from the most recent upstream branch in the stack**, never from `skills` directly:

```bash
# Sprint 3 (Fallow), once scope locks:
cd /Users/justinrich/Projects/superset
git worktree add .claude/worktrees/skills-fallow -b skills-fallow skills-hooks
# ... cherry-pick or copy implementation files into the worktree
# ... do NOT touch plans/prds/skills/ — that work stays on the `skills` branch
# ... commit
```

The `.claude/worktrees/<name>/` convention keeps each branch's working tree isolated from the others, which is critical when multiple PRs are in flight simultaneously.

## How this relates to `STATUS.md`

`STATUS.md` (only on the `skills` scratch branch — PR branches no longer carry PRD content) is the maintainer's live cross-PR tracker. **`BRANCHES.md` (this file, also only on `skills`)** is a per-maintainer navigation aid for the local integration source. Both serve the same audience now (the maintainer); reviewers see only the per-PR diffs upstream.

## Push protocol

The `skills` branch is **never pushed**. Only the per-sprint PR branches are pushed when ready to open a PR:

```bash
git push -u fork tsgo                                                 # upstream PR #2 (Sprint 1)
gh pr create --repo superset-sh/superset --base main --head justincrich:tsgo --body-file <body.md>

# Future:
git push -u fork skills-hooks                                         # upstream PR #3 (Sprint 2)
gh pr create --repo superset-sh/superset --base main --head justincrich:skills-hooks --body-file <body.md>
# (Each PR opens against upstream main with --base main; the stack is implicit in the locally-maintained branch lineage.)
```

If the maintainer ever wants to discard the local scratch history and start fresh, `git checkout skills && git reset --hard origin/main` is safe — the PR branches are independent and won't be affected.
