---
service: skills
feature: UC-CHAT-02
priority: P0
type: happy_path
---
# Qualified /superpowers:brainstorm resolves the exact (source_id, name) match

The user has `custom:brainstorm` shadowing `superpowers:brainstorm`. They explicitly type `/superpowers:brainstorm` (typing the full qualified form, not selecting from picker). The SkillResolver query is `SELECT * FROM skills WHERE enabled=1 AND source_id='plugin:superpowers' AND name='superpowers:brainstorm' LIMIT 1`. The exact superpowers row returns; the custom row is bypassed. The body inlined is the superpowers body, not the user's custom version. No first-wins logic runs for qualified queries.
