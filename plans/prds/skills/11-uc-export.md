---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
functional_group: EXPORT
---

# Use Cases: Harness Exporters (EXPORT)

| ID | Title | Description |
|---|---|---|
| UC-EXPORT-01 | Export skills to Claude Code via symlink bundle | Materialize the Superset skill registry into `~/.claude/skills/superset-skills/`. |
| UC-EXPORT-02 | Export skills to mastracode via load_skill tool | Generate `~/.mastracode/tools/superset-skills.ts` registering a `load_skill` Mastra tool. |
| UC-EXPORT-03 | Fall back to typed-command surface for unsupported harnesses | For agents without native skill mechanisms, the universal slash command path is the only delivery channel. |

## Change gating & blast radius

Sprints 4–8 ship behind a **unified hybrid gate**: the `SUPERSET_SKILLS_ENABLED=1` env var (Electron main process at boot) + tRPC middleware (short-circuits `skills.*` procedures when off) + Settings UI conditional (hides the Skills sidebar entry). Per-sprint specifics (what's safe to ship in front of the gate vs behind it) land in each sprint's implementation PR. See [`00-overview.md` § Change gating summary](./00-overview.md#change-gating-summary) for the rollup.

---

## UC-EXPORT-01: Export skills to Claude Code via symlink bundle

Materialize the Superset skill registry into `~/.claude/skills/superset-skills/` so Claude Code's native skill discovery picks them up without stomping on the user's pre-existing personal skills. Symlink bundle lives at `~/.superset/skills-bundle/` and is the link target.

### Acceptance Criteria

- ☐ ClaudeExporter can write or update a symlink for every enabled skill into `~/.superset/skills-bundle/<skill-name>/` on registry change
- ☐ ClaudeExporter can materialize `kind='custom'` skills (body + frontmatter rebuilt as SKILL.md) to a staging directory before symlinking so Claude Code reads a real file on disk
- ☐ ClaudeExporter can symlink `~/.superset/skills-bundle/` into `~/.claude/skills/superset-skills/` so all Superset-managed skills appear under one nested namespace inside Claude Code's skill dir
- ☐ ClaudeExporter can remove orphaned symlinks within `~/.superset/skills-bundle/` and the corresponding entries under `~/.claude/skills/superset-skills/` when the corresponding skill is deleted or disabled in Superset within 2 seconds
- ☐ ClaudeExporter can refuse to create a symlink when realpath resolution shows the bundle path is a prefix of the resolved target path (loop protection)
- ☐ ClaudeExporter can perform writes atomically via temp+rename so a partial sync never leaves the bundle dir in a broken state
- ☐ Underlying Agent (Claude Code) can auto-invoke a Superset-exported skill via its native Skill tool call without further user action
- ☐ System triggers ClaudeExporter.sync() on agent-setup boot AND on debounced (2 second) `SkillRepo` change events
- ☐ ClaudeExporter can no-op cleanly via `isApplicable()` returning false when `~/.claude/` does not exist on the user's machine

---

## UC-EXPORT-02: Export skills to mastracode via load_skill tool

Generate a `~/.mastracode/tools/superset-skills.ts` file that registers a `load_skill` Mastra tool exposing the Superset registry. The tool's `description` field enumerates every enabled skill with its tagline, so the model can pick which to load. Body fetched on-demand via Superset's local HTTP loopback.

### Acceptance Criteria

- ☐ MastraExporter can write a TypeScript file at `~/.mastracode/tools/superset-skills.ts` registering a `load_skill` tool whose options enumerate all enabled skills with `{name, description}`
- ☐ MastraExporter can re-write the tool file within 2 seconds of any registry mutation so mastracode sees the current skill set on next session
- ☐ MastraExporter can write a loopback auth token alongside the tool file so the generated `execute()` body can authenticate to Superset's local HTTP for body retrieval
- ☐ Underlying Agent (mastracode) can call `load_skill({ name })` and receive the full skill body as the tool result
- ☐ MastraExporter can no-op cleanly via `isApplicable()` returning false when `~/.mastracode/` does not exist on the user's machine
- ☐ System tags the MastraExporter implementation as **spike-pending** in v1: confirm mastracode tool auto-discovery contract before shipping; if the spike fails, MastraExporter degrades to NoopExporter behavior with a banner explaining the limitation

---

## UC-EXPORT-03: Fall back to typed-command surface for unsupported harnesses

For agents without native skill mechanisms (Cursor, Codex, Gemini, Copilot, Droid, Pi, Amp, OpenCode in v1), rely on the universal slash command path. The typed `/skill-name` invocation inlines the body regardless of which harness backs the workspace.

### Acceptance Criteria

- ☐ System uses the NoopExporter for every harness without a dedicated exporter implementation in v1 (cursor, codex, gemini, copilot, droid, pi, amp, opencode)
- ☐ User can invoke any registered skill as `/skill-name` and have the body inlined into the prompt regardless of which harness backs the workspace
- ☐ System exposes the same skill autocomplete list in the chat composer regardless of attached agent so the typed-command path is consistent across all harnesses
- ☐ System shows a persistent (non-dismissable) `<Alert variant="default">` at the top of the SkillDetail pane when the active workspace's agent does not support native skills, with title `"Skills are managed by Superset for {agentLabel}."` and description `"{agentLabel} doesn't have a built-in skill system, so Superset injects the skill body into the prompt when you type /skill-name. Skill behavior is identical, but extremely large skills may impact context."`
- ☐ NoopExporter can log once per app session per harness on first attach so the user knows native auto-invocation is unavailable for that harness
