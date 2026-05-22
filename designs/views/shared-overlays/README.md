# Shared Overlays

Overlay components reachable from two or more routes. Each entry here is a single shared component with multiple trigger surfaces — the same `<SessionOverflowSheet>` opens from the chat view header and the sessions-list row long-press; the same `<DeleteConfirmationDialog>` is presented from both locations after the user selects Delete in the overflow sheet.

| Overlay | Mock | Routes that trigger it | UC |
|---|---|---|---|
| session-overflow-sheet | [session-overflow-sheet/README.md](session-overflow-sheet/README.md) | Chat view — tap `···` in app header · Sessions list — long-press session row | UC-SESS-04 |
| delete-confirmation-dialog | [delete-confirmation-dialog/README.md](delete-confirmation-dialog/README.md) | Chat view (via session overflow) · Sessions list (via session overflow) | UC-SESS-05 |

## Design notes

- Both overlays are modeled as presentational components accepting a `sessionId` prop; they are not routes and carry no navigation path.
- The session-overflow-sheet is a `@gorhom/bottom-sheet` with action rows for Rename, Share, End session, and Delete (destructive).
- The delete-confirmation-dialog is a centered iOS-style alert dialog (not a bottom sheet) with Cancel and Delete buttons.
- Triggering Delete from the overflow sheet dismisses the sheet and immediately presents the confirmation dialog. On confirmation, `chat.deleteSession({ sessionId })` is called and the user is routed back to the sessions list.
