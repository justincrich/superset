---
service: skills
feature: UC-CHAT-02
priority: P1
type: error_handling
---
# Qualifying a name that doesn't exist returns a clear in-chat error

The user types `/claude:never-existed` and submits. The SkillResolver query returns null. Instead of forwarding an empty prompt to the agent, the chat surface inserts a system error message: `"No skill named 'claude:never-existed'. Type / to see available skills."` The user input remains in the composer for editing (not consumed). No agent call is made. No attempt to fall back to a fuzzy match — qualified queries are exact-match-or-fail.
