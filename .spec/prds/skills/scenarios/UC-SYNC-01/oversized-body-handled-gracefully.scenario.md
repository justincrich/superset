---
service: skills
feature: UC-SYNC-01
priority: P1
type: error_handling
---
# SKILL.md with a 10MB body is handled without crashing

A misbehaving plugin includes a SKILL.md whose body is 10MB of accidental log output (real bug pattern). The FilesystemImporter must complete parsing without OOM-ing the Electron main process, but should reject the import with a logged warning: `"[skills] Skipping {path}: body exceeds 1MB limit"` and a Sonner toast surfaced via the `Failed imports (N)` accordion in the Settings UI. No DB row is written. The watcher continues processing other events. The 1MB cap is documented in the technical requirements.
