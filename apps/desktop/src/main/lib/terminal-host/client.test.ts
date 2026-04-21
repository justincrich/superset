/**
 * Regression tests for issue #3611 — dev-mode daemon rebuild wipes terminal sessions.
 *
 * The client used to compare the saved daemon script mtime against the current mtime,
 * and if they differed it would call `killDaemonFromPidFile()` before connecting. That
 * destroys every live PTY (including long-running agent sessions) on every `bun run dev`
 * relaunch, even when the IPC protocol is unchanged. Protocol incompatibility is already
 * handled downstream by the `PROTOCOL_MISMATCH` hello-response path, so the proactive
 * mtime check is pure false-positive noise.
 */

import { mock } from "bun:test";
import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Must mock node:os.homedir before importing ./client so SUPERSET_HOME_DIR
// resolves into a test-owned temp dir rather than the real ~/.superset.
const testHome = mkdtempSync(join(tmpdir(), "superset-stale-home-"));

mock.module("node:os", () => {
	// biome-ignore lint/suspicious/noExplicitAny: forwarding the real module
	const actual = require("node:os") as any;
	return {
		...actual,
		default: actual,
		homedir: () => testHome,
	};
});

const { afterAll, afterEach, beforeEach, describe, expect, spyOn, test } =
	await import("bun:test");

const { TerminalHostClient } = await import("./client");

// electron.app.getAppPath() is mocked in test-setup.ts to join(tmpdir(), "superset-test").
const appPath = join(tmpdir(), "superset-test");
const distMain = join(appPath, "dist", "main");
const scriptPath = join(distMain, "terminal-host.js");
const supersetHome = join(testHome, ".superset");
const mtimePath = join(supersetHome, "terminal-host.mtime");

type InternalClient = {
	killDaemonFromPidFile: () => void;
	spawnDaemon: () => Promise<void>;
	connectAndAuthenticate: () => Promise<void>;
};

describe("TerminalHostClient dev-mode script rebuild (issue #3611)", () => {
	const originalNodeEnv = process.env.NODE_ENV;

	beforeEach(() => {
		mkdirSync(distMain, { recursive: true });
		mkdirSync(supersetHome, { recursive: true });
		process.env.NODE_ENV = "development";
	});

	afterEach(() => {
		rmSync(appPath, { recursive: true, force: true });
		rmSync(supersetHome, { recursive: true, force: true });
		if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = originalNodeEnv;
	});

	test("does not kill the daemon when the script is rebuilt with the same protocol", async () => {
		writeFileSync(scriptPath, "// daemon script");
		// A previous run saved a stale mtime.
		writeFileSync(mtimePath, "1000000");
		// Simulate `bun run dev` rebuilding the script — bumps mtime.
		const now = new Date();
		utimesSync(scriptPath, now, now);

		const client = new TerminalHostClient();
		const internal = client as unknown as InternalClient;

		const killSpy = spyOn(internal, "killDaemonFromPidFile");
		// Short-circuit spawn so the test does not actually launch a node process.
		const spawnSpy = spyOn(internal, "spawnDaemon").mockImplementation(
			async () => {
				throw new Error("spawn-blocked-in-test");
			},
		);

		try {
			await internal.connectAndAuthenticate();
		} catch {
			// Expected: nothing real to connect to; we only care about the kill path.
		}

		// Before the fix: the mtime mismatch triggers killDaemonFromPidFile().
		// After the fix: the mtime check is gone, so we only kill via PROTOCOL_MISMATCH.
		expect(killSpy).not.toHaveBeenCalled();
		// Sanity check: the flow reached the spawn step.
		expect(spawnSpy).toHaveBeenCalled();

		client.dispose();
	});
});

afterAll(() => {
	rmSync(testHome, { recursive: true, force: true });
});
