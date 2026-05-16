---
service: skills
feature: UC-SYNC-04
priority: P1
type: edge_case
---
# Disabling an individual skill excludes it from /resolution but keeps it visible

The user has `claude:brainstorm` enabled and visible. They click the row's per-skill enabled toggle off. The row remains in the Settings list (so the user can re-enable later) but with a visibly muted appearance and a `Disabled` chip. The next `/brainstorm` invocation skips this row in the resolver query (because it filters `WHERE enabled=1`) and falls through to the next-priority match. If there is no other match, the typed `/brainstorm` shows the standard "No skill named ..." in-chat error. The slash picker omits this skill from autocomplete suggestions.
