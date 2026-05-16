---
service: skills
feature: UC-SRC-03
priority: P1
type: edge_case
---
# Missing default path on disk is flagged but not auto-removed

A user has never used Claude Code, so `~/.claude/skills/` does not exist. On first launch, the system still seeds the `claude` source row with enabled=true. The Sources panel renders the row with an amber `AlertTriangle` icon and the inline message `"Path missing on disk. Skills from this source can't be loaded until the directory exists."` The watcher does not crash; it logs a warning and remains in a not-subscribed-yet state. As soon as the user creates `~/.claude/skills/` (e.g., installs Claude Code later), the watcher attaches automatically on the next periodic check (15s) without requiring user action.
