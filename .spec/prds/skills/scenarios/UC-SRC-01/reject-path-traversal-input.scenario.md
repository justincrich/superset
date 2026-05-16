---
service: skills
feature: UC-SRC-01
priority: P0
type: security
---
# Reject path traversal in source root input

A user enters `../../etc` or any path containing `..` segments after normalization in the "Add custom source" dialog. The system must compute the realpath, detect that the resolved location escapes the user's home directory or points to a system directory (e.g., `/etc`, `/usr`, `/sys`), and refuse to save with the inline error: `"Source paths must be within your home directory or an explicit project directory."` The DB row is never written. No watcher subscription is created.
