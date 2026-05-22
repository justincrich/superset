# 04 — Push Pre-Prompt

**Expo path:** `/(authenticated)/push-permission`
**Production component:** `apps/mobile/screens/(authenticated)/push-permission/PushPrePromptScreen.tsx`
**Sprint:** Sprint 06
**Status:** planned

## Purpose

One-time interstitial screen shown before the OS push-permission dialog fires. Explains the value of Superset push notifications (session completion alerts, agent pauses requiring approval) and presents a single primary CTA — "Enable notifications" — that calls `expo-notifications` `requestPermissionsAsync()` and, on grant, registers the Expo push token at `POST /push/register` on the relay. A secondary "Not now" action routes past the screen without requesting permission; the decision is persisted so the prompt does not resurface on subsequent launches. If the user previously denied permission at the OS level, they are routed to the Settings screen's permission-denied banner state rather than this screen.

## States

| State | Link | Trigger condition | PRD UC |
|---|---|---|---|
| push-pre-prompt | [push-pre-prompt/README.md](push-pre-prompt/README.md) | First eligible launch post sign-in; permission not yet requested | UC-PLATF-01 §A |

## Overlays

None.

## Data dependencies

| Surface | Source |
|---|---|
| Permission check | `expo-notifications` `getPermissionsAsync()` on cold launch to gate routing |
| Permission request | `expo-notifications` `requestPermissionsAsync()` on CTA tap |
| Token fetch | `expo-notifications` `getExpoPushTokenAsync()` after grant |
| Token registration | `POST /push/register` relay endpoint — body: `{ expoToken, platform, deviceId }` |
| Token deregistration | `DELETE /push/register/:deviceId` relay endpoint — called on logout or OS revocation |
