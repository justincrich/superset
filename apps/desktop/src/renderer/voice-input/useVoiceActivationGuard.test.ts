import { describe, expect, test } from "bun:test";
import { runVoiceActivationShortcut } from "./useVoiceActivationGuard";

describe("voice activation guard", () => {
	test("blocksActivationWhenVoiceInputIsDisabled", () => {
		let activationCount = 0;

		const result = runVoiceActivationShortcut({
			voiceInputEnabled: false,
			getActiveTarget: () => "chat",
			onActivate: () => {
				activationCount += 1;
			},
		});

		expect(result).toEqual({ status: "disabled" });
		expect(activationCount).toBe(0);
	});

	test("evaluatesTargetWhenVoiceInputIsEnabled", () => {
		let targetChecks = 0;

		runVoiceActivationShortcut({
			voiceInputEnabled: true,
			getActiveTarget: () => {
				targetChecks += 1;
				return "chat";
			},
			onActivate: () => {},
		});

		expect(targetChecks).toBe(1);
	});

	test("returnsUnsupportedTargetWithoutStartingCapture", () => {
		let activationCount = 0;

		const result = runVoiceActivationShortcut({
			voiceInputEnabled: true,
			getActiveTarget: () => null,
			onActivate: () => {
				activationCount += 1;
			},
		});

		expect(result).toEqual({
			status: "unsupported-target",
			reason: "no-supported-target-focused",
		});
		expect(activationCount).toBe(0);
	});

	test("doesNotInterceptNormalInputEvents", () => {
		let activationCount = 0;
		const input = new EventTarget();

		runVoiceActivationShortcut({
			voiceInputEnabled: false,
			getActiveTarget: () => "chat",
			onActivate: () => {
				activationCount += 1;
			},
		});

		const observedEvents: string[] = [];
		const normalInputEvents = ["keydown", "beforeinput", "input", "paste"];
		for (const eventType of normalInputEvents) {
			input.addEventListener(eventType, (event) => {
				observedEvents.push(event.type);
			});
			input.dispatchEvent(new Event(eventType));
		}

		expect(observedEvents).toEqual(normalInputEvents);
		expect(activationCount).toBe(0);
	});
});
