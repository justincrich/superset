---
service: skills
feature: UC-SYNC-02
priority: P1
type: edge_case
---
# Rapid edit + delete + re-add sequence converges to the correct final state

The user runs a script that, in 500ms: edits SKILL.md (change), deletes the parent folder (unlink), then `git checkout`s a different version of the same folder (add). The watcher fires three events. Per-source p-queue (concurrency=1) processes them strictly in order. After all three commit, the final `skills` row matches the third version exactly: `body` is the checked-out content, `updated_at` is the most recent timestamp, no orphaned row remains in either of the intermediate states. The resolver TTL cache is invalidated at most once after the final transaction (debounced by p-queue boundary).
