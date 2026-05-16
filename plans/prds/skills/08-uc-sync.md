---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
functional_group: SYNC
---

# Use Cases: Discovery & Auto-Sync (SYNC)

| ID | Title | Description |
|---|---|---|
| UC-SYNC-01 | Discover SKILL.md files on source root activation | Walk each enabled source root, parse SKILL.md, upsert into the `skills` table. |
| UC-SYNC-02 | Auto-sync filesystem changes via watcher | Detect skill file additions, modifications, and deletions in real time. |
| UC-SYNC-03 | Manually refresh a source root | Trigger an on-demand re-scan without restarting the app. |
| UC-SYNC-04 | View imported skill inventory | Browse the full set of registered skills with provenance metadata. |

## Change gating & blast radius

Sprints 4–8 ship behind a **unified hybrid gate**: the `SUPERSET_SKILLS_ENABLED=1` env var (Electron main process at boot) + tRPC middleware (short-circuits `skills.*` procedures when off) + Settings UI conditional (hides the Skills sidebar entry). Per-sprint specifics (what's safe to ship in front of the gate vs behind it) land in each sprint's implementation PR. See [`00-overview.md` § Change gating summary](./00-overview.md#change-gating-summary) for the rollup.

---

## UC-SYNC-01: Discover SKILL.md files on source root activation

Walk each enabled source root, find SKILL.md files matching the source's glob pattern, parse YAML frontmatter and markdown body, and upsert one row per file into the `skills` table.

### Acceptance Criteria

- ☐ System scans every enabled source root for SKILL.md files matching the source's glob pattern on app startup
- ☐ FilesystemImporter can parse YAML frontmatter and markdown body for each SKILL.md and upsert a row into the `skills` table keyed by `(source_id, name)`
- ☐ FilesystemImporter can capture sibling files in the SKILL folder into the `supporting_files` JSON column for later exporter use
- ☐ System completes initial discovery for the four default source roots within 5 seconds of app startup on a typical user setup
- ☐ FilesystemImporter can compute the qualified name as `<plugin>:<skill>` for plugin sources (qualifyWith=`derived`) and as the bare directory name for other sources
- ☐ FilesystemImporter can pick the highest semver directory when a plugin has multiple cached versions and ignore the rest

---

## UC-SYNC-02: Auto-sync filesystem changes via watcher

Detect skill file additions, modifications, and deletions in real time using `@parcel/watcher` subscriptions, serialized through a per-source `p-queue` to avoid races against the importer transaction.

### Acceptance Criteria

- ☐ Watcher can detect a new SKILL.md added to an enabled source root and the system inserts a corresponding `skills` row within 2 seconds
- ☐ Watcher can detect a SKILL.md modification and the system updates the row's `body`, `frontmatter`, and `updated_at` within 2 seconds
- ☐ Watcher can detect a SKILL.md or its parent folder deletion and the system hard-deletes the row from the `skills` table within 2 seconds
- ☐ System invalidates the SkillResolver TTL cache after the importer transaction commits, not on the raw watcher event
- ☐ System serializes watcher events per source through a p-queue with concurrency=1 so no two events for the same source race the same DB transaction
- ☐ System surfaces a non-blocking toast or notification when a sync error occurs (e.g., malformed frontmatter) so the user knows which file failed
- ☐ System debounces watcher events through `awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }` to absorb editor save flurries

---

## UC-SYNC-03: Manually refresh a source root

Trigger an on-demand re-scan of all enabled source roots without restarting the app. Used as an escape hatch when the OS dropped a watcher event, when the inotify limit was reached, or when a network mount comes back.

### Acceptance Criteria

- ☐ User can click a "Refresh now" button in Settings → Skills to trigger a full re-scan of all enabled source roots
- ☐ System displays a spinning RefreshCw icon and disables the button while the refresh is in flight
- ☐ System updates the visible skill list and shows a Sonner toast `"Skills refreshed · {n} updated, {m} added, {k} removed."` (omitting zero categories) when the refresh finishes
- ☐ System surfaces a red toast `"Refresh failed: {error}"` on refresh error and leaves the previous registry contents intact
- ☐ User can trigger refresh while another refresh is already running and the system queues the second request rather than failing

---

## UC-SYNC-04: View imported skill inventory

Browse the full set of registered skills with provenance metadata so users can audit what's loaded, search by name or source, and disable individual skills without deleting their files.

### Acceptance Criteria

- ☐ User can view a list of all registered skills in Settings → Skills showing skill name, description, source badge (via `<SkillBadge>`), and enabled state
- ☐ User can see a kind badge ("Custom" vs source-specific like "Claude Code", "Plugin · superpowers") on each skill row to distinguish authored vs imported skills
- ☐ User can filter the skill list by typing in a search input that matches against skill name and description
- ☐ User can filter by source via a multi-select dropdown that lists every source with its skill count
- ☐ User can disable an individual skill from the list to exclude it from slash command resolution without deleting the underlying file
- ☐ System pins custom skills to the top of the list (under a `── CUSTOM ──` group header) and groups external skills below (under `── IMPORTED ──`)
