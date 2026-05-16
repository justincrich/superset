---
service: skills
feature: UC-SRC-03
priority: P0
type: happy_path
---
# First launch with no settings.skillSources seeds four defaults

A fresh user installs Superset and opens it for the first time. The `settings` row's `skill_sources` JSON is NULL. On boot, the system seeds exactly 4 source configs into the column, in priority order: `project` (90, scope=workspace, root=`<workspace.cwd>/.agents/skills`), `project-claude` (85, scope=workspace, root=`<workspace.cwd>/.claude/skills`), `claude` (70, scope=global, root=`~/.claude/skills`), `plugins` (50, scope=global, root=`~/.claude/plugins/cache`, qualifyWith=`derived`). Settings → Skills → Sources shows all four immediately. Switching workspaces re-binds the two project sources to the new workspace's cwd without re-seeding.
