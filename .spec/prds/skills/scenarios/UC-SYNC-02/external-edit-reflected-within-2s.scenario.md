---
service: skills
feature: UC-SYNC-02
priority: P0
type: happy_path
---
# External edit to a SKILL.md is reflected in the resolver within 2 seconds

The user opens `~/.claude/skills/brainstorm/SKILL.md` in their editor and changes the `description` line in the frontmatter. They save the file. Within 2 seconds: the @parcel/watcher emits a `change` event, p-queue serializes it (concurrency=1) against any in-flight import, the FilesystemImporter re-parses the file inside a transaction, the SkillRepo upserts the row with the new description and bumped `updated_at`, the cache invalidation fires AFTER commit, and the next `/brainstorm` autocomplete preview shows the updated description text. No app restart required.
