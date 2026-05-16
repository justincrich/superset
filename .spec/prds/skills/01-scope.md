---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
scope_posture: full
---

# Scope

## Scope Posture

**Full feature** (default — `kb-prd-plan` always assumes a complete, polished initiative). This PRD is sized as ONE shippable initiative spanning ~5 implementation phases (~5 sprints) culminating in a single human testing gate per sprint. If reality requires cuts, see the Cut Rules signal in [README.md](./README.md).

## In Scope

### Storage and registry
- New `skills` SQLite table in `@superset/local-db` with columns: `id, name, description, body, frontmatter (json), kind ('custom'|'external'), source_id, source_path, source_priority, supporting_files (json), enabled, created_at, updated_at, imported_at`
- `UNIQUE(source_id, name)` constraint
- `(name, kind, source_priority)` index for resolver queries
- New `settings.skillSources: SkillSourceConfig[]` JSON column for source configuration
- Both schema changes generated via a single `bunx drizzle-kit generate --name=add_skills` migration

### Filesystem import and auto-sync
- `SkillImporter` interface + `FilesystemImporter` implementation
- Default sources seeded on first launch:
  - `project` (priority 90) — `<workspace.cwd>/.agents/skills/*/SKILL.md`
  - `project-claude` (priority 85) — `<workspace.cwd>/.claude/skills/*/SKILL.md`
  - `claude` (priority 70) — `~/.claude/skills/*/SKILL.md`
  - `plugins` (priority 50) — `~/.claude/plugins/cache/*/*/skills/*/SKILL.md` (qualifyWith=`derived`, latest semver only)
- User can add custom filesystem source roots via settings
- `@parcel/watcher` subscription per active source root, debounced (200ms)
- `p-queue` (concurrency=1) per source serializes watcher events against the importer transaction
- Cache invalidation fires AFTER transaction commits, not on raw watcher event
- Per-plugin mutex / `INSERT … ON CONFLICT DO UPDATE WHERE imported_at > excluded.imported_at` to prevent parallel-version race
- Hard-delete row on file `unlink`
- Manual "Refresh now" button in settings as escape hatch

### Resolution at chat time
- Slash command registry (`packages/chat/src/server/desktop/slash-commands/registry.ts`) extended with `kind: "skill"` entries unioned from the skills table
- 1-second TTL cache wraps the SQL query (matches existing `buildSlashCommandRegistry` cache pattern)
- Optional harness prefix at typing: `/brainstorming` (unprefixed → first wins) or `/superpowers:brainstorming` (qualified → exact match)
- First-wins ordering: `(CASE kind WHEN 'custom' THEN 0 ELSE 1 END, source_priority DESC, created_at ASC) LIMIT 1`
- Body inlined into the user's prompt and forwarded to whichever agent CLI is attached to the workspace

### Custom skill authoring
- SkillEditor (markdown body + frontmatter form fields: name, description, allowed-tools, model)
- Stored only in DB with `kind='custom'`, `source_id='superset'`
- Name validation: `^[a-z][a-z0-9-]*$`, unique across custom skills
- Read-only protection: external skills cannot be edited from Superset
- Delete with confirmation dialog; hard-deletes DB row + triggers exporter teardown for that skill

### Per-harness exporters
- `SkillExporter` interface: `{ agentId, isApplicable(), sync(skills), teardown() }`
- `ClaudeExporter`: builds `~/.superset/skills-bundle/<name>/` (symlink to origin for external, materialized SKILL.md for custom), then symlinks bundle into `~/.claude/skills/superset-skills/`. Realpath check prevents loops. Atomic via temp+rename.
- `MastraExporter`: writes `~/.mastracode/tools/superset-skills.ts` registering a `load_skill` tool whose description enumerates skills, body fetched via loopback HTTP at runtime. **Spike required** before implementation: confirm mastracode tool auto-discovery contract.
- `NoopExporter` for cursor/gemini/codex/copilot/droid/pi/amp/opencode in v1 — typed-command path is the universal fallback. Logs once on first attach so user knows native auto-invocation is unavailable for that harness.
- Triggers: agent-setup boot AND debounced 2s `SkillRepo` change events

### tRPC API
- `skills.list / get / getByName / create / update / delete / runImport / listSources / updateSources / exportToHarness` — queries and mutations
- `skills.onChanged` subscription via `observable()` (NOT async generator; per `trpc-electron` constraint)

### Settings UI
- Skills sidebar entry under "Editor & Workflow" group, after Agents
- Skills overview list (filter, source chips, "+ New custom skill", "Refresh now")
- SkillEditor for kind='custom', SkillPreview for kind='external'
- Sources panel sub-route at `/settings/skills/sources` with drag-priority (dnd-kit + KeyboardSensor) and enable toggles
- `SkillBadge` component (12 variants, 3 sizes) shown in every list and on the existing `SkillToolCall` tile
- Empty states + error copy for: no skills, missing source path, watcher inotify limit, malformed frontmatter, validation failures, confirm-delete dialogs, refresh-in-progress, unsupported-agent banner

### Slash command picker integration
- Existing chat input slash picker extended to show skills section alongside commands
- Shadowed entries (same name from lower-priority source) shown with reduced opacity + qualified form sub-row
- Keyboard navigation: ↑↓ between rows, ⏎ insert, → expand shadowed to qualified picker

## Out of Scope

The following are deliberately deferred. Each is a real future feature, not a missing piece of v1.

- **Cross-source merge / conflict picker UI** — no diff viewer, no "which one wins" prompt, no content-hash dedup. Resolver picks deterministically; users disambiguate via the `/source:` qualified form. `[DEFERRED: separate PRD]`
- **Cloud sync of custom skills** — DB stays local. Team-share via cloud Postgres mirror is a v2 follow-up. `[DEFERRED: separate PRD]`
- **Skill versioning / rollback** — no in-app history of authored skills. Use git on the staging dir or external backup. `[DEFERRED: separate PRD]`
- **Two-way sync** — editing a symlinked file under `~/.claude/skills/superset-skills/` does NOT propagate back to the Superset DB. The exporter overwrites it on next sync. Documented as known limitation. `[DEFERRED: separate PRD]`
- **OpenCode TS-plugin format support** — only SKILL.md folders are imported in v1. OpenCode's TypeScript plugin format requires its own importer. `[DEFERRED: separate PRD]`
- **OpenCodeExporter beyond Noop** — UC-EXPORT-03 covers the Noop fallback for v1. Promotion to a real exporter is a Phase 5 stretch goal alongside MastraExporter, contingent on the mastracode integration spike succeeding. If both succeed, OpenCodeExporter ships as a v1.x patch. `[DEFERRED: separate sprint]`
- **Mastra/OpenCode `description`-list pagination at >50 skills** — token cost gets noticeable past ~50 skills in the generated tool description. v2 may add per-skill "include in agent surface" toggle. `[DEFERRED: separate PRD]`
- **Auto-conflict warnings when exporter would overwrite an existing skill in target dir** — ClaudeExporter writes under a nested `superset-skills/` namespace specifically to avoid this; user's pre-existing skills are protected by Claude Code's own precedence. v1 does not warn. `[DEFERRED: separate PRD]`
- **Author-back UI for external skills** — read-only enforced. Editing an imported skill means editing it at its source filesystem location. `[DEFERRED: separate PRD]`
- **Skill dependency resolution** — skill A referencing skill B's body is unsupported. `[DEFERRED: separate PRD]`
- **Plugin source non-recursive watching beyond top 2 levels** — node-planner risk #2 mitigation. Manual re-scan per plugin dir on add/change is in scope; deeper auto-watching is out. `[DEFERRED: separate PRD]`
