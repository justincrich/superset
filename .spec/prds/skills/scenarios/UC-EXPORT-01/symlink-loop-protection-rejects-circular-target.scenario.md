---
service: skills
feature: UC-EXPORT-01
priority: P0
type: security
---
# ClaudeExporter refuses to create a symlink that would form a loop

A malicious or misconfigured user has manually symlinked `~/.claude/skills/superset-skills/` to point inside `~/.superset/skills-bundle/` (or vice versa). On next sync, ClaudeExporter must detect the loop: it computes `realpath` for both the proposed bundle source AND the symlink target. If the resolved bundle path is a prefix of the resolved target path (or vice versa), the operation is aborted, a warning is logged: `"[skills] Refusing to create symlink: would create loop. source={src}, target={dst}"`, and a Sonner toast surfaces in the renderer. No partial state is written. The next sync attempt also fails until the user removes the offending manual symlink.
