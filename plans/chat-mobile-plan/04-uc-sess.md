---
stability: FEATURE_SPEC
last_validated: 2026-05-22
prd_version: 2.0.1
functional_group: SESS
---

# Use Cases: Session Lifecycle (SESS)

| ID | Title | Description |
|----|-------|-------------|
| UC-SESS-01 | List chat sessions in workspace | User can browse all chat sessions scoped to their active organization and selected workspace, ordered by last activity. |
| UC-SESS-02 | Resume an existing session | User can open a session and see its full message history loaded from the host-service. |
| UC-SESS-03 | Start a new chat session | User can create a new session in the active workspace from a "New chat" affordance. |
| UC-SESS-04 | End a running session | User can dispose the host-service runtime for a session from a session-level menu action. |
| UC-SESS-05 | Delete a session permanently | User can delete a session (with confirmation) and have it removed from the synced session list. |

---

## UC-SESS-01: List chat sessions in workspace

The session list view shows all `chat_sessions` rows scoped to the user's active organization and their currently selected v2 workspace, ordered by `lastActiveAt` descending. The list updates in realtime as sessions are created, renamed, or have new activity on any device (desktop, mobile, Slack-spawned). Backed by the existing ElectricSQL `chat_sessions` shape, no relay round-trip needed.

> **Note (v2.0.0):** the canonical sessions-list wireframe for the project-first model lives in `09-uc-nav.md` §A (UC-NAV-01). UC-SESS-01 here defines the data semantics; the visual surface is shared with NAV-01 and shown below as a workspace-scoped variant.

### Wireframes

#### A. Session list — loaded state

```
┌──────────────────────────────────────┐
│  ← Workspaces   My Workspace   ⚙    │  ← nav header
├──────────────────────────────────────┤
│ 🔍  Search sessions...               │  ← search affordance
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │  Fix auth bug in relay         │   │  ← session row
│ │  2 min ago                     │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │  Refactor billing module       │   │
│ │  Yesterday                     │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │  New chat                      │   │  ← auto-title placeholder
│ │  3 days ago                    │   │
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  Chat  │  Projects  │  More          │  ← bottom tab bar
└──────────────────────────────────────┘
```

Caption: Sessions ordered by `lastActiveAt` descending. Each row shows title and relative timestamp. (Project-first sessions list with workspace as inline row metadata is in `09-uc-nav.md` §A.)

#### B. Session list — empty state

```
┌──────────────────────────────────────┐
│  ← Workspaces   My Workspace   ⚙    │
├──────────────────────────────────────┤
│                                      │
│                                      │
│           💬                         │
│    No chats in this workspace        │
│    Start a new chat to get going.    │
│                                      │
│    ┌──────────────────────────┐      │
│    │      + New chat          │      │  ← primary CTA
│    └──────────────────────────┘      │
│                                      │
├──────────────────────────────────────┤
│  Chat  │  Projects  │  More          │
└──────────────────────────────────────┘
```

Caption: Empty state when the workspace has no sessions. Mirrors the NAV-06 empty-state visual treatment.

**Acceptance Criteria:**
- ☐ User can view a list of chat sessions ordered by `lastActiveAt` descending on the sessions screen for the selected workspace
- ☐ User can see each session's title (or auto-generated title placeholder if none) and last-active timestamp on the list row
- ☐ User can see the list update in realtime when a session is created, renamed, or has activity on another device via the ElectricSQL `chat_sessions` shape
- ☐ System filters the session list to only sessions matching the user's `activeOrganizationId` from their better-auth session
- ☐ System scopes the list to the currently selected `v2WorkspaceId` and excludes sessions tied to other workspaces
- ☐ User can see an empty-state message on the sessions screen when no sessions exist for the workspace

---

## UC-SESS-02: Resume an existing session

User taps a session row in the list and is taken to the chat view for that session. The chat view loads the full message history from the host-service via `chat.listMessages` (relay-routed) and renders messages using the `RENDER` group's components.

### Wireframes

#### A. Chat view — loading history

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │  ← chat nav header; ··· = overflow
├──────────────────────────────────────┤
│                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░         │  ← skeleton message rows
│  ░░░░░░░░░░░░░░░░░░░░░░░             │
│                                      │
│  ░░░░░░░░░░░░░░░░░             ░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░       ░░░  │
│                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                      │
├──────────────────────────────────────┤
│  ┌────────────────────────── ▶ 🔼 ┐  │  ← composer rendered but disabled
│  │  Type a message…                │  │     until history loads
│  └──────────────────────────────── ┘  │
└──────────────────────────────────────┘
```

Caption: Skeleton placeholders while `chat.listMessages` is in flight. Composer renders but input is disabled until history loads. This view also covers the lazy-tunnel handshake state in `09-uc-nav.md` UC-NAV-05.

#### B. Chat view — error + retry

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│                                      │
│          ⚠                           │
│   Couldn't load message history      │
│   Check your connection and retry.   │
│                                      │
│   ┌──────────────────────────┐       │
│   │        Retry             │       │  ← retry CTA
│   └──────────────────────────┘       │
│                                      │
├──────────────────────────────────────┤
│  ┌────────────────────────── ▶ 🔼 ┐  │
│  │  Type a message…                │  │
│  └──────────────────────────────── ┘  │
└──────────────────────────────────────┘
```

Caption: Error state when host is unreachable on initial load. Distinct from the tunnel-error variant covered by UC-NAV-05 (`Can't reach {hostName}`); composer remains visible but implicitly non-functional until retry succeeds.

**Acceptance Criteria:**
- ☐ User can tap a session row on the sessions screen and navigate to the chat view for that session
- ☐ System loads the full message history via `chat.listMessages` over the relay when the chat view mounts
- ☐ User can see a loading indicator on the chat view while messages are being fetched
- ☐ User can see an error state on the chat view with a retry affordance when the host-service is unreachable
- ☐ System scrolls the message list to the most recent message when the history finishes loading

---

## UC-SESS-03: Start a new chat session

User taps a "New chat" action from the sessions screen, which creates a new session row via cloud `chat.createSession` and navigates directly into the empty chat view ready for the first message.

### Wireframes

The new-chat entry point is the FAB → workspace-picker bottom sheet defined in `09-uc-nav.md` §D (UC-NAV-04). After picking a workspace and cloud `chat.createSession` succeeds, the user lands in an empty chat view whose layout matches UC-SESS-02 §A (skeleton state) but with no history to load — composer is enabled immediately and the lazy tunnel opens on mount per UC-NAV-05 / `useChatTunnel`.

**Acceptance Criteria:**
- ☐ User can tap a "New chat" action on the sessions screen to start a session in the selected workspace
- ☐ System calls cloud `chat.createSession` with a generated UUID and the selected `v2WorkspaceId`
- ☐ System navigates the user to the chat view for the new session immediately after creation
- ☐ User can see the new session appear in the session list when they return to the sessions screen
- ☐ System sets the session's `createdBy` to the current user's id and `organizationId` to `activeOrganizationId`

---

## UC-SESS-04: End a running session

User opens a session-level menu (overflow or long-press) and selects "End session." This disposes the host-service runtime for the session via `chat.endSession`, freeing the Mastra harness for that `sessionId`. The session row remains in the DB; only the runtime is disposed.

### Wireframes

#### A. Session overflow menu

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
│                        ┌──────────┐  │
│                        │ Rename   │  │  ← overflow menu items
│                        │ End      │  │
│                        │ ──────── │  │
│                        │ Delete…  │  │  ← destructive ← --color-destructive
│                        └──────────┘  │
│  [message list]                      │
│                                      │
├──────────────────────────────────────┤
│  ┌──────────────────────────────── ┐  │
│  │  Type a message…         ▶ 🔼  │  │
│  └──────────────────────────────── ┘  │
└──────────────────────────────────────┘
```

Caption: Overflow menu anchored to the `···` button. "Delete…" is styled destructive; "End" disposes the host runtime without deleting the session row (this UC). Tapping "Delete…" opens the confirmation dialog defined in UC-SESS-05.

**Acceptance Criteria:**
- ☐ User can open a session-level menu on the chat view via overflow or long-press
- ☐ User can tap "End session" from the menu to dispose the host runtime
- ☐ System calls `chat.endSession` over the relay with the session and workspace ids
- ☐ User can see a confirmation toast on success and the chat view returns to a read-only state
- ☐ System keeps the session row in the DB; only the host-side runtime is disposed

---

## UC-SESS-05: Delete a session permanently

User taps a destructive action from the session menu (or swipes-to-delete on the list row) to permanently remove the session, including history. The cloud `chat.deleteSession` cascades the delete; the Electric shape removes the row from the synced list.

### Wireframes

#### A. Delete confirmation dialog

```
┌──────────────────────────────────────┐
│  [dimmed chat view]                  │
│                                      │
│   ┌──────────────────────────────┐   │
│   │  Delete "Fix auth bug"?      │   │  ← dialog title
│   │                              │   │
│   │  This will permanently       │   │
│   │  delete all messages in      │   │
│   │  this session.               │   │
│   │                              │   │
│   │  ┌──────────┐ ┌──────────┐  │   │
│   │  │  Cancel  │ │  Delete  │  │   │  ← Delete ← --color-destructive
│   │  └──────────┘ └──────────┘  │   │
│   └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

Caption: Confirmation dialog for permanent session deletion. Both buttons are ≥44pt; destructive styling on the confirm action only. The triggering affordance is the "Delete…" item in the overflow menu (UC-SESS-04 §A) or a swipe-to-delete gesture on a list row.

**Acceptance Criteria:**
- ☐ User can tap a "Delete session" action from the session menu or swipe-to-delete on the list row
- ☐ User can see a confirmation dialog before deletion with destructive styling and a Cancel option
- ☐ System calls cloud `chat.deleteSession` with the session id when confirmed
- ☐ User can see the session removed from the synced list within a short window after deletion
- ☐ System returns the user to the session list automatically if they delete from inside the chat view
