---
stability: FEATURE_SPEC
last_validated: 2026-05-21
prd_version: 1.0.0
functional_group: PLATF
---

# Use Cases: Platform Integration (PLATF)

| ID | Title | Description |
|----|-------|-------------|
| UC-PLATF-01 | Receive OS push notifications on lifecycle events | User receives Expo push notifications when an agent finishes a turn or pauses for user input while the app is backgrounded. |
| UC-PLATF-02 | Resume session state after background/foreground | System catches up missed message events using a cursor protocol when the app returns from background. |
| UC-PLATF-03 | Show host-offline UI state | System displays a clear UI banner and disables interactive actions when the user's host-service is unreachable. |
| UC-PLATF-04 | Reconnect automatically when host returns online | System automatically resumes session activity when the host returns online without requiring user action. |
| UC-PLATF-05 | Sync sessions created on other devices | System renders new sessions created on desktop or via Slack agent in the mobile session list in realtime. |

---

## UC-PLATF-01: Receive OS push notifications on lifecycle events

The mobile app receives OS push notifications when an agent turn completes (`Stop`) or pauses for user input (`PermissionRequest` — covers tool approval, `ask_user`, and plan approval) while the app is backgrounded. Delivery is server-driven: host-service pushes a new outbound `push:lifecycle` message on its existing tunnel WS to `apps/relay`; relay looks up registered Expo push tokens for the org+user in Upstash KV and calls the Expo Push API. Mobile registers/de-registers push tokens against the relay using the same JWT bearer it uses for chat tRPC. Permission acquisition follows Expo best practices (custom pre-prompt before the OS dialog; never on first cold launch). Tap-to-open routing is specified separately by **`09-uc-nav.md` UC-NAV-05**, which silently aligns the selected host to the session's host and opens the pause container immediately when applicable. Wire-level architecture, diagrams, and failure handling live in `11-technical-requirements/07-notifications.md`.

**Acceptance Criteria:**

*Permission flow:*
- ☐ System does NOT trigger the OS notification-permission dialog on first cold launch
- ☐ User can see an in-app pre-prompt screen the first time they enter a chat session that explains the value before any OS dialog is triggered
- ☐ User can tap "Enable" on the pre-prompt to trigger `expo-notifications.requestPermissionsAsync()`; tapping "Not now" defers the request without contacting the OS
- ☐ System re-checks notification permission status on every cold launch via `getPermissionsAsync()` so OS-level revocations are detected
- ☐ User can see a "Re-enable in Settings" banner with a `Linking.openSettings()` affordance under `/(more)/settings` when permission status is `denied`

*Token lifecycle:*
- ☐ System calls `getExpoPushTokenAsync()` and `POST ${RELAY_URL}/push/register { expoToken, platform, deviceId }` after permission status becomes `granted` or `provisional`, using the same JWT bearer mobile uses for host-service tRPC routing
- ☐ System re-registers the token whenever the cached token differs from the value returned by `getExpoPushTokenAsync()` on cold launch (Expo token rotation)
- ☐ System sends `DELETE ${RELAY_URL}/push/register/:deviceId` on user logout
- ☐ System sends `DELETE ${RELAY_URL}/push/register/:deviceId` on a cold-launch transition from `granted` → `denied` (OS-revoked permission)

*Delivery (server-side, validated end-to-end):*
- ☐ User receives an OS push notification when an agent turn completes (`Stop`) while the mobile app is backgrounded
- ☐ User receives an OS push notification when an agent pauses for any of the three PAUSE types (`PermissionRequest`) while the mobile app is backgrounded
- ☐ System encodes `{ sessionId, workspaceId, hostId, kind }` in the notification payload `data` field for use by the UC-NAV-05 deep-link router
- ☐ System dedupes by `sessionId` such that a later notification for the same session replaces a still-visible earlier one (no stacking from rapid event sequences)

*Foreground suppression:*
- ☐ System invokes `expo-notifications.setNotificationHandler` on app startup with a route-aware handler
- ☐ System suppresses the foreground banner when the current expo-router route is `/(chat)/[sessionId]` and the `sessionId` matches the notification payload (returning `{ shouldShowBanner: false, shouldPlaySound: false, shouldSetBadge: false }`)
- ☐ System shows the foreground banner when the current route does not match (returning `{ shouldShowBanner: true, shouldPlaySound: true, shouldSetBadge: false }`)

*Tap-to-open handoff:*
- ☐ System delegates tap handling to the deep-link router specified in **UC-NAV-05** (host alignment, pause-container auto-open, back-navigation consistency)

---

## UC-PLATF-02: Resume session state after background/foreground

When the mobile app is suspended (OS background, screen lock) and resumed, the chat view catches up missed events using a cursor protocol (analogous to desktop's `stream-next-offset` + `stream-cursor` headers from `apps/api /api/chat/[sessionId]/stream`). On resume, the chat view re-queries `chat.getSnapshot` or `chat.listMessages` and reconciles any local optimistic state.

**Acceptance Criteria:**
- ☐ System detects when the mobile app returns from background to foreground for an open chat session
- ☐ System re-queries `chat.getSnapshot` over the relay when the chat view returns from background to catch up missed events
- ☐ User can see any messages, tool calls, or pause prompts that arrived while the app was backgrounded once resume completes
- ☐ System reconciles local optimistic message state with the snapshot returned by the host, deduplicating duplicates
- ☐ User can see a brief loading indicator on the chat view while the resume snapshot is being fetched
- ☐ System opens any pending bottom-sheet pause prompts that became active while the app was backgrounded

---

## UC-PLATF-03: Show host-offline UI state

If the host-service becomes unreachable (network error, host shutdown, relay tunnel down), the chat view shows a clear banner indicating "Host offline" with retry affordance. The composer disables Send while the host is offline. The session list (Electric-backed) continues to render existing data without errors but flagging it as stale.

**Acceptance Criteria:**
- ☐ User can see a "Host offline" banner at the top of the chat view when the host-service is unreachable
- ☐ User can see the Send button disabled while the host-service is unreachable
- ☐ User can tap a Retry affordance on the banner to manually attempt reconnection
- ☐ System distinguishes "host offline" from "host paid plan required" / "host capacity exceeded" by surfacing the dispatch outcome enum (`skipped_offline`, `skipped_unpaid`, `dispatch_failed`) from the relay
- ☐ User can see the session list continue to render existing data when the host is offline (Electric shape keeps working)
- ☐ System logs the host-offline event with the host id and timestamp for diagnostics

---

## UC-PLATF-04: Reconnect automatically when host returns online

When the host-service is detected as available again (poll, push notification, manual retry, network change), the mobile app automatically clears the offline banner, re-enables Send, and re-fetches the session snapshot. No user action required.

**Acceptance Criteria:**
- ☐ System detects host availability returning via periodic poll or push notification while the offline banner is shown
- ☐ System clears the offline banner automatically on reconnect detection
- ☐ System re-enables the Send button on the chat view when the host returns online
- ☐ System re-fetches `chat.getSnapshot` for the open session and reconciles any missed events on reconnect
- ☐ User can see a brief reconnect indicator and then normal operation resume without further action

---

## UC-PLATF-05: Sync sessions created on other devices

A session created from desktop, from a Slack agent (`dd1f51793` proactive workspace spawn pattern), or from another browser tab appears in the mobile session list in realtime via the ElectricSQL `chat_sessions` shape. This use case requires no new infrastructure — the shape is already published and filtered by org.

**Acceptance Criteria:**
- ☐ User can see a session created from desktop appear in the mobile session list within a short window of creation
- ☐ User can see a session spawned by the Slack agent appear in the mobile session list within a short window of creation
- ☐ System uses the existing ElectricSQL `chat_sessions` shape at `apps/electric-proxy/src/where.ts:136-137` for the sync
- ☐ User can see title updates from other devices reflected in the mobile list in realtime
- ☐ System filters incoming sessions to the user's active organization and the currently selected workspace
