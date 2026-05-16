---
service: skills
feature: UC-CHAT-01
priority: P0
type: happy_path
---
# Typing /brainstorm resolves the highest-priority match and inlines the body

The user types `/brainstorm` in the chat input. The slash picker appears showing the SKILLS section with `brainstorm` as the top entry, custom SkillBadge, description preview. The user presses Enter. The chat input now displays a slash-command chip for `brainstorm`, indistinguishable from how a built-in command renders. The user types additional context and submits the message. The full prompt sent to the underlying agent CLI is `<resolved skill body>\n\n<user-typed extra context>`. The agent receives this as a single user message with the skill body fully expanded.
