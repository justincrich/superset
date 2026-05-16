---
service: skills
feature: UC-SYNC-03
priority: P2
type: edge_case
---
# Triggering Refresh while another refresh is in flight queues the second

The user clicks `Refresh now`, sees the spinner, then clicks again 200ms later (impatient or accidental double-click). The system MUST NOT throw `"refresh already in progress"`. Instead: the second click's mutation is acknowledged, queued behind the first via the same per-source p-queue, and the user sees a single sustained spinner until both refreshes complete. Result toast appears once with the cumulative diff (or two toasts if there's a meaningful gap). At minimum, no error toast surfaces from concurrent invocation.
