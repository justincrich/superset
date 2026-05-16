---
stability: CONSTITUTION
last_validated: 2026-05-15
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Layer | Responsibility | Files |
|---|---|---|---|
| `skills` table | DB | Persistent storage of all skill rows (custom + external) | `packages/local-db/src/schema/schema.ts`, `packages/local-db/drizzle/00NN_add_skills_table_and_sources.sql` (generated) |
| `settings.skillSources` column | DB | User-configurable list of import source roots and priorities | Same migration |
| `SkillRepo` | Server (chat package) | Drizzle CRUD around `skills`, EventEmitter on writes, transactional upsert with `ON CONFLICT DO UPDATE` | `packages/chat/src/server/desktop/skills/repo/SkillRepo.ts` |
| `SkillImporter` interface | Server | Contract for any import source (filesystem now, MCP/registry later) | `packages/chat/src/server/desktop/skills/import/types.ts` |
| `FilesystemImporter` | Server | Walks a glob root, parses SKILL.md + frontmatter, computes name (with `derived` qualifier for plugins, max-semver for plugin versions), calls `SkillRepo.upsert` | `packages/chat/src/server/desktop/skills/import/FilesystemImporter.ts` |
| `SkillResolver` | Server | SQL lookup with TTL cache (mirrors `buildSlashCommandRegistry`); first-wins ordering | `packages/chat/src/server/desktop/skills/resolver.ts` |
| `parseSkillFrontmatter` | Server | Extends existing `parseSlashCommandFrontmatter` for SKILL.md fields (name, allowed-tools, model) | `packages/chat/src/server/desktop/skills/frontmatter.ts` |
| `SkillSourceWatcher` | Main process | One `@parcel/watcher` subscription per active source, debounced (200ms via `awaitWriteFinish`-equivalent), serialized through `p-queue` (concurrency=1) | `apps/desktop/src/main/lib/skills/SkillSourceWatcher.ts` |
| `SkillExporter` interface | Main | `agentId`, `isApplicable()`, `sync(skills)`, `teardown()` | `apps/desktop/src/main/lib/skills/exporters/types.ts` |
| `ClaudeExporter` | Main | Builds `~/.superset/skills-bundle/`, materializes custom-kind to staging dir, symlinks bundle into `~/.claude/skills/superset-skills/` with realpath loop check, atomic via temp+rename | `apps/desktop/src/main/lib/skills/exporters/ClaudeExporter.ts` |
| `MastraExporter` | Main | Writes `~/.mastracode/tools/superset-skills.ts`, manages loopback auth token. **Spike-pending**: confirm tool auto-discovery contract. | `apps/desktop/src/main/lib/skills/exporters/MastraExporter.ts` |
| `OpenCodeExporter` | Main | Phase 5 stretch — writes plugin file at OpenCode plugin location | `apps/desktop/src/main/lib/skills/exporters/OpenCodeExporter.ts` |
| `NoopExporter` | Main | Logs once per session per harness for cursor/gemini/codex/copilot/droid/pi/amp/opencode | `apps/desktop/src/main/lib/skills/exporters/NoopExporter.ts` |
| `SkillExportOrchestrator` | Main | Listens to `SkillRepo` events (debounced 2s), iterates exporters, runs `isApplicable()` then `sync()` | `apps/desktop/src/main/lib/skills/SkillExportOrchestrator.ts` |
| Skill bootstrap action | Main | Adds `skill-importer-init` to `desktop-agent-capabilities.ts` and `desktop-agent-setup.ts` | `apps/desktop/src/main/lib/agent-setup/desktop-agent-capabilities.ts`, `desktop-agent-setup.ts` |
| `skillsRouter` | Server (tRPC) | tRPC procedures: list/get/getByName/create/update/delete/runImport/listSources/updateSources/exportToHarness, plus `onChanged` observable subscription | `apps/desktop/src/lib/trpc/routers/skills.ts` |
| Slash-command bridge | Server (chat package) | Registry includes `kind:'skill'` rows; resolver returns body for inline expansion | `packages/chat/src/server/desktop/slash-commands/registry.ts`, `resolver.ts`, `types.ts` |
| Settings UI: SkillsSettings + 8 subcomponents | Renderer | List skills, edit custom, manage sources, force re-import | `apps/desktop/src/renderer/routes/_authenticated/settings/skills/` |

## Data Schema

### `skills` table (Drizzle)

Add to `packages/local-db/src/schema/schema.ts`:

```ts
export const skills = sqliteTable(
  "skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    body: text("body").notNull(),
    frontmatter: text("frontmatter", { mode: "json" }).$type<SkillFrontmatter>(),
    kind: text("kind").notNull().$type<SkillKind>(),
    sourceId: text("source_id").notNull(),
    sourcePath: text("source_path"),
    sourcePriority: integer("source_priority").notNull().default(0),
    supportingFiles: text("supporting_files", { mode: "json" })
      .$type<string[]>()
      .default([]),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    importedAt: integer("imported_at"),
  },
  (table) => [
    index("skills_name_idx").on(table.name),
    index("skills_kind_idx").on(table.kind),
    index("skills_source_priority_idx").on(table.sourcePriority),
    // The generated migration MUST emit:
    //   CREATE UNIQUE INDEX skills_source_id_name_unique_idx
    //     ON skills(source_id, name);
    // Verify before merging.
    index("skills_source_id_name_unique_idx").on(table.sourceId, table.name),
  ],
);

export type InsertSkill = typeof skills.$inferInsert;
export type SelectSkill = typeof skills.$inferSelect;
```

### `settings.skillSources` column

Add a single field inside the existing `sqliteTable("settings", { ... })`:

```ts
skillSources: text("skill_sources", { mode: "json" }).$type<SkillSourceConfig[]>(),
```

### Type definitions (in `packages/local-db/src/schema/zod.ts`)

```ts
export type SkillKind = "custom" | "external";

export interface SkillFrontmatter {
  description?: string;
  argumentHint?: string;
  aliases?: string[];
  // SKILL.md spec extensions:
  tags?: string[];
  category?: string;
  allowedTools?: string[];
  model?: string;
  [k: string]: unknown;
}

export type SkillSourceQualifier = "none" | "derived";

export interface SkillSourceConfig {
  id: string;             // 'project' | 'project-claude' | 'claude' | 'plugins' | 'custom:<uuid>'
  label: string;
  rootPath: string;       // absolute, may contain {workspace} token resolved at scan time
  pattern: string;        // glob relative to rootPath, e.g. '*/SKILL.md'
  priority: number;       // higher beats lower
  enabled: boolean;
  qualifyWith: SkillSourceQualifier;
  scope: "global" | "workspace";
}
```

### Migration generation

```bash
cd packages/local-db && bunx drizzle-kit generate --name=add_skills_table_and_sources
```

**Never hand-edit `packages/local-db/drizzle/`** per `apps/desktop/AGENTS.md`. Both schema changes (skills table + settings column) MUST be in this single migration.

## API Design

All procedures live in `apps/desktop/src/lib/trpc/routers/skills.ts`, mounted as `skills` in `routers/index.ts`.

| Name | Kind | Input (zod) | Output |
|---|---|---|---|
| `skills.list` | query | `z.object({ kind: z.enum(['custom','external']).optional(), enabled: z.boolean().optional(), search: z.string().optional() })` | `SelectSkill[]` |
| `skills.get` | query | `z.object({ id: z.string().uuid() })` | `SelectSkill \| null` |
| `skills.getByName` | query | `z.object({ name: z.string().min(1) })` (resolves via priority order) | `SelectSkill \| null` |
| `skills.create` | mutation | `z.object({ name: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/), description: z.string().min(1), body: z.string().min(1), frontmatter: z.record(z.unknown()).optional(), enabled: z.boolean().default(true) })` | `SelectSkill` (forced `kind='custom'`, `source_id='superset'`) |
| `skills.update` | mutation | `z.object({ id: z.string().uuid(), patch: z.object({ name: z.string().optional(), description: z.string().optional(), body: z.string().optional(), frontmatter: z.record(z.unknown()).optional(), enabled: z.boolean().optional() }) })` | `SelectSkill` (throws `TRPCError 'FORBIDDEN'` if `row.kind !== 'custom'`) |
| `skills.delete` | mutation | `z.object({ id: z.string().uuid() })` | `{ deleted: true }` (custom only) |
| `skills.runImport` | mutation | `z.object({ sourceId: z.string().optional() })` (omit = all) | `{ scanned: number, upserted: number, removed: number, errors: Array<{ sourceId: string, message: string }> }` |
| `skills.listSources` | query | `z.void()` | `SkillSourceConfig[]` |
| `skills.updateSources` | mutation | `z.object({ sources: z.array(skillSourceConfigSchema) })` | `SkillSourceConfig[]` |
| `skills.exportToHarness` | mutation | `z.object({ agentId: z.string() })` | `{ exported: number, harness: string }` |
| `skills.onChanged` | subscription | `z.void()` | `observable<{ type: 'upsert' \| 'delete' \| 'reimport-complete'; skillIds?: string[]; sourceId?: string }>` |

**Subscription constraint**: per `apps/desktop/AGENTS.md`, `trpc-electron` requires `observable()` from `@trpc/server/observable`. Async generators silently fail. Pattern reference: `apps/desktop/src/lib/trpc/routers/notifications.ts`.

## Architecture Diagram

```
+----------------------------------------------------------------+
|  FILESYSTEM SOURCES (priority desc)                            |
|                                                                |
|  <ws.cwd>/.agents/skills/*/SKILL.md          (project, 90)     |
|  <ws.cwd>/.claude/skills/*/SKILL.md          (project-cl, 85)  |
|  ~/.claude/skills/*/SKILL.md                 (claude, 70)      |
|  ~/.claude/plugins/cache/*/*/skills/*        (plugins, 50)     |
+--------------------------+-------------------------------------+
                           |
                  scan / fs event
                           v
+----------------------------------------------------------------+
|  SkillSourceWatcher  (apps/desktop/src/main/lib/skills/)       |
|  - one @parcel/watcher subscription per source root            |
|  - 200ms debounce per file path                                |
|  - serialized through p-queue (concurrency=1) per source       |
+--------------------------+-------------------------------------+
                           |
                  add | change | unlink
                           v
+----------------------------------------------------------------+
|  FilesystemImporter      (packages/chat/.../skills/import/)    |
|  - reads SKILL.md, parses frontmatter                          |
|  - computes name (with derived qualifier for plugins)          |
|  - max-semver dedup for plugin versions                        |
|  - calls SkillRepo.upsert / SkillRepo.deleteBySource           |
+--------------------------+-------------------------------------+
                           |
                           v
+--------------------------+-------------------------------------+
|  SkillRepo  (Drizzle, transactional, ON CONFLICT DO UPDATE)    |
|  +------------------+      emits  'upsert'/'delete' events     |
|  |  skills table    | <-->  EventEmitter --+                   |
|  +------------------+                      |                   |
+----------+--------------------+------------+                   |
           |                    |            |                   |
   query   |             query  |     event  |                   |
           v                    v            v                   |
  +-----------------+   +---------------+   +--------------------+
  | SkillResolver   |   | tRPC subs     |   | SkillExportOrch.   |
  | (1s TTL cache,  |   | (observable)  |   | (debounce 2s)      |
  |  invalidated    |   |               |   |                    |
  |  AFTER commit)  |   |               |   |                    |
  +--------+--------+   +-------+-------+   +---------+----------+
           |                    |                     |
           v                    v                     v
  +-----------------+   +---------------+   +-----------------------+
  | slash-command   |   | Settings UI   |   | per-harness exporters |
  | registry        |   | (renderer)    |   |  - ClaudeExporter     |
  | (/skill-name    |   |               |   |  - MastraExporter*    |
  |  expands inline)|   |               |   |  - OpenCodeExporter** |
  +--------+--------+   +---------------+   |  - NoopExporter (rest)|
           |                                +-----------+-----------+
           v                                            |
  +-----------------+                                   v
  | chat runtime    |              +-------------------------------------+
  | sends prompt to |              |  Materialized outputs               |
  | active agent    |              |  ~/.superset/skills-bundle/         |
  +-----------------+              |  ~/.claude/skills/superset-skills/  |
                                   |  ~/.mastracode/tools/superset-*.ts  |
                                   |  ~/.config/opencode/plugins/...     |
                                   +-------------------------------------+
                                                        |
                                                        v
                                            agent CLIs read on next start

  *MastraExporter is spike-pending (UC-EXPORT-02)
  **OpenCodeExporter is Phase 5 stretch (UC-EXPORT-03 covers Noop fallback in v1)
```

## External Dependencies

| Package | Version | Purpose | Documentation | Risk |
|---|---|---|---|---|
| `@parcel/watcher` | 2.5.6 (already shipping) | Native FS watcher (FSEvents/inotify/ReadDirectoryChangesW). **Use this, NOT chokidar.** | https://github.com/parcel-bundler/watcher#readme | None — already shipping; native rebuild already wired in `packages/workspace-fs` |
| `p-queue` | 8.0.1 | Per-source serialization of watcher events to prevent transaction races | https://github.com/sindresorhus/p-queue | Pure ESM; `apps/desktop` already builds ESM |
| `semver` | 7.6.3 | Plugin source needs to pick max version directory | https://github.com/npm/node-semver | Tiny; widely used; Node-native |

All other primitives (Drizzle, Zod, EventEmitter, `node:fs`, `node:path`, `@trpc/server`, `@hono/node-server` if MastraExporter spike confirms loopback HTTP) already exist in the repo.

**Explicitly REJECTED**: `chokidar` 4.0.3 — would introduce a second native FS watcher into the Electron build. `@parcel/watcher` is the canonical choice.

## UI Infrastructure

### Sidebar entry
Add to `SECTION_GROUPS[1].items` in `apps/desktop/src/renderer/routes/_authenticated/settings/components/SettingsSidebar/GeneralSettings.tsx`:
```ts
{ id: "/settings/skills", section: "skills", label: "Skills", icon: <HiOutlineBolt className="h-4 w-4" /> }
```

### Reused shadcn/ui primitives (from `@superset/ui`)
SettingsListSidebar · DropdownMenu / DropdownMenuCheckboxItem · Button · Input · Label · Field · Select · Textarea · Tabs / TabsList / TabsTrigger / TabsContent · Card / CardContent · Switch · Sheet / SheetContent · AlertDialog · Tooltip · Spinner · Skeleton · Empty / EmptyHeader / EmptyMedia / EmptyTitle / EmptyDescription · Alert / AlertTitle / AlertDescription · Item / ItemContent · Badge (base for SkillBadge) · ClickablePath · WorktreeLocationPicker

### New components
| Component | Path |
|---|---|
| `SkillsSidebarRow` | `apps/desktop/src/renderer/routes/_authenticated/settings/skills/components/SkillsSettings/components/SkillsSidebar/components/SkillsSidebarRow/` |
| `SkillDetailHeader` | `.../SkillsSettings/components/SkillDetail/components/SkillDetailHeader/` |
| `SkillBodyEditor` | `.../SkillsSettings/components/SkillEditor/components/SkillBodyEditor/` |
| `SkillBodyPreview` | `.../SkillsSettings/components/SkillPreview/components/SkillBodyPreview/` |
| `AddSourceSheet` | `.../SkillsSettings/components/SourcesPanel/components/AddSourceSheet/` |
| `HarnessSupportBanner` | `.../SkillsSettings/components/HarnessSupportBanner/` |
| `SkillBadge` | `.../SkillsSettings/components/SkillBadge/` (12 variants × 3 sizes) |

### Slash command picker integration
Extend `apps/desktop/src/renderer/components/Chat/ChatInterface/components/TiptapPromptEditor/SlashCommandPreviewPopover.tsx` to show a `SKILLS` section under the existing `COMMANDS` section. Shadowed entries shown with reduced opacity + qualified-form sub-row. Right-arrow expands to qualified picker.

### `SkillToolCall` corner badge
Modify `apps/desktop/src/renderer/components/Chat/ChatInterface/components/ToolCallBlock/components/SkillToolCall/SkillToolCall.tsx` to render `<SkillBadge variant={skill.badgeVariant} size="xs" />` next to the `Skill({skillName})` title. Single source of truth for provenance.

### Accessibility constraints
- Drag handles: `aria-label="Drag to reorder"`; `KeyboardSensor` (Space to grab, arrow keys, Space to drop)
- Markdown editor `Textarea`: visible `<Label>`, `aria-described-by` validation hints
- Tooltips on badges via `Tooltip` (focusable, keyboard-reachable)
- Errors in detail pane use `select-text cursor-text` per `apps/desktop/AGENTS.md`
- Color-not-the-only-signal on badges (icon + label always paired)

## Implementation Phases

| Phase | Name | Complexity | Deliverable | Blockers |
|---|---|---|---|---|
| **1** | Walking Skeleton | S/M | Custom skills only, stored in DB, slash-resolvable inline. Drizzle migration + SkillRepo (CRUD) + parseSkillFrontmatter + SkillResolver (TTL cache + SQL) + slash-command registry extension (`kind: "skill"`) + tRPC `skills.list/get/create/update/delete`. Bun:test coverage for resolver priority + frontmatter parsing. | None (greenfield + migration) |
| **2** | Filesystem Import | M | External skills auto-import from all 4 default sources, no live watch yet. SkillImporter interface + FilesystemImporter + SkillSourceConfig defaults seeded on first boot + plugin namespace handling (`plugin:<name>:<skill>`) + max-semver dedup + `skills.runImport` + `skills.listSources/updateSources`. Bun:test fixtures with real `node:fs` (no mocks). | Phase 1 |
| **3** | Live Watch + Subscriptions | M | Auto-sync on filesystem change; UI updates live. SkillSourceWatcher using @parcel/watcher + per-source p-queue (concurrency=1) + cache invalidation AFTER transaction commit + `skills.onChanged` tRPC subscription via `observable()` + renderer-side Settings panel (list custom + external, edit custom only). | Phase 2 |
| **4** | Exporters: Claude + Noop | M | Skills appear inside Claude CLI sessions; everyone else logs noop. SkillExporter interface + SkillExportOrchestrator (2s debounce) + ClaudeExporter (bundle dir, realpath loop check, atomic temp+rename) + NoopExporter for cursor/gemini/codex/copilot/droid/pi/amp/opencode + `skill-importer-init` action wired into `desktop-agent-setup.ts` + `skills.exportToHarness` manual trigger. Verify on macOS/Linux/Windows for symlink fallback. | Phase 3 |
| **5** | Exporters: Mastra (+ OpenCode stretch) | L (partly spike) | Mastracode users get skills; OpenCode if spike succeeds. **Spike first**: confirm mastracode tool auto-discovery contract; confirm OpenCode plugin file location. MastraExporter writes `~/.mastracode/tools/superset-skills.ts` + loopback HTTP endpoint in main (potentially via `@hono/node-server`) + token in env. OpenCodeExporter as parallel deliverable if its spike succeeds; otherwise stays Noop. End-to-end against real CLIs (no mocks per project rules). | Phase 4 + spike outcomes |

Each phase corresponds to one human testing gate per `kb-sprint-plan` conventions. Phase 1 is the minimum walking skeleton; phases 2–5 each produce visibly different user value.
