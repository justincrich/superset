**SCOPE BOUND (moderate)** — via `/kb-improvement-plan` on 2026-05-21

Branch: `improvement/SUPER-771-loud-failures`
Worktree: `.claude/worktrees/improvement-SUPER-771/`
Binding contract: `.spec/improvements/SUPER-771/SCOPE.md`
Investigator: electron-reviewer · Challenger: code-reviewer (fresh-eyes)

### Chosen option: moderate (90 LOC, 6 files, task_chunks=1)

Inline error display + human-readable copy + `AutomationFailureNotifier` provider that observes Electric-synced `automationRuns` and fires `showNative` notifications on `dispatch_failed` / `skipped_offline` transitions.

### Files in scope (implementer is licensed to touch ONLY these)

- `packages/trpc/src/router/automation/relay-client.ts`
- `packages/trpc/src/router/automation/dispatch.ts`
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx`
- `apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/AutomationFailureNotifier.tsx` (new)
- `apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/index.ts` (new)
- `apps/desktop/src/renderer/routes/_authenticated/layout.tsx`

### Acceptance criteria (binding)

- **AC-1**: Failed run row shows error inline (not tooltip-only)
- **AC-2**: Inline error carries `select-text cursor-text`
- **AC-3**: Relay 503 renders as "Target machine was offline" (not raw `dispatch: relay 503: …`)
- **AC-4**: `describeError` translates known relay codes without breaking call signature
- **AC-5**: Notification fires on `dispatch_failed` / `skipped_offline` transition (title "Automation failed" + human body)
- **AC-6**: Notification fires at most once per run ID **within current session** (cross-session/cross-window dedup deferred)
- **AC-7**: `AutomationFailureNotifier` mounts in `_authenticated/layout.tsx`, tracks seen IDs in `useRef<Set<string>>`

### Out of scope

QStash run-failed route copy parity · schema changes (`failureReason` enum) · retry-now UI · cross-window/cross-session dedup · extending `v2NotificationSourceSchema` · run-history virtualization · failure-detail modal

### Considered alternatives (rejected)

- **Option 4** (15 LOC, renderer-only): solves prong A only, fails the founder ask for notifications.
- **minimum** (35 LOC): solves prong A only via server-side normalization, fails prong B.
- **strategic** (200+ LOC + schema migration): both specialists flagged as cleanup-pass scope creep.

### Risks

- **HIGH overlap** with sibling worktree `super-771-loud-failures` (3 commits AUTO-LOUD-001/-002/-003) — **abandon the sibling**, do not cherry-pick its tRPC procedure design.
- Notification fires on app launch for pre-existing failures (Electric re-hydrates on mount). Confirmed acceptable per founder intent ("proactively tell user").
- `notifications.ts:38-41` `v2NotificationSourceSchema` does not accept an `automation` source type → implementer must omit `clickTarget` and rely on within-session `useRef` dedup, not `activeNativeNotifications` run-ID keys.

### Deferred follow-ups

Captured in `.spec/improvements/SUPER-771/follow-ups.md`: failureReason enum, QStash copy parity, cross-window dedup, cross-session dedup, retry-now CTA, virtualization, failure-detail modal.

### Next step

`/kb-run-sprint --scope-doc .spec/improvements/SUPER-771/SCOPE.md --worktree .claude/worktrees/improvement-SUPER-771/`
