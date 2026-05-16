---
service: skills
feature: UC-EXPORT-03
priority: P1
type: edge_case
---
# Switching from Cursor to Claude Code agent removes the banner and enables auto-invocation

The user is on a Cursor-attached workspace with the HarnessSupportBanner visible. They switch the workspace to a Claude Code agent. The active agent's `supportsSkills` flips to true. Within 1 second of the switch, the banner disappears from the SkillDetail pane (no toast, no persistent message). Subsequent typed `/skill-name` invocations still work via the inline path AND, because ClaudeExporter has already symlinked the skills, Claude Code's model can also auto-invoke the same skills through its native Skill tool call without the user typing anything.
