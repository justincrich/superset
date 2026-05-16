---
service: skills
feature: UC-AUTH-03
priority: P1
type: edge_case
---
# Deleting a custom skill that shadowed an external one restores the external

The user has both `custom:brainstorm` (their own) and `claude:brainstorm` (imported). The first-wins ordering means `/brainstorm` resolves to the custom version. The user deletes `custom:brainstorm`. Immediately after deletion: typing `/brainstorm` in chat now resolves to `claude:brainstorm` (the next entry in the priority order). The slash picker no longer shows a `(shadowed)` indicator on the external row because it's no longer shadowed. The AlertDialog's description copy specifically called this out: `"Imported skills with the same name will become invokable again."`
