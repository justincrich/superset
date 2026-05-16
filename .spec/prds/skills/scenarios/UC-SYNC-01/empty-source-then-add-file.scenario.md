---
service: skills
feature: UC-SYNC-01
priority: P0
type: happy_path
---
# Adding a SKILL.md to a previously empty enabled source root imports it

The user has the `project` source enabled, pointing at `<workspace.cwd>/.agents/skills`, but no SKILL.md folders exist yet. The user creates `<workspace.cwd>/.agents/skills/release-checklist/SKILL.md` with valid frontmatter (name, description) and a markdown body. Within 2 seconds of file creation: the watcher emits `add`, the FilesystemImporter parses the file, the SkillRepo upserts a row with `kind='external'`, `source_id='project'`, `name='release-checklist'`, `source_path` set, `imported_at` populated. Typing `/release-checklist` in chat resolves and inlines the body.
