---
stability: FEATURE_SPEC
last_validated: 2026-05-16
prd_version: 1.2.0
---

# Functional Groups

This initiative spans **8 functional groups across 24 use cases**, organized into two tiers:

- **Tooling tier** (Sprints 1–3) — enabling infrastructure that unblocks the product work
- **Product tier** (Sprints 4–8) — the skills feature itself

## Groups

### Tooling tier

| Prefix | Name | Description | Sprint |
|---|---|---|---|
| **TSGO** | Typechecker Migration | Replace `tsc` with `@typescript/native-preview` (tsgo) across the monorepo for fast typechecking on every commit. | Sprint 1 ✅ |
| **HOOK** | Agent-Gated Commit Hooks | Lefthook-based pre-commit/pre-push gate that runs strict checks for wrapped agents while leaving humans untouched. | Sprint 2 ✅ |
| **FALLOW** | Agent Observability via Fallow | Integration with the Fallow tool for agent telemetry and workflow observability. Scope TBD pending Sprint 3 planning kickoff. | Sprint 3 🟡 |

### Product tier

| Prefix | Name | Description | Sprint |
|---|---|---|---|
| **SRC** | Source Configuration | Configure which filesystem roots Superset scans for skills, with priority and enable/disable. | Sprint 5 |
| **SYNC** | Discovery & Auto-Sync | Watch source roots, parse SKILL.md files, persist to local DB, react to filesystem changes. | Sprints 5–6 |
| **AUTH** | Custom Skill Authoring | Write/edit/delete Superset-native skills directly in the app via inline markdown editor. | Sprint 4 |
| **CHAT** | Chat-Time Resolution | Surface skills as typeable slash commands; resolve `/foo` and `/source:foo` invocations during chat. | Sprints 4–6 |
| **EXPORT** | Harness Exporters | Materialize Superset's skill registry into each harness's native skill mechanism (Claude, Mastra, OpenCode), with Noop fallback for unsupported harnesses. | Sprints 7–8 |

## Use Case Summary

| Group | UC Count | Use Cases | Tier |
|---|---|---|---|
| TSGO | 3 | UC-TSGO-01, UC-TSGO-02, UC-TSGO-03 | Tooling |
| HOOK | 4 | UC-HOOK-01, UC-HOOK-02, UC-HOOK-03, UC-HOOK-04 | Tooling |
| FALLOW | 1 | UC-FALLOW-01 (placeholder) | Tooling |
| SRC | 3 | UC-SRC-01, UC-SRC-02, UC-SRC-03 | Product |
| SYNC | 4 | UC-SYNC-01, UC-SYNC-02, UC-SYNC-03, UC-SYNC-04 | Product |
| AUTH | 3 | UC-AUTH-01, UC-AUTH-02, UC-AUTH-03 | Product |
| CHAT | 3 | UC-CHAT-01, UC-CHAT-02, UC-CHAT-03 | Product |
| EXPORT | 3 | UC-EXPORT-01, UC-EXPORT-02, UC-EXPORT-03 | Product |
| **Total** | **24** | | |
