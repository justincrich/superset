/**
 * OpenComputer image for Superset host-service sandboxes.
 *
 * Static setup is baked into the image so spawn time is dominated by VM boot,
 * not by package installs. The only runtime work the spawner does is:
 *   1. exec /usr/local/bin/superset-init.sh   (materialize secrets + start dockerd + host-service)
 *   2. talk to the host-service via the Superset SDK
 */

import { Image } from "@opencomputer/sdk";

export const REPO_PATH = "/root/code/superset";

const INIT_SCRIPT = `#!/usr/bin/env bash
# Boot Superset inside an OpenComputer sandbox. Idempotent.
set -euo pipefail

: "\${DOPPLER_TOKEN:?DOPPLER_TOKEN must be set when spawning the sandbox}"
: "\${DOPPLER_PROJECT:?DOPPLER_PROJECT must be set}"
: "\${DOPPLER_CONFIG:?DOPPLER_CONFIG must be set}"

# 1. Materialize tier-2 (project-shared) secrets into the root .env.
#    Each worktree picks them up via direnv when setup.sh runs.
doppler secrets download --no-file --format env \\
  --project "\$DOPPLER_PROJECT" --config "\$DOPPLER_CONFIG" \\
  > "${REPO_PATH}/.env"
chmod 600 "${REPO_PATH}/.env"

# Export materialized secrets into this script's env so child processes
# (host-service) see them on first launch.
set -a; . "${REPO_PATH}/.env"; set +a

# 2. Start dockerd (binary baked, daemon launched at runtime). Skip if running.
if ! pgrep -x dockerd > /dev/null; then
  sudo dockerd --iptables=false > /var/log/dockerd.log 2>&1 &
  until docker info > /dev/null 2>&1; do sleep 1; done
fi

# 3. Start host-service. SUPERSET_API_KEY (from .env) makes login non-interactive;
#    it registers with the relay and exposes itself by hostId.
superset start --daemon
`;

export const supersetImage = Image.base()
  .aptInstall([
    "docker.io",
    "jq",
    "postgresql-client",
    "libnss3-tools",
    "direnv",
  ])

  .runCommands([
    // Caddy: HTTP/2 reverse proxy for Electric SSE streams. Avoids the browser
    // 6-connection limit when running 10+ Electric streams.
    `curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" \
       -o /usr/local/bin/caddy && chmod +x /usr/local/bin/caddy`,

    // node-gyp must precede bun install — node-pty's native build needs it.
    // Repo convention is bun, but bun's global install treats CLIs differently
    // and node-gyp expects to be invoked as `node-gyp`, so npm -g is the
    // pragmatic choice for these two.
    `npm install -g node-gyp neonctl`,

    // Doppler CLI — used by the init script to materialize tier-2 secrets at
    // runtime. Binary only; the auth token comes in via Sandbox envs.
    `curl -Ls https://cli.doppler.com/install.sh | sh`,

    // Clone + bun install at build time so the image pins to a Superset commit
    // and dependencies are pre-resolved. Rebuild the image to update.
    `git clone https://github.com/superset-sh/superset ${REPO_PATH}`,
    `cd ${REPO_PATH} && bun install`,
    `cp ${REPO_PATH}/Caddyfile.example ${REPO_PATH}/Caddyfile`,

    `curl -fsSL https://superset.sh/cli/install.sh | sh`,
    `curl -fsSL https://claude.ai/install.sh | bash`,

    `echo 'eval "$(direnv hook bash)"' >> /root/.bashrc`,
  ])

  // The init script that the spawner runs once after Sandbox.create.
  .addFile("/usr/local/bin/superset-init.sh", INIT_SCRIPT)
  .runCommands([`chmod +x /usr/local/bin/superset-init.sh`])

  .env({
    SUPERSET_HOME: "/root/superset",
    SUPERSET_REPO: REPO_PATH,
  })

  .workdir(REPO_PATH);
