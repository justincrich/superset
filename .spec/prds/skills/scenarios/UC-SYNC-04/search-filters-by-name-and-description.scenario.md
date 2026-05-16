---
service: skills
feature: UC-SYNC-04
priority: P1
type: happy_path
---
# Search input filters skills by name OR description substring (case-insensitive)

The user has 18 skills in the registry. They type `"test"` into the filter input. The list immediately filters to skills whose `name` OR `description` contains the substring "test" (case-insensitive). Both `test-runner` (matched by name) and `Generate Vitest specs` (matched by description containing "vitest" — partial substring "test" is in "vitest") appear; skills with no "test" anywhere disappear. Clearing the input restores the full list. Filter persists when navigating between Sources panel and back via the route.
