---
stability: PRODUCT_CONTEXT
last_validated: 2026-05-15
prd_version: 1.0.0
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
