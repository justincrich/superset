#!/usr/bin/env bash
#
# Build the desktop app as a real production bundle from this fork and install
# it to /Applications/Superset.app (your daily-driver app).
#
# WHY THIS EXISTS
# ---------------
# The local dev `.env` (loaded by electron.vite.config.ts with `override: true`)
# bakes DEV values into the bundle at build time. Three of those break a
# standalone production build:
#   - NODE_ENV=development        -> app loads the Vite dev server (localhost) -> crash
#   - dev/empty public URLs       -> renderer env Zod validation fails (blank screen);
#                                    empty RELAY_URL fails z.url() in particular
#   - SUPERSET_WORKSPACE_NAME=...  -> app reads ~/.superset-<name>/ instead of your
#                                    real data at ~/.superset/
#
# This script swaps in production values ONLY for the build, then restores your
# dev `.env` exactly (via an EXIT trap, so it restores even if the build fails).
#
# Usage:
#   bash apps/desktop/scripts/build-local-prod.sh            # build + install + launch
#   bash apps/desktop/scripts/build-local-prod.sh --no-install   # build only
#
set -euo pipefail

# --- locate repo root (script lives in apps/desktop/scripts/) -----------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
DESKTOP_DIR="$REPO_ROOT/apps/desktop"
APP_DEST="/Applications/Superset.app"
BUILT_APP="$DESKTOP_DIR/release/mac-arm64/Superset.app"

INSTALL=1
[[ "${1:-}" == "--no-install" ]] && INSTALL=0

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found" >&2
  exit 1
fi

# --- back up .env and guarantee restore on any exit ---------------------------
ENV_BACKUP="$(mktemp -t superset-env-backup)"
cp "$ENV_FILE" "$ENV_BACKUP"
restore_env() {
  cp "$ENV_BACKUP" "$ENV_FILE"
  rm -f "$ENV_BACKUP"
  echo "[build-local-prod] restored dev .env"
}
trap restore_env EXIT

# --- apply production values for the baked-in vars ----------------------------
# These mirror the schema defaults in src/{main,renderer}/env.* (the real
# production endpoints). Only vars that get inlined via electron.vite define
# matter here.
echo "[build-local-prod] applying production env overrides for the build"
sed -i '' \
  -e 's|^NODE_ENV=.*|NODE_ENV=production|' \
  -e 's|^SUPERSET_WORKSPACE_NAME=.*|SUPERSET_WORKSPACE_NAME=superset|' \
  -e 's|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://api.superset.sh|' \
  -e 's|^NEXT_PUBLIC_WEB_URL=.*|NEXT_PUBLIC_WEB_URL=https://app.superset.sh|' \
  -e 's|^NEXT_PUBLIC_MARKETING_URL=.*|NEXT_PUBLIC_MARKETING_URL=https://superset.sh|' \
  -e 's|^NEXT_PUBLIC_DOCS_URL=.*|NEXT_PUBLIC_DOCS_URL=https://docs.superset.sh|' \
  -e 's|^NEXT_PUBLIC_ELECTRIC_URL=.*|NEXT_PUBLIC_ELECTRIC_URL=https://electric-proxy.avi-6ac.workers.dev|' \
  -e 's|^RELAY_URL=.*|RELAY_URL=https://relay.superset.sh|' \
  "$ENV_FILE"

# --- build --------------------------------------------------------------------
echo "[build-local-prod] building desktop app (this takes a few minutes)..."
( cd "$DESKTOP_DIR" && bun run build )

# .env is restored by the EXIT trap after this point regardless of outcome.

if [[ "$INSTALL" -eq 0 ]]; then
  echo "[build-local-prod] build complete: $BUILT_APP (skipping install)"
  exit 0
fi

if [[ ! -d "$BUILT_APP" ]]; then
  echo "error: expected build output not found at $BUILT_APP" >&2
  exit 1
fi

# --- install ------------------------------------------------------------------
# Your data lives in ~/.superset/ and is never touched by replacing the bundle.
echo "[build-local-prod] quitting running Superset (if any)..."
osascript -e 'quit app "Superset"' 2>/dev/null || true
sleep 2

echo "[build-local-prod] installing to $APP_DEST"
# rm first: cp -R into an existing .app dir nests it (Superset.app/Superset.app).
rm -rf "$APP_DEST"
cp -R "$BUILT_APP" "$APP_DEST"

echo "[build-local-prod] launching..."
open "$APP_DEST"
echo "[build-local-prod] done — fork production build installed and launched."
