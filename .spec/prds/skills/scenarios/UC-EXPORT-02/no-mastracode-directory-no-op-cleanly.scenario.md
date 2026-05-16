---
service: skills
feature: UC-EXPORT-02
priority: P1
type: edge_case
---
# MastraExporter no-ops cleanly when ~/.mastracode/ does not exist

A user does not have mastracode installed. `~/.mastracode/` does not exist. On every SkillRepo change event, the SkillExportOrchestrator iterates exporters; MastraExporter's `isApplicable()` returns false (because it stat's `~/.mastracode/` and gets ENOENT). The orchestrator skips this exporter without error. No file is created at any path under `~/.mastracode/`. The orchestrator log shows a single one-time-per-session info entry: `"[skills] MastraExporter not applicable: ~/.mastracode/ not found"`. If the user later installs mastracode and the directory appears, the next sync attempt finds `isApplicable()` returns true and the exporter begins writing.
