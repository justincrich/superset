---
service: skills
feature: UC-AUTH-01
priority: P0
type: happy_path
---
# Newly created custom skill is invokable in chat without restart

The user navigates to Settings → Skills → New, enters name `deploy-check`, description `"Pre-deploy verification checklist"`, body containing markdown checklist items, leaves frontmatter optional fields empty. They click Save. Within 200ms: a row is inserted into `skills` with `kind='custom'`, `source_id='superset'`, `enabled=true`. The user navigates back to chat (no restart, no refresh), types `/deploy-check`, and the slash autocomplete shows the skill with the `custom` SkillBadge. Pressing Enter inlines the body into the prompt. Cache invalidation triggered by the SkillRepo `upsert` event ensured the resolver saw the new row immediately.
