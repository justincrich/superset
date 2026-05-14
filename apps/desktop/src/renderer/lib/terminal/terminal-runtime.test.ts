import { describe, expect, mock, test } from "bun:test";
import type { TerminalRuntime } from "./terminal-runtime";
import { detachFromContainer, writeRuntimeOutput } from "./terminal-runtime";

type MutableGlobal = typeof globalThis & {
	document?: Document;
	requestAnimationFrame?: typeof requestAnimationFrame;
};

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
		serializeAddon: {
			serialize: mock(() => ""),
		} as unknown as TerminalRuntime["serializeAddon"],
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
		hasBufferedContent: false,
	};
}

async function drainQueuedOutput(runtime: TerminalRuntime) {
	for (
		let attempt = 0;
		runtime._outputQueue.length > 0 && attempt < 100;
		attempt++
	) {
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	expect(runtime._outputQueue).toHaveLength(0);
}

async function withOutputFlushTimers<T>(callback: () => Promise<T> | T) {
	const mutableGlobal = globalThis as MutableGlobal;
	const hadRequestAnimationFrame = "requestAnimationFrame" in mutableGlobal;
	const previousRequestAnimationFrame = mutableGlobal.requestAnimationFrame;

	Object.defineProperty(mutableGlobal, "requestAnimationFrame", {
		configurable: true,
		writable: true,
		value: undefined,
	});

	try {
		return await callback();
	} finally {
		if (hadRequestAnimationFrame) {
			Object.defineProperty(mutableGlobal, "requestAnimationFrame", {
				configurable: true,
				writable: true,
				value: previousRequestAnimationFrame,
			});
		} else {
			Reflect.deleteProperty(mutableGlobal, "requestAnimationFrame");
		}
	}
}

async function withFakeDocument<T>(callback: () => Promise<T> | T) {
	const mutableGlobal = globalThis as MutableGlobal;
	const hadDocument = "document" in mutableGlobal;
	const previousDocument = mutableGlobal.document;
	const fakeElement = {
		id: "",
		style: {},
		appendChild: mock(() => null),
		setAttribute: mock(() => {}),
	};
	const fakeDocument = {
		body: {
			appendChild: mock(() => null),
		},
		createElement: mock(() => fakeElement),
		getElementById: mock(() => null),
	};

	Object.defineProperty(mutableGlobal, "document", {
		configurable: true,
		writable: true,
		value: fakeDocument,
	});

	try {
		return await callback();
	} finally {
		if (hadDocument) {
			Object.defineProperty(mutableGlobal, "document", {
				configurable: true,
				writable: true,
				value: previousDocument,
			});
		} else {
			Reflect.deleteProperty(mutableGlobal, "document");
		}
	}
}

describe("terminal runtime output", () => {
	test("writes small parked output immediately when there is no backlog", () => {
		const runtime = createFakeRuntime(null);
		const output = "tail";

		writeRuntimeOutput(runtime, output);

		expect(runtime.terminal.write).toHaveBeenCalledTimes(1);
		expect(runtime.terminal.write.mock.calls[0]?.[0]).toBe(output);
		expect(runtime._outputQueue).toHaveLength(0);
		expect(runtime.hasBufferedContent).toBe(true);
	});

	test("queues large parked output instead of blocking the renderer", async () => {
		await withOutputFlushTimers(async () => {
			const runtime = createFakeRuntime(null);
			const output = new Uint8Array(128 * 1024);

			writeRuntimeOutput(runtime, output);

			expect(runtime.terminal.write).not.toHaveBeenCalled();
			expect(runtime._outputQueue.length).toBeGreaterThan(1);
			expect(runtime.hasBufferedContent).toBe(true);

			await drainQueuedOutput(runtime);
		});
	});

	test("does not synchronously drain backlog when parking a runtime", async () => {
		await withOutputFlushTimers(async () => {
			await withFakeDocument(async () => {
				const runtime = createFakeRuntime({} as HTMLDivElement);

				writeRuntimeOutput(runtime, "x".repeat(10_000));
				const queuedBeforeDetach = runtime._outputQueue.length;
				expect(queuedBeforeDetach).toBeGreaterThan(0);

				detachFromContainer(runtime);

				expect(runtime.container).toBeNull();
				expect(runtime.terminal.write).not.toHaveBeenCalled();
				expect(runtime._outputQueue).toHaveLength(queuedBeforeDetach);

				await drainQueuedOutput(runtime);
			});
		});
	});
});
