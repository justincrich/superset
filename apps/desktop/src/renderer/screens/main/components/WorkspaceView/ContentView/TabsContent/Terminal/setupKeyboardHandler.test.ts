import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { useHotkeyOverridesStore } from "renderer/hotkeys/stores/hotkeyOverridesStore";
import type { KeyboardHandlerXTerm } from "./setupKeyboardHandler";
import { setupKeyboardHandler } from "./setupKeyboardHandler";

type Handler = (event: KeyboardEvent) => boolean;

function makeFakeXTerm(overrides: Partial<KeyboardHandlerXTerm> = {}): {
	xterm: KeyboardHandlerXTerm;
	selectAllCalls: number;
	getHandler: () => Handler;
} {
	let handler: Handler | null = null;
	let selectAllCalls = 0;
	const base: KeyboardHandlerXTerm = {
		attachCustomKeyEventHandler: ((h: Handler) => {
			handler = h;
		}) as KeyboardHandlerXTerm["attachCustomKeyEventHandler"],
		hasSelection: () => false,
		selectAll: () => {
			selectAllCalls++;
		},
	};
	const xterm: KeyboardHandlerXTerm = { ...base, ...overrides };
	return {
		xterm,
		get selectAllCalls() {
			return selectAllCalls;
		},
		getHandler: () => {
			if (!handler) throw new Error("handler not attached");
			return handler;
		},
	};
}

function makeEvent(
	overrides: Partial<{
		type: string;
		code: string;
		key: string;
		metaKey: boolean;
		ctrlKey: boolean;
		altKey: boolean;
		shiftKey: boolean;
	}>,
): KeyboardEvent {
	return {
		type: "keydown",
		code: "KeyA",
		key: "a",
		metaKey: false,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		preventDefault: () => {},
		...overrides,
	} as unknown as KeyboardEvent;
}

function setPlatform(platform: string): void {
	Object.defineProperty(navigator, "platform", {
		value: platform,
		configurable: true,
	});
}

describe("setupKeyboardHandler CLEAR_TERMINAL (issue #3710)", () => {
	let originalPlatform: string;

	beforeEach(() => {
		originalPlatform = navigator.platform;
	});

	afterEach(() => {
		setPlatform(originalPlatform);
		useHotkeyOverridesStore.getState().resetOverride("CLEAR_TERMINAL");
	});

	it("fires onClear on Cmd+K on macOS (regression: clipboard-bubble used to swallow it)", () => {
		setPlatform("MacIntel");
		// Mirror the default mac binding; forces it regardless of test-runner platform
		useHotkeyOverridesStore.getState().setOverride("CLEAR_TERMINAL", "meta+k");

		let cleared = 0;
		const fake = makeFakeXTerm();
		setupKeyboardHandler(fake.xterm, {
			onClear: () => {
				cleared++;
			},
		});

		const result = fake.getHandler()(
			makeEvent({ code: "KeyK", key: "k", metaKey: true }),
		);

		expect(cleared).toBe(1);
		expect(result).toBe(false);
	});

	it("only fires onClear on keydown, not keyup", () => {
		setPlatform("MacIntel");
		useHotkeyOverridesStore.getState().setOverride("CLEAR_TERMINAL", "meta+k");

		let cleared = 0;
		const fake = makeFakeXTerm();
		setupKeyboardHandler(fake.xterm, {
			onClear: () => {
				cleared++;
			},
		});

		fake.getHandler()(
			makeEvent({ type: "keyup", code: "KeyK", key: "k", metaKey: true }),
		);

		expect(cleared).toBe(0);
	});

	it("fires onClear on Ctrl+Shift+K on Linux", () => {
		setPlatform("Linux x86_64");
		useHotkeyOverridesStore
			.getState()
			.setOverride("CLEAR_TERMINAL", "ctrl+shift+k");

		let cleared = 0;
		const fake = makeFakeXTerm();
		setupKeyboardHandler(fake.xterm, {
			onClear: () => {
				cleared++;
			},
		});

		const result = fake.getHandler()(
			makeEvent({
				code: "KeyK",
				key: "K",
				ctrlKey: true,
				shiftKey: true,
			}),
		);

		expect(cleared).toBe(1);
		expect(result).toBe(false);
	});

	it("still delegates Cmd+A to xterm.selectAll on macOS", () => {
		setPlatform("MacIntel");

		const fake = makeFakeXTerm();
		setupKeyboardHandler(fake.xterm, {});

		const result = fake.getHandler()(
			makeEvent({ code: "KeyA", key: "a", metaKey: true }),
		);

		expect(fake.selectAllCalls).toBe(1);
		expect(result).toBe(false);
	});

	it("does not invoke onClear for unrelated Cmd chords on macOS", () => {
		setPlatform("MacIntel");
		useHotkeyOverridesStore.getState().setOverride("CLEAR_TERMINAL", "meta+k");

		let cleared = 0;
		const fake = makeFakeXTerm();
		setupKeyboardHandler(fake.xterm, {
			onClear: () => {
				cleared++;
			},
		});

		// Cmd+C, Cmd+V, Cmd+W — all should bubble without invoking onClear.
		for (const code of ["KeyC", "KeyV", "KeyW"]) {
			fake.getHandler()(
				makeEvent({
					code,
					key: code.replace("Key", "").toLowerCase(),
					metaKey: true,
				}),
			);
		}

		expect(cleared).toBe(0);
	});
});
