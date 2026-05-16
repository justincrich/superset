---
service: skills
feature: UC-CHAT-03
priority: P1
type: happy_path
---
# Repeated /brainstorm resolution within 1s hits the TTL cache and returns under 50ms

The user types `/brainstorm` and submits (cold cache: SQL query runs, ~10-30ms). Immediately, in the same chat session, they type `/brainstorm` again 500ms later. The SkillResolver TTL cache (1s) returns the cached `SelectSkill` row directly without re-running the SQL query. End-to-end resolution time for the second invocation is under 50ms (measurable via instrumentation). The cache key includes workspace.cwd so switching workspaces invalidates per-workspace entries.
