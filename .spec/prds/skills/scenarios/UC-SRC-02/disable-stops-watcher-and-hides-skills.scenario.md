---
service: skills
feature: UC-SRC-02
priority: P0
type: happy_path
---
# Disable a source stops the watcher and hides its skills from resolution

The user has the `claude` source enabled with 5 imported skills. They flip the Switch to disabled. Within 1 second: (1) the @parcel/watcher subscription for `~/.claude/skills/` is unsubscribed, (2) the 5 rows remain in the `skills` table but the resolver query filters them out via the source's `enabled=false` flag, (3) typing `/skill-name` in chat for any of those 5 skills no longer resolves them and the slash picker omits them. Re-enabling the source within 1 second restores the watcher and the skills become resolvable again, with no re-import required (rows already exist).
