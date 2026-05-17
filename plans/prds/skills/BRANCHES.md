# Downstream Branches — Multi-Harness Skill Import & Sync

**Source of truth**: this branch (`skills`) is the local integration / scratch home for all work on the [Multi-Harness Skill Import & Sync](./README.md) initiative. The branches listed below are clean, reviewable slices of that work, each rebased into the stacked-PR shape the new team needs to land it incrementally.

The `skills` branch is **never pushed as a PR**. It exists only so the maintainer can keep cumulative context locally while the per-sprint branches ship through review.

## Stack diagram

```
main (upstream)
  └─ skills-pr           ← PR #1  (docs only)              ✓ committed
       └─ skills-tsgo    ← PR #2  (Sprint 1 — tsgo)         ✓ committed
            └─ skills-hooks   ← PR #3  (Sprint 2 — lefthook + init-project)  ✓ committed
                 └─ skills-fallow              ← PR #4 (Sprint 3 — Fallow, 🟡 proposed)
                      └─ skills-walking-skeleton   ← PR #5 (Sprint 4)
                           └─ skills-filesystem-import ← PR #6 (Sprint 5)
                                └─ skills-live-watch        ← PR #7 (Sprint 6)
                                     └─ skills-claude-exporters  ← PR #8 (Sprint 7)
                                          └─ skills-extended-exporters ← PR #9 (Sprint 8)
```

Each downstream branch inherits all upstream content. `skills-hooks` sees everything `skills-pr` + `skills-tsgo` ship; the eventual `skills-extended-exporters` will see everything.

## Existing local branches

| Branch | Base | Worktree | Last commit | Ships |
|---|---|---|---|---|
| `skills-pr` | `origin/main` | `.claude/worktrees/skills-pr` | `docs(skills): introduce Multi-Harness Skill Import & Sync PRD (v1.3.0)` | The 17-file PRD scaffold — README, STATUS, ROADMAP, 13 numbered sections, no implementation |
| `skills-tsgo` | `skills-pr` | `.claude/worktrees/skills-tsgo` | `chore(tooling): Sprint 1 — migrate typechecker to tsgo` | 28 package.json typecheck swaps, 14 tsconfig migrations, 3 new env.d.ts, 2 mobile fixes, `@typescript/native-preview` dev dep, PRD Sprint 1 status flip |
| `skills-hooks` | `skills-tsgo` | `.claude/worktrees/skills-hooks` | `docs(skills): document rationale for agent git-capability blocks (Sprint 2)` | `lefthook.yml`, postinstall hook install, `.claude/settings.json` deny + hooks, CLAUDE.md "Pre-existing claims" rule, biome.jsonc ignores, lefthook dev dep, PRD Sprint 2 status flip, rationale section |

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
cd .claude/worktrees/skills-tsgo
git log --oneline -3

# See what each PR's diff looks like against its base
cd .claude/worktrees/skills-pr      && git diff origin/main..HEAD --stat
cd .claude/worktrees/skills-tsgo    && git diff skills-pr..HEAD --stat
cd .claude/worktrees/skills-hooks   && git diff skills-tsgo..HEAD --stat
```

## How new sprint branches are created

Each new branch is built **from the most recent upstream branch in the stack**, never from `skills` directly:

```bash
# Sprint 3 (Fallow), once scope locks:
cd /Users/justinrich/Projects/superset
git worktree add .claude/worktrees/skills-fallow -b skills-fallow skills-hooks
# ... cherry-pick or copy implementation files into the worktree
# ... fill in 06-uc-fallow.md Change gating section
# ... update plans/prds/skills/STATUS.md Sprint 3 row
# ... commit
```

The `.claude/worktrees/<name>/` convention keeps each branch's working tree isolated from the others, which is critical when multiple PRs are in flight simultaneously.

## How this relates to `STATUS.md`

`STATUS.md` (on each PR branch, starting with `skills-pr`) is the live cross-PR tracker — PR URLs, merge SHAs, in-flight markers. **`BRANCHES.md` (this file, only on `skills`)** is a per-maintainer navigation aid for the local integration source. Don't try to keep them in lock-step; they serve different audiences:

- `STATUS.md` is for **reviewers / collaborators** seeing the stack from the GitHub side
- `BRANCHES.md` is for **the maintainer** working locally across all the worktrees

## Push protocol

The `skills` branch is **never pushed**. Only the `skills-*` PR branches are pushed when ready to open a PR:

```bash
git push -u origin skills-pr      # or skills-tsgo, skills-hooks, etc.
gh pr create --base main --head skills-pr --body-file <body.md>
# (PR #2 uses --base skills-pr, PR #3 uses --base skills-tsgo, etc.)
```

If the maintainer ever wants to discard the local scratch history and start fresh, `git checkout skills && git reset --hard origin/main` is safe — the PR branches are independent and won't be affected.
