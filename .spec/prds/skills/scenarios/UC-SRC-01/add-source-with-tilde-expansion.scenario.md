---
service: skills
feature: UC-SRC-01
priority: P1
type: happy_path
---
# Add a source root with tilde-expanded path

A user opens Settings → Skills → Sources, clicks "Add custom source", and enters `~/Code/team-skills` in the path field. The system should expand the tilde to the user's home directory before validation. After save, the new source appears in the list with its absolute path resolved (e.g., `/Users/justinrich/Code/team-skills`), priority defaulting to one below the lowest existing source, and enabled by default. The watcher subscribes within 2 seconds and any existing SKILL.md folders under that path are imported on the next sync pass.
