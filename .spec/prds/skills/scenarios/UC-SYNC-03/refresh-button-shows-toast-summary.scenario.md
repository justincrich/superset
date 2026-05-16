---
service: skills
feature: UC-SYNC-03
priority: P1
type: happy_path
---
# Manual Refresh now displays accurate per-category result toast

The user clicks the `Refresh now` icon button in Settings → Skills. Before the click: 12 skills total. During the refresh: 2 SKILL.md files were modified externally, 1 new file was added, 1 file was deleted. After the refresh completes (~3 seconds for typical user setup): the spinner stops, the button re-enables, and a Sonner toast appears with text `"Skills refreshed · 2 updated, 1 added, 1 removed."` Zero categories are omitted from the toast (e.g., if 0 added, the toast says `"Skills refreshed · 2 updated, 1 removed."`). Settings list re-renders showing the new total count.
