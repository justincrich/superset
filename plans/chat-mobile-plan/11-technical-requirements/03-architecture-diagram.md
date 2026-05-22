# Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          apps/mobile (Expo)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              apps/mobile/components/chat/                    │    │
│  │  ChatInterface → MessageList → UserMessage/AssistantMessage  │    │
│  │  ChatInputFooter (@10play/tentap-editor)                     │    │
│  │  PendingApprovalCard (inline) + PendingApprovalFooter (sticky)│   │
│  │  PendingQuestionSheet (@gorhom/bottom-sheet)                 │    │
│  │  PlanReviewScreen (expo-router pushed route)                 │    │
│  │  PendingActionIndicator (floating pill)                      │    │
│  │  (FlashList, Reanimated)                                     │    │
│  └────────────────────┬────────────────────────────┬────────────┘    │
│                       │                            │                 │
│  ┌────────────────────▼──────────────┐  ┌──────────▼─────────┐       │
│  │  apps/mobile/lib/host-service-    │  │  Electric          │       │
│  │  client.ts (httpLink, JWT)        │  │  collections       │       │
│  │  HTTP adaptation of host-service  │  │  (existing +       │       │
│  │  AppRouter (desktop uses IPC)     │  │  chat_sessions)    │       │
│  └────────────────────┬──────────────┘  └──────────┬─────────┘       │
│                       │                            │                 │
│  ┌────────────────────▼──────────────┐             │                 │
│  │  Push notifications (Expo push)   │             │                 │
│  └─────────────────┬─────────────────┘             │                 │
└────────────────────┼──────────────────────────────┼──────────────────┘
                     │                              │
                     │ HTTPS                        │ SSE (Shape proto)
                     ▼                              │
        ┌────────────────────────┐                  │
        │       apps/relay       │                  │
        │  (Hono + Redis + JWT)  │                  │
        │  per-host WS tunnel    │                  │
        └────────────┬───────────┘                  │
                     │ tunnel-forwarded HTTP        │
                     ▼                              ▼
        ┌────────────────────────┐    ┌─────────────────────────┐
        │  packages/host-service │    │  apps/electric-proxy    │
        │  (Hono + tRPC)         │    │  (Cloudflare Worker)    │
        │                        │    │                         │
        │  • chat router:        │    │  • chat_sessions shape  │
        │    sendMessage,        │    │    (where.ts:136-137)   │
        │    listMessages,       │    │                         │
        │    respondToApproval,  │    │                         │
        │    respondToQuestion,  │    │                         │
        │    respondToPlan, etc. │    │                         │
        │  • Mastra harness      │    │                         │
        │  • In-memory message   │    │                         │
        │    store               │    │                         │
        └────────────────────────┘    └─────────┬───────────────┘
                     │                          │
                     │ Fire-and-forget          │
                     │ chat.updateSession       │
                     │ (lastActiveAt)           │
                     ▼                          ▼
        ┌──────────────────────────────────────────────────────┐
        │           Neon Postgres (chat_sessions)              │
        │  metadata only: title, lastActiveAt, workspace, org  │
        └──────────────────────────────────────────────────────┘
```

## Push notification delivery (UC-PLATF-01, see `07-notifications.md` for full design)

The chat-data architecture above flows **client → relay → host**. Push notifications flow the opposite direction — **host → relay → Expo → device** — and reuse the existing tunnel WS to avoid new connections. The relay also exposes new HTTP endpoints (`POST /push/register`, `DELETE /push/register/:deviceId`) for mobile token registration, gated by the same JWT middleware as the chat tRPC routes.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HOST   packages/host-service                                         │
│                                                                      │
│  notificationsEmitter.emit("agent-lifecycle", {                      │
│    eventType: "Stop" | "PermissionRequest",                          │
│    workspaceId, sessionId, agent, occurredAt })                      │
│         │                                                            │
│         │ Existing tunnel WS (host→relay, already used for HTTP      │
│         │  proxy). NEW outbound message type added to the protocol:  │
│         │   { type: "push:lifecycle", workspaceId, sessionId, ... }  │
│         ▼                                                            │
└─────────┼────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────┐
│ RELAY   apps/relay                                                   │
│                                                                      │
│   TunnelManager sees `push:lifecycle` upstream message  ──►          │
│                          │                                           │
│                          ▼                                           │
│   src/push.ts (NEW): look up tokens for org+user in Upstash KV       │
│   key: push:org:{orgId}:user:{userId}  → set of                      │
│   { token, platform, deviceId, lastSeenAt }                          │
│                          │                                           │
│                          ▼                                           │
│   Expo Push API — POST https://exp.host/--/api/v2/push/send          │
│   [{ to, title, body, data: { sessionId, workspaceId, hostId,        │
│      kind }, sound, channelId }, ...]                                │
│                                                                      │
│   ────────────────────────────────────────────────────────────       │
│   Mobile token registration (parallel HTTP surface):                 │
│     POST   ${RELAY_URL}/push/register          (after permission)    │
│     DELETE ${RELAY_URL}/push/register/{id}    (logout / OS revoke)  │
│   gated by existing verifyJWT (same JWT as chat tRPC routing)        │
└──────────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────────┐
   │ Expo push service │  (APNs for iOS, FCM v1 for Android)
   └────────┬──────────┘
            ▼
   ┌────────────────────────────────────────┐
   │ Device (iOS / Android)                 │
   │ • Foreground:                          │
   │   setNotificationHandler reads current │
   │   expo-router route; swallows banner   │
   │   if `/(chat)/[sessionId]` matches.    │
   │ • Background:                          │
   │   OS displays banner; tap routes via   │
   │   UC-NAV-05 deep-link handler →        │
   │   silently aligns selected host →      │
   │   opens (chat)/[sessionId] →           │
   │   auto-opens pause container if kind   │
   │   indicates approval/question/plan.    │
   └────────────────────────────────────────┘
```
