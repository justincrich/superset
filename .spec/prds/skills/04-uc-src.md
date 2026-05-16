---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
functional_group: SRC
---

# Use Cases: Source Configuration (SRC)

| ID | Title | Description |
|---|---|---|
| UC-SRC-01 | Configure skill source roots | Manage the ordered list of filesystem locations Superset scans for skills (defaults + user-added paths). |
| UC-SRC-02 | Toggle a source root on or off | Enable or disable scanning of a configured source root without removing it. |
| UC-SRC-03 | Seed default source roots on first launch | Pre-populate sensible default source roots so users get value without configuration. |

---

## UC-SRC-01: Configure skill source roots

Manage the ordered list of filesystem locations Superset scans for skills, including built-in defaults and user-added custom paths. Drives which sources contribute to the unified skill registry.

### Acceptance Criteria

- ☐ User can view the list of configured skill source roots in Settings → Skills with each root showing its absolute path, priority order, and enabled/disabled state
- ☐ User can add a new source root by entering a filesystem path in Settings, with the system validating that the directory exists before saving
- ☐ User can reorder source roots via drag handle in Settings to change resolution priority for unprefixed skill names
- ☐ User can remove a user-added source root from Settings, with the system confirming via an AlertDialog before removal
- ☐ System persists source root configuration to the `settings.skillSources` JSON column on save
- ☐ User can reorder source roots via keyboard (Space to grab, arrow keys to move, Space to drop) for accessibility
- ☐ System rejects a source root path that fails realpath resolution and shows an inline error explaining why

---

## UC-SRC-02: Toggle a source root on or off

Enable or disable scanning of a configured source root without removing it. Useful for temporarily silencing a noisy source (e.g., a plugin cache the user is debugging) without losing its configuration.

### Acceptance Criteria

- ☐ User can toggle each source root between enabled and disabled states using a Switch control in Settings → Skills
- ☐ System stops the @parcel/watcher subscription for a source root within 1 second of being disabled
- ☐ System soft-hides skills from a disabled source root from slash command resolution while preserving their DB rows
- ☐ System re-activates the watcher and re-includes skills in resolution within 1 second of a source being re-enabled
- ☐ System updates the visible skill list in the Settings sidebar within 1 second of any toggle change
- ☐ User can see the current enabled/disabled state in the Sources panel with a clear visual indicator beyond color (Switch component + label)

---

## UC-SRC-03: Seed default source roots on first launch

Pre-populate sensible default source roots so users get value without configuration. The four well-known SKILL.md locations should appear automatically on first run.

### Acceptance Criteria

- ☐ System seeds `<workspace.cwd>/.agents/skills/` (priority 90), `<workspace.cwd>/.claude/skills/` (priority 85), `~/.claude/skills/` (priority 70), and `~/.claude/plugins/cache/*/*/skills/` (priority 50) as default source roots on first app launch
- ☐ System assigns each default source a stable `source_id` (`project`, `project-claude`, `claude`, `plugins`) so user reordering and toggle state persist across upgrades
- ☐ User can see all four default sources in Settings → Skills immediately after first launch with no manual configuration
- ☐ System rebinds the `project` and `project-claude` source roots to the active workspace's `cwd` whenever the user switches workspaces
- ☐ System gracefully handles a default source path that does not exist on disk by leaving the source enabled but flagging it in the Sources panel with a "Path missing on disk" warning
