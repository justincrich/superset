# Molecule Inventory — Phase 3

Atomic-composition primitives — each molecule combines 2+ atoms with layout/glue only (no atom-style redefinition). All molecule HTML imports `../_atoms.css` (bundle of all atom CSS rules built at phase start).

## Sessions-list tier

| # | Molecule | Atoms composed | Status |
|---|----------|----------------|--------|
| 1 | `session-row` | status-dot, avatar (optional), divider, hit-target-wrapper (long-press), section-label (timestamp) | completed |
| 2 | `workspace-section-header` | section-label, badge (count), icon-glyph (chevron), divider | completed |
| 3 | `load-more-pill` | button (secondary md), icon-glyph (chevron-down) | pending |
| 4 | `host-chip` | pill, status-dot, icon-glyph (host + chevron) | completed |
| 5 | `search-bar` | text-input (inset), icon-glyph (search + ✕), hit-target-wrapper | completed |
| 6 | `host-picker-row` | status-dot, icon-glyph (host + check), section-label (meta), divider | completed |
| 7 | `empty-state` | icon-glyph (xl hero), button (primary), section-label, body text | completed |

## Chat-tree tier

| # | Molecule | Atoms composed | Status |
|---|----------|----------------|--------|
| 8 | `user-message-bubble` | avatar, body text (markdown), section-label (timestamp), hit-target-wrapper (long-press) | completed |
| 9 | `assistant-message-head` | avatar (A accent), section-label (timestamp + meta), streaming-cursor (when streaming) | pending |
| 10 | `tool-call-card` | tool-status-rule (5 status variants), icon-glyph, pill (model name), badge (status), divider, body (args preview) | pending |
| 11 | `collapsed-block` | icon-glyph (chevron), section-label (label), body (collapsed preview). Variants: plan / reasoning / subagent-execution | pending |
| 12 | `scroll-back-button` | fab-base (overlay variant) + icon-glyph (chevron-down) | pending |

## Composer tier

| # | Molecule | Atoms composed | Status |
|---|----------|----------------|--------|
| 13 | `picker-trigger` | pill, icon-glyph (leading + chevron), section-label (label) | pending |
| 14 | `composer-toolbar` | picker-trigger ×3, icon-button (send/stop) — note: this composes molecules so may be flagged as 'large molecule' or split as organism | pending |
| 15 | `slash-command-option` | icon-glyph (slash), section-label (command + args hint), divider (between options) | pending |
| 16 | `file-mention-chip` | pill (compact + monospace), icon-glyph (file), hit-target-wrapper (dismiss) | pending |

## Pause-container tier

| # | Molecule | Atoms composed | Status |
|---|----------|----------------|--------|
| 17 | `pending-approval-card` | tool-status-rule (pending), icon-glyph, body, section-label, badge (1-of-N), divider | pending |
| 18 | `approval-footer-buttons` | button ×3 (decline destructive, approve primary, always-allow ghost), badge (1-of-N), tool-status-rule (horizontal pending) | pending |
| 19 | `suggested-answer-pill` | pill (accent, monospace optional), hit-target-wrapper | pending |
| 20 | `pending-action-pill` | pill (warning), icon-glyph (alert), live-activity-dot (paused variant) | pending |

## Platform-surface tier

| # | Molecule | Atoms composed | Status |
|---|----------|----------------|--------|
| 21 | `banner` | icon-glyph, body (1-line), button (sm), section-label (status). Variants: offline / re-enable / unpaid / dispatch-failed / push-pre-prompt | pending |
| 22 | `tab-bar-item` | icon-glyph, section-label, badge (notification count), hit-target-wrapper | pending |
| 23 | `app-header` | icon-button (back), section-label (title + meta), icon-button (more-vertical) | pending |

**Dispatch policy**: Parallel batches of 3-4 molecules where atomic dependencies don't overlap. TOKEN_GAP escapes resolved between batches. VARIANT_REQUEST cascades back to atom phase via REGEN-CASCADE.md.

**Approval-footer-buttons + composer-toolbar caveat**: These compose atoms only, so they're technically valid molecules. If a downstream organism needs additional layout/orchestration on top, the organism owns that — the molecule's job is the atomic composition shape.
