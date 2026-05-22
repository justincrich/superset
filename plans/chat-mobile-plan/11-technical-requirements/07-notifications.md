---
stability: CONSTITUTION
last_validated: 2026-05-21
prd_version: 1.7.0
---

# Push Notifications — Wire-Level Design

## Overview

Mobile-chat v2 ships **minimal-scope** push notifications: the app receives an OS push when an agent turn completes (`Stop`) or pauses for user input (`PermissionRequest` — any of the three PAUSE shapes from `07-uc-pause.md`). Tapping the notification opens the corresponding session via the deep-link router in `09-uc-nav.md` UC-NAV-05.

Delivery is server-driven. The host emits a new outbound `push:lifecycle` message on its **existing tunnel WS** to `apps/relay`; relay calls the Expo Push API against tokens stored in Upstash KV (relay's existing directory infra). Mobile registers tokens against the relay using the **same JWT bearer** it uses for host-service tRPC routing — no new auth surface. Permission acquisition follows Expo best practices; foreground suppression is local-only and route-aware.

This document is the canonical reference for the four ASCII diagrams below: **delivery flow, token lifecycle, permission state machine, foreground suppression**. UC-PLATF-01 in `08-uc-platf.md` carries the user-facing acceptance criteria; everything wire-level lives here.

## Wire architecture

### Diagram 1: Notification delivery flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HOST  packages/host-service                                              │
│                                                                          │
│  notificationsEmitter.emit("agent-lifecycle", {                          │
│    eventType: "Stop" | "PermissionRequest",                              │
│    workspaceId, sessionId, agent, occurredAt })                          │
│         │                                                                │
│         │ Existing tunnel WS (host→relay, already used for HTTP proxy)   │
│         │ NEW outbound message type added to the protocol:               │
│         │   { type: "push:lifecycle", workspaceId, sessionId, ... }      │
│         ▼                                                                │
└─────────┼────────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────────┐
│ RELAY  apps/relay                                                        │
│                                                                          │
│  TunnelManager — sees new `push:lifecycle` upstream message              │
│         │                                                                │
│         ▼                                                                │
│  src/push.ts (NEW) — looks up tokens for org+user in Upstash KV          │
│         │                                                                │
│         ▼                                                                │
│  Expo Push API — POST https://exp.host/--/api/v2/push/send               │
│  body: [{ to, title, body, data: { sessionId, workspaceId,               │
│           hostId, kind }, sound, channelId }, ...]                       │
│         │                                                                │
└─────────┼────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ Expo push service      │  (APNs for iOS, FCM v1 for Android)
   └─────────┬──────────────┘
             ▼
   ┌────────────────────────┐
   │ Device (iOS / Android) │
   │ OS displays banner;    │
   │ tap → expo-router      │
   │ deep-link → UC-NAV-05  │
   └────────────────────────┘
```

## Tunnel WS protocol extension

The host-service `agent:lifecycle` event today is *broadcast to clients of host's `/events` WS* (see `packages/host-service/src/events/event-bus.ts` `broadcastAgentLifecycle`). Mobile cannot subscribe to that WS in the background — and relay cannot connect to host's `/events` because hosts sit behind NAT/firewall (that's why the relay-initiated tunnel exists in the first place). The host must push these events **upstream** on the existing tunnel WS.

A new message type is added to the tunnel protocol (`apps/relay/src/tunnel.ts` consumer side, host-side tunnel-client emitter):

```ts
interface PushLifecycleTunnelMessage {
  type: "push:lifecycle";
  workspaceId: string;
  sessionId: string;
  eventType: "Stop" | "PermissionRequest";
  agent?: AgentIdentity;
  occurredAt: number;
}
```

**Host side:** when host-service's local `notificationsEmitter` fires `NOTIFICATION_EVENTS.AGENT_LIFECYCLE`, the host-side tunnel client checks whether a tunnel is currently registered for this host and, if so, sends the `push:lifecycle` upstream alongside the existing local broadcast. No host-service contract changes; only the tunnel-client wrapper learns the new outbound type.

**Relay side:** `apps/relay/src/tunnel.ts` `TunnelManager` recognizes the new upstream message type and forwards to the push fanout module (`apps/relay/src/push.ts`).

The desktop renderer's `getEventBus(hostUrl)` subscription path is untouched — desktop continues to receive `agent:lifecycle` over host's `/events` WS exactly as today. The tunnel push path is purely additive.

## Token registration & storage

### Endpoints (defined in `02-api-design.md` §4)

```
POST   ${RELAY_URL}/push/register
       Authorization: Bearer <JWT>     (same JWT as ${RELAY_URL}/hosts/{hostId}/trpc/...)
       body: { expoToken, platform: "ios" | "android", deviceId }

DELETE ${RELAY_URL}/push/register/:deviceId
       Authorization: Bearer <JWT>
```

### Storage layout (Upstash KV)

| Key | Type | Value |
|---|---|---|
| `push:org:{organizationId}:user:{userId}` | Set | Set of `{ token, platform, deviceId, lastSeenAt }` JSON entries |

Multi-device semantics: one user with a phone + a tablet keeps two entries in the same set, each with a distinct `deviceId`. The fanout module iterates the set and sends to every token. A re-`POST` for the same `deviceId` upserts (latest wins on `lastSeenAt`). `DELETE` removes only the specified `deviceId`.

### Auth reuse

Relay validates the JWT via the **same `verifyJWT` middleware** that gates `${RELAY_URL}/hosts/{hostId}/trpc/*` (see `apps/relay/src/auth.ts`). No new claims, no new key material, no new mobile-side auth flow. JWT payload provides `organizationId` and `userId` for the Upstash key.

## Token lifecycle

### Diagram 2: Token lifecycle

```
[Cold launch]
     │
     ▼
[expo-notifications.getPermissionsAsync()]
     │
     ├─ granted / provisional ──► getExpoPushTokenAsync ──► compare to stored ──►
     │                                                         │ changed
     │                                                         ▼
     │                                            POST ${RELAY_URL}/push/register
     │                                            { expoToken, platform, deviceId }
     │                                            JWT bearer (same as chat tRPC)
     │                                                         │
     │                                                         ▼
     │                                            Upstash KV: SADD push:org:{org}:user:{user}
     │                                                         { token, platform, deviceId, lastSeenAt }
     │
     ├─ undetermined ──► defer; trigger from in-app pre-prompt later
     │
     └─ denied ─────────► drop any cached token; surface "Re-enable in Settings" affordance
                          in /(more)/settings; offer Linking.openSettings()

[Logout]
     │
     ▼
DELETE ${RELAY_URL}/push/register/{deviceId}  →  Upstash SREM

[Expo returns DeviceNotRegistered on a send]
     │
     ▼
Relay drops token from Upstash SREM (no mobile action required)

[OS revoke detected on next cold launch]
     │
     ▼
Mobile calls DELETE; status flips to denied; settings surfaces "Re-enable"
```

### Cleanup-path coverage

| Trigger | Initiator | Effect |
|---|---|---|
| User taps logout | Mobile | `DELETE` for this `deviceId` |
| User revokes permission in OS Settings | Mobile (detects on next cold launch) | `DELETE` for this `deviceId` |
| Expo `DeviceNotRegistered` response | Relay (server-driven) | `SREM` that token from the set; no mobile call needed |
| App uninstall + reinstall | Mobile (token rotates on reinstall) | New token reaches relay via `POST`; old token eventually fails Expo send and gets dropped by `DeviceNotRegistered` cleanup |
| Switching user accounts on the same device | Mobile (logout flow runs) | `DELETE` under old user's JWT, then `POST` under new user's JWT |
| TTL sweep | Relay (background) | `SREM` entries whose `lastSeenAt` is older than the TTL (deferred to TRD) |

## Permission flow (Expo best practices)

### Diagram 3: Permission state machine

```
                     ┌──────────────────┐
                     │  undetermined    │
                     │  (first launch)  │
                     └────┬─────────────┘
                          │
            [Enter first chat session OR
             user taps Enable in /settings]
                          │
                          ▼
                ┌──────────────────────┐
                │ Pre-prompt screen     │
                │ "Get notified when    │
                │  your agent needs     │
                │  you or finishes a    │
                │  turn."               │
                │                       │
                │ [ Enable ] [ Not now ]│
                └────┬──────────────┬───┘
                     │              │
              [ Enable ]      [ Not now ]
                     │              │
                     ▼              ▼
       requestPermissionsAsync   stays undetermined;
       (OS dialog)               re-prompts on next session entry
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   ┌─────────┐              ┌─────────┐
   │ granted │              │ denied  │
   └────┬────┘              └────┬────┘
        │                        │
   getExpoPushTokenAsync   Show "Re-enable in
   POST /push/register     Settings" banner;
                           Linking.openSettings()
                           on tap
```

### Non-negotiables

1. **Never ask on first cold launch.** iOS gives the app exactly one chance per install to show the OS dialog; a denial requires the user to dig into Settings to recover. The mobile-chat permission flow therefore defers the OS dialog until the user has signalled intent — entering a chat session, or explicitly tapping "Enable notifications" in `/(more)/settings`.

2. **Custom pre-prompt screen first.** Before triggering `requestPermissionsAsync()`, render the in-app `PushPrePromptScreen` explaining what the user gains. Only on Enable do we call the OS dialog. Not now defers without contacting the OS — preserving the one-shot.

3. **Re-check on every cold launch.** `getPermissionsAsync()` runs on app start. A `granted` → `denied` transition (the user revoked in OS Settings) drops the cached token and routes mobile to send `DELETE`.

4. **Token only after grant.** `getExpoPushTokenAsync()` is gated on status `granted` or `provisional`. Mobile never calls it when status is `undetermined` or `denied`.

5. **Settings respect.** When status is `denied`, an in-app banner under `/(more)/settings` invites the user to re-enable in OS Settings, with a `Linking.openSettings()` button. No attempt to bypass.

6. **Android 13+ runtime permission.** `POST_NOTIFICATIONS` runtime permission is required on Android 13+; `expo-notifications` handles the prompt as part of `requestPermissionsAsync()` when the Android target SDK is ≥ 33 (already true for SDK 56).

## Foreground suppression

Push notifications arriving while the app is foregrounded would otherwise pop a banner over UI the user is already looking at. Desktop solves this by checking the focused pane (`shouldSuppressForVisiblePane` in `apps/desktop/src/main/lib/notifications/notification-manager.ts`). Mobile mirrors that locally via a route-aware `setNotificationHandler`.

### Diagram 4: Foreground suppression

```
Push delivered while app is foregrounded
            │
            ▼
expo-notifications.setNotificationHandler invoked
            │
            ▼
  [ Read current route via expo-router ]
            │
   ┌────────┴─────────────────────────────────────┐
   │                                              │
   route == "/(chat)/[sessionId]"           any other route
   AND sessionId == payload.sessionId             │
   │                                              ▼
   ▼                                  return {
return {                                shouldShowBanner: true,
  shouldShowBanner: false,              shouldPlaySound: true,
  shouldPlaySound: false,               shouldSetBadge: false,  ← v2: no badging
  shouldSetBadge: false               }
}
   │
   ▼
(In-app UI already shows the
 state change via polling /
 streaming — no banner needed.)
```

**Why local-only.** Server-side presence tracking (mobile pings relay on session focus/blur, relay skips push if "active") was considered and deferred (see `01-scope.md` §"Out of Scope"). The local handler covers the common case at zero protocol cost; the deferred path can layer on later if users report excessive foreground noise.

**Background note.** When the app is fully backgrounded, the OS displays the notification before any JS handler runs — `setNotificationHandler` is bypassed. The foreground handler only applies to push arrivals while the JS runtime is active and the app is in the foreground or in iOS's "inactive" transition state.

## Deep-link contract

Push notification payloads include a `data` field:

```ts
{
  sessionId: string;
  workspaceId: string;
  hostId: string;
  kind: "complete" | "approval";
}
```

- `kind: "complete"` — agent finished its turn (`Stop` event).
- `kind: "approval"` — agent paused for user input (`PermissionRequest` event). Because host-service collapses all three PAUSE shapes (tool approval, `ask_user`, plan approval) into the single `PermissionRequest` event type per `packages/host-service/src/events/map-event-type.ts`, the notification can only distinguish "paused" from "complete" — not which pause shape. UC-NAV-05 currently anticipates a richer `kind` (`"approval" | "question" | "plan"`); for v2 minimal, all three of those map back to a single `approval` here, and the deep-link router opens the appropriate container by **reading the actual pending pause from `chat.getSnapshot`** after mounting the chat view. Differentiating notification `kind` per pause shape is deferred (see `01-scope.md`).

Tap handling is specified in **`09-uc-nav.md` UC-NAV-05**: the deep-link router silently aligns the locally-selected host to `payload.hostId`, navigates to `(chat)/[sessionId]`, and opens the pause container if the session has an active `PermissionRequest`.

URL scheme: `superset://chat/{sessionId}?workspaceId={...}&hostId={...}&kind={...}`. Custom-scheme only for v2 minimal; Universal Links / App Links deferred (see `01-scope.md`).

## Notification content shape

V2 minimal uses static, generic copy. No per-event-type personalisation, no user/workspace name interpolation beyond the workspace label.

| Event | Title | Body |
|---|---|---|
| `Stop` | "Agent complete" | `"<workspace name>"` |
| `PermissionRequest` | "Agent needs your input" | `"<workspace name>"` |

iOS / Android:
- **iOS**: default `interruptionLevel: "active"` (Time-Sensitive deferred — see `01-scope.md`). No thread identifier (grouping deferred). No `aps-environment` `category` (action buttons deferred).
- **Android**: one default channel, id `agent-lifecycle`, importance `DEFAULT`. No `groupSummary`. No custom icon variant — uses the standard notification icon from `app.config.ts` `notification.icon`.

`channelId` is included in the Expo push payload so Android routes correctly. iOS ignores the field.

## Expo / EAS configuration

### `apps/mobile/app.config.ts` additions

```ts
{
  ios: {
    ...,
    // aps-environment entitlement is set automatically by EAS when
    // the iOS push key is uploaded; no manual entitlement edit required.
  },
  android: {
    ...,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,  // FCM v1
  },
  plugins: [
    ...,
    [
      "expo-notifications",
      {
        // 192x192 transparent PNG used by Android for the small icon
        icon: "./assets/notification-icon.png",
        color: "#000000",
        // androidMode: "default",
        // androidCollapsedTitle: "Superset",
      },
    ],
  ],
  notification: {
    icon: "./assets/notification-icon.png",
    color: "#000000",
  },
}
```

### EAS credentials

| Platform | What | Where |
|---|---|---|
| iOS | APNs `.p8` key + key ID + team ID | Uploaded once to EAS via `eas credentials`; reused across builds |
| Android | FCM v1 service account JSON | Uploaded once to EAS; downloaded by build via `googleServicesFile` |

### Permissions metadata

| Platform | Field | Value |
|---|---|---|
| iOS | `NSUserNotificationsUsageDescription` (handled by `expo-notifications` plugin) | "Superset uses notifications to let you know when an agent finishes a turn or needs your input." |
| Android | `POST_NOTIFICATIONS` (auto-added by `expo-notifications` for SDK ≥ 33) | n/a — runtime permission |

## Failure handling

### Expo Push API error codes

| Code | Cause | Relay action |
|---|---|---|
| `DeviceNotRegistered` | Token revoked / app uninstalled | `SREM` token from Upstash set; no further sends to that token |
| `MessageTooBig` | Payload exceeds size limit | Log + Sentry; never retry (payload is statically bounded by our generator, so this is a code bug) |
| `MessageRateExceeded` | Per-token rate limit (Expo: 600/min) | Log + Sentry; retry with backoff (deferred to TRD — for v2 minimal, drop the send and rely on the next event) |
| `MismatchSenderId` | Token registered to a different Expo project | `SREM` token; log; common during dev/prod token-set drift |
| `InvalidCredentials` | EAS credentials misconfigured | Page on-call; do not retry until credentials fixed (this is an operational error, not a per-token issue) |

### Observability

- Relay emits a Sentry breadcrumb per `push:lifecycle` received (`{ orgId, userId, sessionId, eventType, tokensFanned, tokensDropped }`).
- Expo Push API errors are captured with the matching breadcrumb context.
- Mobile logs token-registration responses but does **not** Sentry-capture transient registration failures (retry is automatic on next cold launch).
- A relay metric `push_fanout_count` (counter, labels: `eventType`, `outcome`) lets ops eyeball delivery health without per-event log dives.

## Out of scope for v2

Cross-reference `01-scope.md` §"Out of Scope" for the full rationale set. One-liners:

- Notification preferences (mute, ringtone, volume) — `[DEFERRED]`
- iOS Time-Sensitive interruption + entitlement — `[DEFERRED]`
- iOS interactive action buttons — `[DEFERRED]`
- Per-workspace / per-host preferences — `[DEFERRED]`
- In-app activity center — `[DEFERRED]`
- Server-side presence tracking — `[NOT SUPPORTED]` (local-only suppression suffices)
- Universal Links / App Links — `[DEFERRED]` (custom scheme suffices)
- Notification grouping / threading — `[DEFERRED]`
- App-icon badge — `[DEFERRED]` (`shouldSetBadge: false`)
- "Agent failed" notifications — `[DEFERRED]` (no failure event from host today)
