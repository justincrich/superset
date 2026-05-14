import { describe, expect, mock, test } from "bun:test";
import type { TerminalRuntime } from "./terminal-runtime";
import { writeRuntimeOutput } from "./terminal-runtime";

function createFakeRuntime(
	container: HTMLDivElement | null,
): TerminalRuntime & {
	terminal: TerminalRuntime["terminal"] & {
		write: ReturnType<typeof mock>;
	};
} {
	return {
		terminalId: "terminal-1",
		terminal: {
			write: mock((_data: string | Uint8Array, callback?: () => void) => {
				callback?.();
			}),
		} as unknown as TerminalRuntime["terminal"] & {
			write: ReturnType<typeof mock>;
		},
		fitAddon: {} as TerminalRuntime["fitAddon"],
		serializeAddon: {} as TerminalRuntime["serializeAddon"],
		searchAddon: null,
		progressAddon: null,
		wrapper: {} as HTMLDivElement,
		container,
		resizeObserver: null,
		_disposeResizeObserver: null,
		lastCols: 120,
		lastRows: 32,
		_disposeAddons: null,
		_disposeImagePasteFallback: null,
		_outputQueue: [],
		_outputEnqueued: false,
		_outputQueuedBytes: 0,
		hasBufferedContent: false,
	};
}

describe("terminal runtime output", () => {
	test("writes parked output immediately instead of queueing replay", () => {
		const runtime = createFakeRuntime(null);
		const output = new Uint8Array(128 * 1024);

		writeRuntimeOutput(runtime, output);

		expect(runtime.terminal.write).toHaveBeenCalledTimes(1);
		expect(runtime.terminal.write.mock.calls[0]?.[0]).toBe(output);
		expect(runtime._outputQueue).toHaveLength(0);
		expect(runtime._outputQueuedBytes).toBe(0);
		expect(runtime.hasBufferedContent).toBe(true);
	});

	test("drains any visible backlog before writing parked output", () => {
		const runtime = createFakeRuntime({} as HTMLDivElement);

		writeRuntimeOutput(runtime, "x".repeat(10_000));
		expect(runtime._outputQueue.length).toBeGreaterThan(0);

		runtime.container = null;
		writeRuntimeOutput(runtime, "tail");

		expect(runtime._outputQueue).toHaveLength(0);
		expect(runtime._outputQueuedBytes).toBe(0);
		expect(runtime.terminal.write.mock.calls.at(-1)?.[0]).toBe("tail");
	});
});
