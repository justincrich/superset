# 05 — Settings Screen

**Expo path:** `/(authenticated)/(more)/settings`
**Production component:** `apps/mobile/screens/(authenticated)/(more)/settings/SettingsScreen.tsx`
**Sprint:** exists (active in production)
**Status:** active

## Purpose

General settings screen under the More tab, currently live in the production app. The sprint-1 design scope extends the screen with a permission-denied banner state that surfaces when `expo-notifications` `getPermissionsAsync()` returns `denied` on cold launch. The banner explains that notifications were denied and provides a deep-link button that opens the OS Settings app so the user can manually re-enable permission.

## States

| State | Link | Trigger condition | PRD UC |
|---|---|---|---|
| permission-denied-banner | [states/permission-denied-banner/README.md](states/permission-denied-banner/README.md) | `getPermissionsAsync()` returns `denied` on cold launch | UC-PLATF-01 §B |

## Overlays

None.

## Data dependencies

| Surface | Source |
|---|---|
| Push permission status | `expo-notifications` `getPermissionsAsync()` on screen mount |
| Open OS Settings | `expo-linking` `Linking.openSettings()` on banner CTA tap |
