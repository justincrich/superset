---
service: skills
feature: UC-AUTH-01
priority: P0
type: security
---
# Name validation rejects path-traversal and unsafe slug input

The user attempts to create a skill with each of these names: `../../etc/passwd`, `My Skill With Spaces`, `Skill_With_Underscores`, `UPPERCASE`, `name:with:colons`, an empty string, and a 200-character string. Every one must fail validation against the regex `^[a-z][a-z0-9-]*$` with a clear inline error before any DB write occurs. The system must NOT use the user-supplied name to construct any filesystem path even after rejection (the input is never passed to `path.join` or similar). Successful save requires a name like `deploy-check` or `pr-template` only.
