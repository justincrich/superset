---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
---

# Functional Groups

## Groups

| Prefix | Name | Description |
|---|---|---|
| **SRC** | Source Configuration | Configure which filesystem roots Superset scans for skills, with priority and enable/disable. |
| **SYNC** | Discovery & Auto-Sync | Watch source roots, parse SKILL.md files, persist to local DB, react to filesystem changes. |
| **AUTH** | Custom Skill Authoring | Write/edit/delete Superset-native skills directly in the app via inline markdown editor. |
| **CHAT** | Chat-Time Resolution | Surface skills as typeable slash commands; resolve `/foo` and `/source:foo` invocations during chat. |
| **EXPORT** | Harness Exporters | Materialize Superset's skill registry into each harness's native skill mechanism (Claude, Mastra, OpenCode), with Noop fallback for unsupported harnesses. |

## Use Case Summary

| Group | UC Count | Use Cases |
|---|---|---|
| SRC | 3 | UC-SRC-01, UC-SRC-02, UC-SRC-03 |
| SYNC | 4 | UC-SYNC-01, UC-SYNC-02, UC-SYNC-03, UC-SYNC-04 |
| AUTH | 3 | UC-AUTH-01, UC-AUTH-02, UC-AUTH-03 |
| CHAT | 3 | UC-CHAT-01, UC-CHAT-02, UC-CHAT-03 |
| EXPORT | 3 | UC-EXPORT-01, UC-EXPORT-02, UC-EXPORT-03 |
| **Total** | **16** | |
