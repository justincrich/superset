---
service: skills
feature: UC-AUTH-03
priority: P0
type: happy_path
---
# Deleting a custom skill cleans up bundle dir and symlinks

The user deletes `deploy-check` (kind='custom') via the editor's Delete button + AlertDialog confirm. Within 2 seconds: (1) the row is hard-deleted from `skills`, (2) the SkillExportOrchestrator's debounced listener fires, (3) ClaudeExporter sees `deploy-check` is no longer in the registry and removes both `~/.superset/skills-bundle/deploy-check/` and the symlinked entry under `~/.claude/skills/superset-skills/deploy-check/`. Typing `/deploy-check` in chat after this returns "No skill named ..." (assuming no external skill of the same name exists).
