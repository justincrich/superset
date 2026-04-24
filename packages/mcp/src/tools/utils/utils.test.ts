import { beforeEach, describe, expect, it, mock } from "bun:test";

type CommandRow = {
	id: string;
	status: "pending" | "completed" | "failed" | "timeout";
	result?: Record<string, unknown> | null;
	error?: string | null;
	targetDeviceId: string;
	organizationId: string;
	userId: string;
};

type DevicePresenceRow = {
	deviceId: string;
	organizationId: string;
	userId: string;
	deviceType: string;
};

let devicePresenceRows: DevicePresenceRow[] = [];
let commandRows: CommandRow[] = [];
let desktopCompleter:
	| null
	| ((
			row: CommandRow,
	  ) => Partial<Pick<CommandRow, "status" | "result" | "error">> | null) =
	null;

const { devicePresence, agentCommands } = await import("@superset/db/schema");

const selectMock = mock(() => ({
	from: (table: unknown) => ({
		where: (_cond: unknown) => ({
			limit: async (_n: number) => {
				if (table === devicePresence) return devicePresenceRows.slice(0, 1);
				if (table === agentCommands) return commandRows.slice(0, 1);
				return [];
			},
		}),
	}),
}));

const insertMock = mock(() => ({
	values: (row: Partial<CommandRow>) => ({
		returning: async () => {
			const saved: CommandRow = {
				id: "cmd-generated",
				status: "pending",
				targetDeviceId: row.targetDeviceId ?? "",
				organizationId: row.organizationId ?? "",
				userId: row.userId ?? "",
				result: null,
				error: null,
			};
			commandRows = [saved];
			return [saved];
		},
	}),
}));

const updateMock = mock(() => ({
	set: (changes: Partial<CommandRow>) => ({
		where: async () => {
			commandRows = commandRows.map((row) =>
				row.status === "pending" ? { ...row, ...changes } : row,
			);
			return [];
		},
	}),
}));

mock.module("@superset/db/client", () => ({
	db: {
		select: selectMock,
		insert: insertMock,
		update: updateMock,
	},
}));

const { executeOnDevice } = await import("./utils");

function primeDevice() {
	devicePresenceRows = [
		{
			deviceId: "device-1",
			organizationId: "org-1",
			userId: "user-1",
			deviceType: "desktop",
		},
	];
}

async function runDesktopResponder(delay: number) {
	await new Promise((r) => setTimeout(r, delay));
	if (!desktopCompleter) return;
	commandRows = commandRows.map((row) => {
		if (row.status !== "pending") return row;
		const next = desktopCompleter?.(row);
		return next ? { ...row, ...next } : row;
	});
}

describe("executeOnDevice — cloud→desktop command relay", () => {
	beforeEach(() => {
		devicePresenceRows = [];
		commandRows = [];
		desktopCompleter = null;
		selectMock.mockClear();
		insertMock.mockClear();
		updateMock.mockClear();
	});

	it("times out when desktop never picks up the command (reproduces #3708 / #2114)", async () => {
		primeDevice();

		const start = Date.now();
		const result = await executeOnDevice({
			ctx: { organizationId: "org-1", userId: "user-1" } as never,
			deviceId: "device-1",
			tool: "list_workspaces",
			params: {},
			timeout: 300,
		});
		const elapsed = Date.now() - start;

		expect(result.isError).toBe(true);
		expect(result.content[0]?.text).toContain("timed out");
		expect(elapsed).toBeGreaterThanOrEqual(300);
		expect(commandRows[0]?.status).toBe("timeout");
	});

	it("returns the completed result when desktop writes back success", async () => {
		primeDevice();
		desktopCompleter = () => ({
			status: "completed",
			result: { workspaces: [{ id: "ws-1", name: "demo" }] },
		});
		void runDesktopResponder(50);

		const result = await executeOnDevice({
			ctx: { organizationId: "org-1", userId: "user-1" } as never,
			deviceId: "device-1",
			tool: "list_workspaces",
			params: {},
			timeout: 5_000,
		});

		expect(result.isError).toBeUndefined();
		expect(result.content[0]?.text).toContain("ws-1");
	});

	it("surfaces a failure when desktop reports an error", async () => {
		primeDevice();
		desktopCompleter = () => ({
			status: "failed",
			error: "workspace not found",
		});
		void runDesktopResponder(50);

		const result = await executeOnDevice({
			ctx: { organizationId: "org-1", userId: "user-1" } as never,
			deviceId: "device-1",
			tool: "list_workspaces",
			params: {},
			timeout: 5_000,
		});

		expect(result.isError).toBe(true);
		expect(result.content[0]?.text).toContain("workspace not found");
	});

	it("rejects calls when the target device is not registered", async () => {
		devicePresenceRows = [];

		const result = await executeOnDevice({
			ctx: { organizationId: "org-1", userId: "user-1" } as never,
			deviceId: "device-missing",
			tool: "list_workspaces",
			params: {},
			timeout: 100,
		});

		expect(result.isError).toBe(true);
		expect(result.content[0]?.text).toContain("not found");
		expect(insertMock).not.toHaveBeenCalled();
	});
});
