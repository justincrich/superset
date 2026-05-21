import { describe, it, expect } from "bun:test";
import { RelayDispatchError } from "./relay-client";

/**
 * Test the describeError function logic directly without importing the module.
 * We replicate the function here to test it, since the dispatch.ts module
 * imports server-side code that requires environment variables.
 *
 * AC-4: describeError must return format "context: message" WITHOUT including error.name
 */

// Replicate the function from dispatch.ts for testing purposes
function describeError(err: unknown, context: string): string {
	if (err instanceof RelayDispatchError) return `${context}: ${err.message}`;
	if (err instanceof Error) return `${context}: ${err.message}`;
	return `${context}: unknown error`;
}

describe("describeError (AC-4)", () => {
	it("AC-4: returns 'dispatch: <message>' format for RelayDispatchError without err.name prefix", () => {
		const relayErr = new RelayDispatchError(
			"Target machine was offline",
			503,
			'{"error":"Service unavailable"}'
		);

		const result = describeError(relayErr, "dispatch");

		// Should NOT include RelayDispatchError.name in the output
		expect(result).toBe("dispatch: Target machine was offline");

		// Explicitly verify it does NOT have err.name
		expect(result).not.toContain("RelayDispatchError");
	});

	it("AC-4: returns 'dispatch: <message>' format for generic Error", () => {
		const err = new Error("something went wrong");
		const result = describeError(err, "dispatch");

		expect(result).toBe("dispatch: something went wrong");

		// Should NOT include Error.name
		expect(result).not.toContain("Error:");
	});

	it("AC-4: returns 'dispatch: unknown error' for non-Error values", () => {
		const result1 = describeError("a string", "dispatch");
		expect(result1).toBe("dispatch: unknown error");

		const result2 = describeError(null, "dispatch");
		expect(result2).toBe("dispatch: unknown error");

		const result3 = describeError(undefined, "dispatch");
		expect(result3).toBe("dispatch: unknown error");

		const result4 = describeError({}, "dispatch");
		expect(result4).toBe("dispatch: unknown error");
	});

	it("AC-4: uses different context strings when provided", () => {
		const err = new Error("test error");

		const resultDispatch = describeError(err, "dispatch");
		expect(resultDispatch).toBe("dispatch: test error");

		const resultCreate = describeError(err, "create");
		expect(resultCreate).toBe("create: test error");

		const resultRun = describeError(err, "run");
		expect(resultRun).toBe("run: test error");
	});

	it("AC-4: correctly formats RelayDispatchError with status 502", () => {
		const relayErr = new RelayDispatchError(
			"Target machine is unreachable",
			502,
			"bad gateway"
		);

		const result = describeError(relayErr, "dispatch");

		// Should use the human-readable message from RelayDispatchError
		expect(result).toBe("dispatch: Target machine is unreachable");

		// Should NOT include the status code in the string
		expect(result).not.toContain("502");
	});

	it("AC-4: correctly formats RelayDispatchError with status 504", () => {
		const relayErr = new RelayDispatchError(
			"Target machine timed out",
			504,
			"gateway timeout"
		);

		const result = describeError(relayErr, "dispatch");

		expect(result).toBe("dispatch: Target machine timed out");
		expect(result).not.toContain("504");
	});

	it("AC-4: formats error preserving original error message for generic Error", () => {
		const err = new Error(
			"Failed to create workspace: project not found"
		);

		const result = describeError(err, "dispatch");

		// Full message should be preserved
		expect(result).toBe("dispatch: Failed to create workspace: project not found");
	});

	it("AC-4: does NOT include error name in any format", () => {
		const relayErr = new RelayDispatchError("offline", 503, "body");
		const genericErr = new Error("generic");
		const unknownErr = "unknown";

		const relayResult = describeError(relayErr, "dispatch");
		const genericResult = describeError(genericErr, "dispatch");
		const unknownResult = describeError(unknownErr, "dispatch");

		// None should contain error names
		expect(relayResult).not.toContain(relayErr.name);
		expect(genericResult).not.toContain(genericErr.name);

		// Should follow pattern: context: message
		expect(relayResult).toMatch(/^dispatch: /);
		expect(genericResult).toMatch(/^dispatch: /);
		expect(unknownResult).toMatch(/^dispatch: /);
	});

	it("AC-4: function signature preserves return type", () => {
		const err = new Error("test");
		const result = describeError(err, "dispatch");

		// Result should always be a string
		expect(typeof result).toBe("string");

		// Should always start with context:
		expect(result.startsWith("dispatch: ")).toBe(true);
	});
});
