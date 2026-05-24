# Pre-Existing Issues Blocking Root Lint

## Lint Errors
- `designs/atoms/badge/badge.html` - `lint/a11y/useButtonType` requires explicit button `type` attributes.
- `designs/atoms/divider/divider.html` - `lint/a11y/useAriaPropsForRole` requires additional ARIA props for `role="separator"`.
- `designs/atoms/icon-button/icon-button.html` - `lint/a11y/useButtonType` requires explicit button `type` attributes.
- `designs/atoms/spinner/spinner.html` - `lint/a11y/useButtonType` requires explicit button `type` attributes.

Root lint reported 958 errors and 4 warnings. These were verified as pre-existing by stashing the REMED-006 edits and rerunning `bun run lint`; the same unrelated `designs/atoms/**` diagnostics remained.

## Task-Specific Lint
- `bun run lint apps/mobile/components/PlanReviewScreen/` exits 0.
