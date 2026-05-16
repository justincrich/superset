---
service: skills
feature: UC-EXPORT-01
priority: P0
type: happy_path
---
# Custom skill created in Superset appears inside a fresh Claude CLI session

The user creates a custom skill `release-checklist` in Superset. Within 2 seconds: ClaudeExporter.sync() runs, materializes the body to `~/.superset/skills-bundle/release-checklist/SKILL.md` (with valid YAML frontmatter regenerated from the DB row), creates a symlink `~/.claude/skills/superset-skills/release-checklist` pointing to the bundle dir. The user then runs `claude` in a terminal (fresh session). Claude Code's native skill discovery walks `~/.claude/skills/`, sees the `superset-skills/release-checklist/SKILL.md` entry, and surfaces it in its skill list. The user can invoke it via Claude Code's native Skill tool call without any further configuration.
