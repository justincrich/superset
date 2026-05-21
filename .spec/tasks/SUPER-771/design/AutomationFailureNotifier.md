---
surface: "AutomationFailureNotifier provider"
acs: [AC-5, AC-6, AC-7]
files:
  - "apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/AutomationFailureNotifier.tsx"
  - "apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/index.ts"
  - "apps/desktop/src/renderer/routes/_authenticated/layout.tsx"
---

# AutomationFailureNotifier — provider lifecycle and notification spec

## Behavioral spec

`AutomationFailureNotifier` is a render-null provider component (returns `null`). It has no visible UI. Its sole responsibility is to observe the `automationRuns` Electric collection and call `electronTrpcClient.notifications.showNative.mutate(...)` once per failed run ID within the current app session.

### Lifecycle summary

1. **Mount** — inside `CollectionsProvider` and `LocalHostServiceProvider` in `_authenticated/layout.tsx`. Initialises a `useRef<Set<string>>` (empty set) to track already-notified run IDs. No side effects fire at this point.

2. **First observe** — `useLiveQuery` delivers the full snapshot from the Electric-synced SQLite cache (which may include pre-existing failed runs from before the session). For each row in the snapshot where `status === "dispatch_failed" || status === "skipped_offline"`, the component calls `showNative` if `run.id` is not in the notified set, then adds `run.id` to the set.

3. **Re-observe same ID** — Electric re-emits existing rows on reconnect or component re-render. Because `run.id` is already in the `useRef` set, `showNative` is not called again. The ref survives re-renders because it is a `useRef`, not `useState`.

4. **Unmount** — `useLiveQuery` subscription is torn down automatically. The `useRef` set is garbage-collected with the component. No explicit cleanup is needed.

### Key design choices

- **`useRef`, not `useState`**: The notified-IDs set must not trigger a re-render when updated. `useState` would cause an infinite loop (setting state → re-render → effect re-runs → set state). `useRef` is mutation-only, no re-render.
- **`useEffect` with stable deps**: The effect runs once per change in the `automationRuns` query result. The dependency array is `[runs]` where `runs` is the `data` from `useLiveQuery`. The `notifiedRef` is excluded from deps (ref stability is guaranteed by React).
- **No async generator / observable pattern**: The observer pattern here is `useLiveQuery` (a React hook from `@tanstack/react-db`), not a tRPC subscription. No tRPC subscription is added. This avoids the `trpc-electron` observable-only constraint entirely.
- **`electronTrpcClient` (not `electronTrpc.useXxx`)**: Calling `showNative` from inside a `useEffect` requires the imperative client, not a React hook mutation. Use `electronTrpcClient.notifications.showNative.mutate(...)` directly, matching the pattern in `lifecycleEvents.ts:158`.
- **No `clickTarget`**: The `showNativeInputSchema` requires `clickTarget.source` to be `terminal` or `chat`. Automation runs have neither. Per SCOPE.md risk note: `clickTarget` must be **omitted** entirely. Without `clickTarget`, `getNativeNotificationKey()` falls back to a counter key — cross-window dedup via `activeNativeNotifications` does not apply. Within-session `useRef` dedup (AC-6) is the binding contract and is sufficient.

## States

| State | Trigger | Action |
|---|---|---|
| **mount** | Component mounts inside `AuthenticatedLayout` | `notifiedRef.current` = `new Set<string>()` (via `useRef` initializer). No side effect. |
| **first-observe** | `useLiveQuery` delivers snapshot (may contain pre-existing failed runs from SQLite cache) | `useEffect` iterates rows; for each with failed status and ID not in set → call `showNative`, add to set |
| **re-observe-same-id** | Electric re-delivers an already-seen failed row (reconnect / re-render) | ID already in `notifiedRef.current` → skip `showNative`, no notification |
| **new-failure** | A new row with `dispatch_failed` or `skipped_offline` arrives (status transition mid-session) | ID not in set → call `showNative`, add to set |
| **unmount** | User signs out or layout teardown | `useLiveQuery` unsubscribes; ref garbage-collected; no explicit cleanup |

## Copy

### Native notification content (AC-5)

| Field | Value |
|---|---|
| `title` | `"Automation failed"` |
| `body` | `run.error \|\| "Run failed"` |

The `body` renders `run.error` verbatim — the same string displayed inline in `PreviousRunsList` (single source of copy). AC-4 (server-side `describeError` normalization) ensures this string is already human-readable before it reaches the renderer.

The `body` fallback `"Run failed"` mirrors the inline row fallback and covers null/empty `run.error` values.

### Full translation table for relay status codes (AC-3 cross-reference)

This table is **owned by `packages/trpc/src/router/automation/relay-client.ts`** (AC-4, out of renderer scope). It is documented here only as a reference for the implementer of AC-4.

| Relay status | Raw body fragment | Human-readable string |
|---|---|---|
| 503 | `{"error":"Host not connected"}` | `"Target machine was offline"` |
| 502 | any | `"Relay unavailable — try again later"` |
| 401 | any | `"Authentication error connecting to host"` |
| 408 / timeout | any | `"Connection to target machine timed out"` |
| other 4xx/5xx | any | `"Automation failed (relay error {status})"` |
| non-relay error | any | `"Automation failed"` |

The renderer reads the already-translated string from `run.error`. It does not implement this table.

## Interactions

Not applicable. This component renders `null` and has no interactive surface.

## Accessibility

Not applicable. No DOM is rendered. OS-native notification chrome is managed by Electron/the OS; the implementer controls only `title` and `body` strings passed to `showNative`.

## Implementation notes

### File and folder structure

Following the established provider pattern in `_authenticated/providers/`:

```
apps/desktop/src/renderer/routes/_authenticated/providers/
└── AutomationFailureNotifier/
    ├── AutomationFailureNotifier.tsx   # Component (renders null)
    └── index.ts                        # Barrel: export { AutomationFailureNotifier }
```

No sub-components. No hook extraction (the logic is <= 20 LOC and used only here).

### Props shape

```
// No props. The component reads collections from context.
function AutomationFailureNotifier(): null
```

### Internal state shape

```
// Inside AutomationFailureNotifier:
const notifiedRef = useRef<Set<string>>(new Set());
```

`notifiedRef.current` is mutated directly inside `useEffect`. It is never passed to child components.

### Query

```
const { data: runs = [] } = useLiveQuery(
  (q) => q.from({ automationRuns: collections.automationRuns }),
  [collections],
);
```

No `.where()` filter in the query — filter in the effect. This keeps the query shape simple and avoids re-subscribing if the filter predicate changes.

Filter predicate in the effect:
```
for (const run of runs) {
  if (
    (run.status === "dispatch_failed" || run.status === "skipped_offline") &&
    !notifiedRef.current.has(run.id)
  ) {
    notifiedRef.current.add(run.id);
    void electronTrpcClient.notifications.showNative
      .mutate({
        title: "Automation failed",
        body: run.error || "Run failed",
        silent: true,
        // clickTarget intentionally omitted — no valid source type for automations
      })
      .catch((err) => {
        console.warn("[AutomationFailureNotifier] showNative failed:", err);
      });
  }
}
```

### Mount point in `layout.tsx` (AC-7)

`AutomationFailureNotifier` must be a sibling of `V2NotificationController` inside `CollectionsProvider` (which provides `useCollections()`). Insert it immediately after `<V2NotificationController />`:

```tsx
<V2NotificationController />
<AutomationFailureNotifier />
```

It must be inside `<CollectionsProvider>` and outside `<LocalHostServiceProvider>` (collections do not depend on local host service).

The current `layout.tsx` structure is:
```
<CollectionsProvider>
  <GlobalBrowserLifecycle />
  <LocalHostServiceProvider>
    <DeletingWorkspacesProvider>
      <WorkerPoolContextProvider>
        <AgentHooks />
        <FileMenuListener />
        <V2NotificationController />   ← insert AutomationFailureNotifier here
        <Outlet />
        ...
```

Since `useCollections()` is available at the `<WorkerPoolContextProvider>` level (it is inside `<CollectionsProvider>`), mounting at this level is correct.

### Import in `layout.tsx`

```tsx
import { AutomationFailureNotifier } from "./providers/AutomationFailureNotifier";
```

### LOC budget

- `AutomationFailureNotifier.tsx`: ~25 LOC (imports + component function + effect)
- `index.ts`: 1 LOC
- `layout.tsx` diff: +2 LOC (import + JSX element)
- `PreviousRunsList.tsx` diff (from the row spec): ~15 LOC net

Total: ~43 LOC against a `loc_budget: 90`. Within budget.

## Open questions

1. **Error logging granularity**: The spec proposes `console.warn` on `showNative` failure. If the team prefers silent failure (no console output in production), remove the `.catch` handler. This does not affect AC-5/AC-6.

2. **Pre-existing failures on first launch**: On app open, Electric re-hydrates from SQLite and delivers all cached rows immediately. Any run already in `dispatch_failed` / `skipped_offline` will fire a notification on every app launch (because `notifiedRef` resets to empty on each mount). SCOPE.md explicitly accepts this as the desired v1 behaviour ("re-surfacing a forgotten failure on app reopen serves that goal"). If founders push back, the fix is a localStorage-backed seen-set — deferred per SCOPE.md.

3. **`collections` stability in `useLiveQuery` dep array**: `useCollections()` returns the same object reference as long as `activeOrganizationId` does not change (guaranteed by `useMemo` in `CollectionsProvider`). The `[collections]` dep array is therefore stable across renders within a session. No `useShallow` or selector wrapping is needed.
