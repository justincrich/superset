---
service: skills
feature: UC-EXPORT-03
priority: P0
type: happy_path
---
# Cursor agent attached: banner shown, /skill still works via inline expansion

The user attaches a Cursor agent to a workspace. The active agent's `supportsSkills` is false. When the user navigates to Settings → Skills, the SkillDetail pane renders a persistent (non-dismissable) `<Alert variant="default">` at the top: `"Skills are managed by Superset for Cursor."` with the description explaining that Cursor doesn't have a built-in skill system. The user types `/release-checklist` in chat. The slash picker still shows the SKILLS section identically. Selecting it inlines the body into the prompt as a plain user message, which Cursor's CLI receives over its stdin transport. Cursor processes the inlined body as if the user had typed it.
