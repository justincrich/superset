---
stability: PRODUCT_CONTEXT
last_validated: 2026-05-15
prd_version: 1.0.0
---

# Roles

## User-facing roles

| Role | Description |
|---|---|
| **User** | Any Superset desktop user. Configures sources, authors custom skills, types slash commands in chat. Single-tenant per machine in v1 (no per-workspace permission split). |

## Persona archetypes

(Detailed personas in [09-team-contributions.md](./09-team-contributions.md). Listed here for AC reference.)

| Persona | What they do |
|---|---|
| Multi-Harness Power User (Justin) | Switches between agents per workspace; authors custom skills; relies on `/skill-name` working everywhere |
| Plugin Consumer (Priya) | Installs Claude Code plugin packs; expects bundled skills to surface across all chat sessions |
| Skill Author (Devon) | Captures repeated workflow knowledge as custom skills via the in-app editor |
| Cross-Tool Skeptic (Amir) | Standardized on mastracode/OpenCode; needs Superset to integrate without lock-in |

## System / actor roles (referenced in acceptance criteria)

| Role | Description |
|---|---|
| **System** | The Superset desktop app as a whole — covers cases where the actor is the runtime itself (seeding defaults, persisting rows, exposing tRPC) |
| **Watcher** | The `@parcel/watcher` subscription per source root. Detects filesystem add/change/unlink events and feeds them into the per-source `p-queue`. |
| **FilesystemImporter** | Reads SKILL.md, parses frontmatter, computes qualified name (with `derived` qualifier for plugin sources), upserts into `SkillRepo`. |
| **SkillRepo** | Drizzle-backed CRUD layer over the `skills` table. Emits `upsert` / `delete` / `reimport-complete` events on writes. |
| **SkillResolver** | SQL lookup with 1-second TTL cache; returns the first-wins skill for an unprefixed or qualified name. |
| **SkillExportOrchestrator** | Listens to `SkillRepo` events (debounced 2s); iterates active exporters; calls `isApplicable()` then `sync(skills)`. |
| **ClaudeExporter** | Builds `~/.superset/skills-bundle/`, symlinks it into `~/.claude/skills/superset-skills/`. Materializes custom skills to a staging dir before linking. |
| **MastraExporter** | Writes `~/.mastracode/tools/superset-skills.ts` registering a `load_skill` Mastra tool whose description enumerates skills. Spike-pending integration contract. |
| **OpenCodeExporter** | Stretch goal alongside Mastra. Writes plugin file at OpenCode's plugin location. v1 falls back to NoopExporter. |
| **NoopExporter** | Logs once per harness for cursor/gemini/codex/copilot/droid/pi/amp/opencode in v1. The typed `/skill-name` path is the universal fallback. |
| **Underlying Agent** | Whichever coding-agent CLI is attached to the active workspace (Claude Code, mastracode, OpenCode, Cursor, Codex, Gemini, Copilot, Droid, Pi, Amp). Receives the inlined body (typed path) or auto-invokes the skill via its native mechanism (exporter path). |
