---
service: skills
feature: UC-CHAT-01
priority: P1
type: edge_case
---
# Three sources defining `brainstorm` show the winner plus shadowed entries

The user has three definitions of `brainstorm`: `custom:brainstorm` (kind='custom'), `claude:brainstorm` (priority 70), and `superpowers:brainstorm` (priority 50). Typing `/` in the chat input shows the SKILLS section with `brainstorm` rendered ONCE as the active entry (custom wins) AND two shadowed sub-rows below it: `↳ /claude:brainstorm` (reduced opacity) and `↳ /superpowers:brainstorm` (reduced opacity). Pressing Enter on the active row resolves to the custom version. Pressing right-arrow on a shadowed sub-row expands the picker selection to that exact qualified name; Enter then resolves to that specific source.
