---
service: skills
feature: UC-AUTH-02
priority: P1
type: edge_case
---
# Clicking an external skill in the sidebar routes to read-only SkillPreview, not SkillEditor

The user clicks the row for `claude:brainstorm` (kind='external') in the Skills sidebar. The detail pane renders SkillPreview, NOT SkillEditor: the body is shown via the chat markdown renderer (read-only), the frontmatter fields are read-only labels, the header has `[Open at origin ↗]` instead of `[Delete]`, and there are no Save / blur-save affordances. Attempting to call `skills.update` mutation against this row's id throws `TRPCError 'FORBIDDEN'` server-side (defense in depth — the UI already prevents it, but the API enforces it too).
