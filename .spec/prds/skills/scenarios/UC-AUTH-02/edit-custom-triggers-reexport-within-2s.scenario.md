---
service: skills
feature: UC-AUTH-02
priority: P0
type: happy_path
---
# Editing a custom skill triggers re-export to active harnesses within 2 seconds

The user opens an existing custom skill `deploy-check` in the SkillEditor, modifies the body, and the field blurs (auto-save). Within 200ms: the SkillRepo `update` mutation runs, the row's `body` and `updated_at` are bumped. The SkillExportOrchestrator's 2s debounced listener fires; for each applicable exporter, it re-materializes this skill. Specifically, the ClaudeExporter rewrites `~/.superset/skills-bundle/deploy-check/SKILL.md` with the new body (atomic temp+rename). Within 2 seconds total, a fresh Claude Code session would see the updated body when reading `~/.claude/skills/superset-skills/deploy-check/SKILL.md`.
