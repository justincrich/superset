---
stability: FEATURE_SPEC
last_validated: 2026-05-22
prd_version: 2.0.0
functional_group: NAV
---

# Use Cases: Navigation (NAV)

Shell-level navigation for the mobile chat surface — the **Chat** bottom-nav tab. **v2.0.0 flipped the NAV model from host-first to project-first** (see [README version history](./README.md#version-history)). The top-level filter axis on the sessions list is now **project**, not host. The list is **flat and recency-sorted**, with workspace rendered as inline row metadata — no workspace sectioning, no sticky headers, no per-section pagination. Filter UI is a `@gorhom/bottom-sheet` (workspace + status multi-selects) triggered from a ⚙ button next to the search bar, with applied filters as removable chip tags below the search bar. **Tunnel lifecycle is lazy** — opened on chat-route mount via `workspace.hostId`, dropped on unmount; no tunnels live from the list.

This file **re-resolves Technical Sub-Decision #6** (workspace→host resolution) with the project-first model. The previous v1.6.0 host-first resolution is superseded; see `11-technical-requirements/06-open-sub-decisions.md` for the decision summary and rationale.

**Retired in v2.0.0:**
- **UC-NAV-02** — sessions sectioned by workspace with sticky headers + per-section pagination + Load more pill
- **UC-NAV-03** — header host-picker bottom sheet

The IDs UC-NAV-04 onwards keep their numbering for git history continuity. UC-NAV-01, UC-NAV-04, UC-NAV-05, UC-NAV-06, and UC-NAV-07 are **retargeted** for the project-first model; **UC-NAV-08** is new.

The Chat tab is a top-level surface alongside the existing **Tasks** and **More** tabs (the legacy `(home)/workspaces` tab is a stub today and is intentionally not shown in the sessions-list footer wireframe — see [the rationale below](#bottom-tab-footer-rationale)).

| ID | Title | Description | Container |
|----|-------|-------------|-----------|
| UC-NAV-01 | Sessions list is the Chat tab's default landing | User taps the Chat tab and sees a flat, recency-sorted list of sessions scoped to the selected project. | Stack screen |
| ~~UC-NAV-02~~ | _Retired in v2.0.0 — sessions are no longer grouped or sectioned; workspace is inline row metadata._ | — | — |
| ~~UC-NAV-03~~ | _Retired in v2.0.0 — host is row metadata, never a top-level filter._ | — | — |
| UC-NAV-04 | Start a new chat from the FAB → workspace picker (project-scoped) | User taps the floating "+" button, chooses a workspace from those in the selected project (across all hosts), and lands in an empty chat view. | FAB + `@gorhom/bottom-sheet` |
| UC-NAV-05 | Push-notification deep-link routes to chat view + aligns project | Tapping a notification aligns the selected project (silently) and routes to the chat view; host resolves lazily from `workspace.hostId` on chat-route mount, with a readiness gate falling back to tRPC `chat.getSnapshot` on cold-launch race. | Route handler |
| UC-NAV-06 | Empty states (no projects, no workspaces, no sessions, search-no-match, filters-no-match) | First-launch and edge-state messaging across five distinct empty conditions. | In-list / screen states |
| UC-NAV-07 | Search sessions by title across the selected project | User types into the search input to filter the flat list by `chat_sessions.title` across every workspace in the selected project (host as metadata only). | Header `TextInput` + client-side filter |
| UC-NAV-08 | Filter sessions by workspace and/or status | User opens a filter bottom sheet via the ⚙ button to multi-select workspaces and statuses; applied filters render as removable chip tags below the search bar with a badge count on the ⚙ button. | `@gorhom/bottom-sheet` + chip tag row |

---

## Canonical wireframes

### A. Sessions list — flat recency-sorted default (UC-NAV-01, UC-NAV-07, UC-NAV-08)

```
┌──────────────────────────────────────┐
│ ☰  📦 superset ▾                     │  ← header: project chip (▾ when org has ≥2 projects)
│  ┌─ 🔍 Search sessions ──┐ ┌─ ⚙ ─┐  │  ← search input + filter button
│  └────────────────────────┘ └─────┘  │
├──────────────────────────────────────┤
│  ⌖ Chat-v2 design                    │
│     🌿 chat-mobile-plan · 💻 macbook │
│     2m ago · streaming               │
│  ─────────────────────────────────   │
│  ⌖ Migration plan                    │
│     🌿 api-rewrite · ☁️ cloud-1      │
│     5m ago · streaming               │
│  ─────────────────────────────────   │
│  ● API cleanup                       │
│     🌿 chat-mobile-plan · 💻 macbook │
│     1h ago                           │
│  ─────────────────────────────────   │
│  ⚠ Auth refactor                     │
│     🌿 main · 💻 desktop             │
│     pause pending                    │
│  ─────────────────────────────────   │
│  ● Hot-fix backport                  │
│     🌿 main · 💻 desktop             │
│     1d ago                           │
│                              ╭───╮   │
│                              │ + │   │  ← FAB: UC-NAV-04 workspace picker
│                              ╰───╯   │
├──────────────────────────────────────┤
│       ✓        💬        ⋯           │  ← bottom tab nav (3 tabs)
│     Tasks     Chat      More         │     Home (stub) not shown — see rationale
└──────────────────────────────────────┘
```

**Header composition:**
- **Title row** — project chip (`📦 {projectName}`). Tappable with chevron `▾` when the active organization has ≥2 projects (opens `ProjectPickerSheet` per UC-NAV-08); static label (no chevron, no tap target) when the org has exactly 1 project.
- **Second row** — search `TextInput` + ⚙ filter button (with `·N` badge when `activeFilters` count ≥1).
- **Third row** (conditional) — horizontally-scrollable `AppliedFilterTags` when ≥1 filter is active (see §C).

**Row composition (two lines):**
- Line 1 — status icon (`⌖` streaming · `⚠` pause-pending · `●` idle · `○` dormant) + session title (1 line, ellipsis on overflow).
- Line 2 — `🌿 {branch} · {hostIcon} {hostName} · {relativeTime}` — truncation order on overflow: title (1 line) → `branch` ellipsis → `host` → `relativeTime`.

### B. Project picker bottom sheet — UC-NAV-08 (renders only when org has ≥2 projects)

```
[Tap project chip in header] ─►

┌──────────────────────────────────────┐
│       ◇ Switch project           ✕  │  ← sheet handle + close
├──────────────────────────────────────┤
│  This organization                   │
│                                      │
│  ✓  📦 superset                      │  ← currently selected
│     4 workspaces · 12 sessions       │
│                                      │
│     📦 JustinCode                    │  ← tappable
│     1 workspace · 2 sessions         │
│                                      │
│     📦 LaneShadow                    │  ← tappable
│     2 workspaces · no sessions yet   │
└──────────────────────────────────────┘
```

Workspace and session counts are derived client-side via `useLiveQuery` over the synced `v2_projects`, `v2_workspaces`, and `chat_sessions` Electric collections (cache-first per AGENTS.md TanStack DB rule — render persisted counts even while `isReady` is false).

### C. Applied filter tags + filter sheet — UC-NAV-08

```
[Filters applied — chip tags below search bar]

┌──────────────────────────────────────┐
│ ☰  📦 superset ▾                     │
│  ┌─ 🔍 Search sessions ──┐ ┌─⚙·2─┐  │  ← ⚙·2 badge: 2 active filters
│  └────────────────────────┘ └─────┘  │
│  [🌿 chat-mobile-plan · macbook ✕]  │  ← workspace chip
│  [⌖ Streaming ✕]   [Clear ✕]        │  ← status chip + clear all
├──────────────────────────────────────┤
│  (filtered session list)             │
```

```
[Tap ⚙] ─►

┌──────────────────────────────────────┐
│       ◇ Filter sessions          ✕  │
├──────────────────────────────────────┤
│  Workspaces                          │
│                                      │
│  [✓] chat-mobile-plan · 💻 macbook   │  ← workspaces in selected project
│  [✓] api-rewrite       · ☁️ cloud-1  │     disambiguated by host
│  [ ] main              · 💻 macbook  │
│  [ ] main              · 💻 desktop  │
│  [ ] feature-x         · ☁️ cloud-1  │
│                                      │
│  Status                              │
│                                      │
│  [✓] ⌖ Streaming                     │
│  [ ] ⚠ Pause pending                 │
│  [ ] ● Idle                          │
│                                      │
│       [ Clear all ]  [ Apply ]       │
└──────────────────────────────────────┘
```

When two workspaces share a branch name across different hosts (e.g., `main · macbook` vs `main · desktop`), each appears as a separate filter row — the host suffix disambiguates, and the resulting chip tag carries `branch · host` so users can read which workspace they filtered on.

### D. New-chat workspace picker — UC-NAV-04 (project-scoped)

```
[Tap FAB +] ─►

┌──────────────────────────────────────┐
│       ◇ Start a new chat        ✕   │
├──────────────────────────────────────┤
│  Pick a workspace in superset        │
│                                      │
│     chat-mobile-plan · 💻 macbook    │  ← workspaces in selected project,
│     5 sessions · 2m ago              │     across all hosts, sorted by activity
│                                      │
│     api-rewrite · ☁️ cloud-1         │
│     3 sessions · 1h ago              │
│                                      │
│     main · 💻 macbook                │
│     2 sessions · yesterday           │
│                                      │
│     main · 💻 desktop                │
│     1 session · 3 days ago           │
│                                      │
│     feature-x · ☁️ cloud-1           │
│     no sessions yet                  │  ← empty workspaces still listed
└──────────────────────────────────────┘
```

### E. Deep-link routing — UC-NAV-05

```
Push notification arrives  (payload: { sessionId, workspaceId, hostId, kind })
         │
         ▼
[User taps notification]
         │
         ▼
App launches / foregrounds
         │
         ▼
handleDeepLink:
   1. Await v2_workspaces collection readiness (bounded timeout, e.g. 2s).
   2. Cold-launch race fallback: if workspace row not yet synced after
      timeout, call tRPC chat.getSnapshot({ sessionId }) to fetch it inline.
   3. Resolve workspace.projectId from the resulting row.
   4. SelectedProjectProvider silently updates selectedProjectId if it differs.
         │
         ▼
Route to (chat)/[sessionId]
         │
         ▼
ChatScreen mounts → useChatTunnel opens tunnel against workspace.hostId
   (skeleton loader during ~300ms handshake; inline retry banner on failure)
         │
         ├── payload.kind == "approval" ───►  open UC-PAUSE-01 sticky footer
         ├── payload.kind == "question" ───►  open UC-PAUSE-02 bottom sheet
         ├── payload.kind == "plan"     ───►  open UC-PAUSE-03 pushed route
         │
         ▼
Chat view ready
   Back button → sessions list (now scoped to correct project) ✓
```

### F. Empty states — UC-NAV-06

```
   No projects                  No workspaces                 No sessions
   (UC-NAV-06.1)                (UC-NAV-06.2)                 (UC-NAV-06.3)

┌────────────────────┐         ┌──────────────────────┐      ┌──────────────────────┐
│   Sessions         │         │ 📦 superset          │      │ 📦 superset ▾        │
├────────────────────┤         ├──────────────────────┤      ├──────────────────────┤
│                    │         │                      │      │                      │
│     ╭────╮         │         │     ╭────╮           │      │     ╭────╮           │
│     │ 📦 │         │         │     │ ── │           │      │     │ 💬 │           │
│     ╰────╯         │         │     ╰────╯           │      │     ╰────╯           │
│                    │         │                      │      │                      │
│ No projects yet    │         │ No workspaces in     │      │ Start your first     │
│                    │         │ superset             │      │ chat in superset     │
│ Create one on      │         │                      │      │                      │
│ desktop to see it  │         │ Create one on        │      │ Tap "+" below to     │
│ here.              │         │ desktop.             │      │ pick a workspace.    │
│                    │         │                      │      │              ╭───╮   │
│                    │         │                      │      │              │ + │   │
│                    │         │                      │      │              ╰───╯   │
└────────────────────┘         └──────────────────────┘      └──────────────────────┘
```

```
   Search no-match              Filters no-match
   (UC-NAV-06.4)                (UC-NAV-06.5)

┌──────────────────────────┐   ┌──────────────────────────┐
│ 📦 superset ▾            │   │ 📦 superset ▾            │
│  ┌ 🔍 zzzz       ✕ ┐ ⚙  │   │  ┌ 🔍 ─────── ┐ ⚙·2     │
│  └─────────────────┘    │   │  └─────────────┘         │
│                          │   │  [🌿 main · desktop ✕]  │
├──────────────────────────┤   │  [⌖ Streaming ✕]        │
│                          │   ├──────────────────────────┤
│       No matches         │   │      No matches          │
│                          │   │                          │
│  No sessions match       │   │  No sessions match the   │
│  "zzzz" in superset.     │   │  active filters.         │
│                          │   │                          │
│   [ Clear search ]       │   │   [ Clear filters ]      │
└──────────────────────────┘   └──────────────────────────┘
```

### Bottom tab footer rationale

The wireframes show a **3-tab footer**: Tasks · Chat · More. The legacy `(home)/workspaces` tab is intentionally omitted because, as of 2026-05-22, it is a stub (workspace detail screens are placeholder cards — Branch Info / Claude Session / Terminal — with no functionality). Downstream sprint planning will decide whether to formally hide or delete the Home tab from `apps/mobile`; for the purposes of this PRD's wireframes, we depict only the tabs that point to working features. **Tasks** and **More** are real (active task list and settings/sign-out respectively); **Chat** is what this PRD ships.

---

## UC-NAV-01: Sessions list is the Chat tab's default landing

The Chat tab opens to a sessions list scoped to the user's currently-selected **project**. The header has a title row showing the project chip (tappable with `▾` when the active organization has ≥2 projects, static label otherwise) and a second row with a search `TextInput` and a ⚙ filter button. When ≥1 filter is active, a third row appears below holding the horizontally-scrollable applied-filter chip tags (UC-NAV-08). The body is a **flat, recency-sorted** `FlashList` of sessions — no workspace sectioning, no sticky headers, no per-section pagination. A floating "+" action button is anchored bottom-right (UC-NAV-04 trigger). The bottom tab bar shows **Tasks** / **Chat** / **More** (3 tabs — see the [bottom tab footer rationale](#bottom-tab-footer-rationale) above for why the legacy Home tab is omitted).

**Acceptance Criteria:**
- ☐ User can tap the Chat tab in the bottom navigation to enter the chat surface
- ☐ User can see a flat sessions list as the default content of the Chat tab, sorted by `lastActiveAt` descending across all workspaces in the selected project
- ☐ User can see a header title row containing the project chip — rendered as `📦 {projectName} ▾` (tappable, opens `ProjectPickerSheet` per UC-NAV-08) when the active organization has ≥2 projects, and as `📦 {projectName}` (static label, no tap target, no chevron) when the org has exactly 1 project
- ☐ User can see a second header row containing the search `TextInput` (UC-NAV-07) and the ⚙ filter button (UC-NAV-08 trigger) with a `·N` badge when `activeFilters` count ≥1
- ☐ User can see a third header row containing horizontally-scrollable applied-filter chip tags + a trailing `Clear ✕` affordance when ≥1 filter is active (UC-NAV-08)
- ☐ User can see a floating "+" action button anchored bottom-right that opens the new-chat flow (UC-NAV-04)
- ☐ System scopes the sessions list to the user's `activeOrganizationId` AND the currently-selected `selectedProjectId`
- ☐ System restores the previously-selected project on app launch from `expo-secure-store`, keyed by `(userId, organizationId)`
- ☐ System defaults the first-launch selected project to the project whose synced sessions have the most-recent `lastActiveAt` for this user, falling back to alphabetical-first when no sessions exist yet
- ☐ System falls back gracefully when the persisted `selectedProjectId` no longer references an accessible project (deleted, permission revoked, org switched) — re-runs the default-selection logic and surfaces a brief toast
- ☐ System performs a one-time migration on first launch post-upgrade from v1.x: drops any legacy `selectedHostId` value from `expo-secure-store`, seeds `selectedProjectId` via the default-selection logic, and removes legacy migration markers
- ☐ System renders the appropriate empty state when the list has zero rows per UC-NAV-06
- ☐ System renders each session row with two lines: title (with leading status icon `⌖ ⚠ ● ○`) and a metadata line `🌿 {branch} · {hostIcon} {hostName} · {relativeTime}`, with truncation order title → branch → host → time
- ☐ System renders the bottom tab bar with three tabs only on the sessions list view: Tasks, Chat, More (the legacy Home tab is not surfaced for this PRD's scope)
- ☐ System tags each session row with `testID="session-row-{sessionId}"` and the FAB with `testID="new-chat-fab"` for E2E coverage

---

## UC-NAV-04: Start a new chat from the FAB → workspace picker (project-scoped)

Tapping the floating "+" action button opens a workspace-picker bottom sheet listing the user's workspaces in the **currently-selected project** across all hosts (`v2_workspaces` filtered by `projectId` and `organizationId`). Each row shows `{branch} · {hostIcon} {hostName}` so the user picks both branch and host in one tap; rows include a meta line with session count and most-recent activity. Selecting a workspace creates a session via cloud `chat.createSession` (see UC-SESS-03 for the backend contract) and navigates directly into the empty chat view, where `useChatTunnel` opens the lazy relay tunnel against the workspace's `hostId`.

**Acceptance Criteria:**
- ☐ User can tap the floating "+" action button on the sessions list to open a workspace-picker bottom sheet
- ☐ User can see all workspaces in the currently-selected project listed in the picker (across all hosts), sorted by most-recent activity (workspaces with sessions ranked above empty workspaces)
- ☐ User can see each workspace row labeled with `{branch} · {hostIcon} {hostName}` and a meta line showing session count and the most-recent activity timestamp
- ☐ User can tap a workspace row to begin a new session in that workspace
- ☐ System calls cloud `chat.createSession({ sessionId, v2WorkspaceId })` when a workspace is selected — see UC-SESS-03 for the backend contract
- ☐ System navigates the user directly into the empty chat view for the new session once `chat.createSession` succeeds, at which point `useChatTunnel` opens the lazy relay tunnel against `workspace.hostId`
- ☐ User can swipe-down or tap a backdrop region to dismiss the picker without creating a session
- ☐ User can see an empty-state message inside the picker when the selected project has zero workspaces, with copy explaining workspace creation happens on desktop

---

## UC-NAV-05: Push-notification deep-link routes to chat view + aligns project

The push notification payload includes `{ sessionId, workspaceId, hostId, kind }` (unchanged from v1.x — relay protocol is stable). Tapping the notification launches or foregrounds the app and invokes `handleDeepLink`, which **awaits readiness** of the synced `v2_workspaces` Electric collection with a bounded timeout. If the workspace row is not yet synced after the timeout (cold-launch race), it falls back to a tRPC `chat.getSnapshot({ sessionId })` fetch to resolve the workspace inline. It then resolves `workspace.projectId`, silently updates `selectedProjectId` via `SelectedProjectProvider` if it differs, and routes to `(chat)/[sessionId]` regardless of which tab or screen was active. On mount, `useChatTunnel` opens the lazy relay tunnel against `workspace.hostId` — the chat view shows a skeleton loader for the ~300ms handshake and an inline `Can't reach {hostName}` error with retry if the tunnel fails. If `kind` indicates an active pause (`"approval" | "question" | "plan"`), the appropriate container from UC-PAUSE-01/02/03 opens immediately after tunnel-open succeeds.

**Acceptance Criteria:**
- ☐ User can tap a push notification to open the app and navigate directly to the chat view for the session referenced in the notification payload
- ☐ System routes to `(chat)/[sessionId]` regardless of which tab was active when the notification was tapped
- ☐ System awaits readiness of the `v2_workspaces` Electric collection with a bounded timeout before resolving the workspace row; on timeout (cold-launch race), it falls back to a tRPC `chat.getSnapshot({ sessionId })` fetch to resolve the workspace inline
- ☐ System silently updates the locally-selected project (`selectedProjectId`) to match `workspace.projectId` before mounting the chat view when they differ
- ☐ System opens the lazy relay tunnel against `workspace.hostId` after the chat view mounts (via `useChatTunnel`), showing a skeleton loader during the handshake (no blank screen)
- ☐ User can see an inline "Can't reach {hostName}" error with a Retry affordance on the chat view when the tunnel handshake fails, without losing access to the back-button
- ☐ User can tap the back button or gesture from the chat view and land on a sessions list scoped to the project of the just-viewed session
- ☐ System opens the appropriate pause container immediately after the tunnel handshake succeeds when the notification payload's `kind` is "approval" (UC-PAUSE-01), "question" (UC-PAUSE-02), or "plan" (UC-PAUSE-03)
- ☐ User can see a "Session unavailable" banner on the chat view when the session has been deleted between notification dispatch and tap, with a return-to-sessions-list affordance

---

## UC-NAV-06: Empty states (no projects, no workspaces, no sessions, search-no-match, filters-no-match)

Five distinct empty states for the chat surface, distinguished by which level of the data hierarchy is empty or which client-side filter is too restrictive:

- **UC-NAV-06.1 — No projects**: user has zero `v2_projects` in the active organization. The project chip is omitted from the header; primary copy points the user to create a project on desktop.
- **UC-NAV-06.2 — No workspaces in selected project**: the project exists but has zero `v2_workspaces`. The project chip remains in the header so the user can switch projects. Copy explains workspaces are created on desktop. The FAB is hidden.
- **UC-NAV-06.3 — No sessions in selected project**: workspaces exist but contain no sessions. The FAB is visually emphasized and copy guides the user to start their first chat.
- **UC-NAV-06.4 — Search no-match**: a non-empty search query matches zero sessions. Copy references the query string and a `[ Clear search ]` affordance restores the unfiltered list (filter chips, if any, remain applied).
- **UC-NAV-06.5 — Filters no-match**: ≥1 filter chip is applied (UC-NAV-08) and no sessions match. Copy is generic ("No sessions match the active filters.") and a `[ Clear filters ]` affordance removes every chip at once.

**Acceptance Criteria:**
- ☐ User can see a "No projects yet" empty state when they have zero accessible projects in the active organization, with copy directing them to create a project on desktop and the project chip omitted from the header
- ☐ User can see a "No workspaces in {project}" empty state when the selected project has zero workspaces, with copy explaining workspace creation happens on desktop, the project chip retained, and the FAB hidden
- ☐ User can see a "Start your first chat in {project}" empty state when workspaces exist but contain zero sessions, with the FAB visually emphasized and copy guiding the user to tap it
- ☐ User can see a "No matches" empty state when a non-empty search query matches zero sessions, with copy referencing the query string and a "Clear search" affordance that clears the input and restores the full list (filter chips, if any, remain applied)
- ☐ User can see a "No matches" empty state when ≥1 filter is applied and no sessions match, with a "Clear filters" affordance that removes every chip at once and restores the full list
- ☐ System distinguishes between these five states programmatically based on the result counts of the project, workspace, session, search, and filter computations — never falls back to a blank screen

---

## UC-NAV-07: Search sessions by title across the selected project

A search `TextInput` lives in the sessions-list header (second row, alongside the ⚙ filter button). Typing a query filters the visible sessions to those whose `chat_sessions.title` contains the query (case-insensitive substring) across **every workspace in the selected project** — host appears only as row metadata, never as a filter axis. Search composes with active filter chips (UC-NAV-08) via AND. The filter runs entirely client-side over the synced Electric `chat_sessions` collection joined to `v2_workspaces`; no new backend procedures. A clear (`✕`) affordance in the input resets the query.

**Acceptance Criteria:**
- ☐ User can see a search `TextInput` in the sessions-list header below the project chip row and beside the ⚙ filter button
- ☐ User can type a query into the search input
- ☐ System filters the visible sessions to those whose `title` field contains the query, case-insensitively, across every workspace in the selected project
- ☐ System composes the search query with `activeFilters` via AND (a session matches only if it satisfies the search AND every active workspace/status filter)
- ☐ User can see the "No matches" empty state from UC-NAV-06.4 inside the list when the query matches zero sessions in the selected project, with copy referencing the query string and a "Clear search" affordance
- ☐ User can tap a clear (`✕`) affordance in the search input to reset the query and return the list to the default flat view (filter chips, if any, remain applied)
- ☐ System performs the filter client-side over the synced Electric `chat_sessions` collection joined to `v2_workspaces` — no new backend request is issued in response to typing or clearing the query
- ☐ System debounces the filter computation by ~100ms so each keystroke does not trigger an expensive re-render on large session lists

---

## UC-NAV-08: Filter sessions by workspace and/or status

A ⚙ button next to the search input opens `SessionFilterSheet` — a `@gorhom/bottom-sheet` with two stacked multi-select sections: **Workspace** (rows enumerate `v2_workspaces` for the selected project as `{branch} · {hostIcon} {hostName}` so duplicates across hosts are disambiguated) and **Status** (`⌖ Streaming`, `⚠ Pause pending`, `● Idle`). A footer row holds `Clear all` and `Apply` actions. The sheet does not host any text input (no `BottomSheetTextInput`) so no keyboard handling is required. Selecting `Apply` closes the sheet and updates `activeFilters: { workspaceIds: string[]; statuses: SessionStatus[] }` on the sessions-list screen. Workspace-axis selections are OR-composed within the axis; status-axis selections are OR-composed within the axis; cross-axis is AND. Filter results compose with the UC-NAV-07 search query via AND.

When ≥1 filter is active, the ⚙ button renders a `·N` badge (count = `activeFilters.workspaceIds.length + activeFilters.statuses.length`) and a horizontally-scrollable `AppliedFilterTags` row appears below the search bar. Each chip shows the workspace `{branch} · {hostName}` or status `{icon} {label}`, with a trailing `✕` to remove that single filter. A trailing `Clear ✕` chip removes every filter at once. Tags representing a workspace that has been deleted from the synced collection (Electric tombstone) silently drop on next render. Filter state is in-memory only and clears on screen exit.

**Acceptance Criteria:**
- ☐ User can tap the ⚙ button to the right of the search input to open the `SessionFilterSheet` bottom sheet
- ☐ User can see two stacked multi-select sections in the sheet: Workspaces (rows listing every workspace in the selected project as `{branch} · {hostIcon} {hostName}`) and Status (rows for Streaming, Pause pending, and Idle)
- ☐ User can tap a workspace or status row to toggle its selection, indicated by a check affordance and `accessibilityState={{ selected }}` for screen readers
- ☐ User can tap `Clear all` in the sheet footer to deselect every row in the sheet
- ☐ User can tap `Apply` in the sheet footer to commit the selections to `activeFilters` on the sessions-list screen and close the sheet
- ☐ User can swipe-down or tap a backdrop region to dismiss the sheet without committing changes
- ☐ System persists nothing about `activeFilters` across screen exits — filter state is in-memory only and clears when the user leaves the sessions list
- ☐ System composes workspace selections OR-within-axis, status selections OR-within-axis, and cross-axis AND
- ☐ System composes the resulting filter predicate with the UC-NAV-07 search query via AND
- ☐ User can see a `·N` badge on the ⚙ button when ≥1 filter is active (`N = activeFilters.workspaceIds.length + activeFilters.statuses.length`)
- ☐ User can see a horizontally-scrollable `AppliedFilterTags` row appear below the search bar when ≥1 filter is active, with one chip per selected workspace (`🌿 {branch} · {hostName}`) and one chip per selected status (`{icon} {label}`), plus a trailing `Clear ✕` chip
- ☐ User can tap the `✕` on an individual chip to remove only that filter from `activeFilters` without affecting other chips
- ☐ User can tap the `Clear ✕` chip in `AppliedFilterTags` to remove every filter at once
- ☐ System silently drops a stale workspace chip on next render when the referenced workspace is no longer in the synced `v2_workspaces` collection (Electric tombstone), without crashing or showing a placeholder
- ☐ System renders the "No matches" empty state from UC-NAV-06.5 when `activeFilters` resolves to zero sessions in the selected project
- ☐ System tags interactive elements with `testID="filter-button"`, `testID="filter-badge"`, `testID="applied-filter-tag-workspace-{workspaceId}"`, `testID="applied-filter-tag-status-{status}"`, `testID="applied-filter-clear-all"`, `testID="filter-sheet-workspace-row-{workspaceId}"`, `testID="filter-sheet-status-row-{status}"`, `testID="filter-sheet-apply"`, and `testID="filter-sheet-clear"` for E2E coverage
