---
service: skills
feature: UC-CHAT-03
priority: P0
type: error_handling
---
# Cache invalidation fires AFTER importer transaction commits, never on raw watcher event

A user is mid-resolution: the SkillResolver has a cached `SelectSkill` for `brainstorm` (cached at T+0ms, TTL 1000ms). At T+200ms, the user externally edits `brainstorm`'s SKILL.md. At T+250ms, the watcher fires `change` and the FilesystemImporter begins a transaction. At T+280ms, BEFORE the transaction commits, the resolver runs another query for `brainstorm`. The cache MUST NOT be invalidated yet (would force a SQL read that sees the half-applied state). The cached value is returned. At T+300ms, the transaction commits and the post-commit hook invalidates the cache. The next resolution at T+350ms sees the updated body. This sequence is enforced by the per-source p-queue (concurrency=1) and a transaction-completion listener, not by the raw watcher event.
