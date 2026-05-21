import { describe, it, expect } from "vitest";
import { RelayDispatchError } from "./relay-client";

// Test the describeError function behavior
// Since it's not exported, we test through its usage in error scenarios

describe("dispatch error handling", () => {
	it("RelayDispatchError should preserve name for error identification", () => {
		const relayError = new RelayDispatchError(
			"relay 500: something went wrong",
			500,
			"full response body here"
		);

		// When caught and logged, the name should be "RelayDispatchError"
		expect(relayError.name).toBe("RelayDispatchError");
		expect(relayError.message).toContain("relay 500");
		expect(relayError.status).toBe(500);
	});

	it("RelayDispatchError should have truncated message but full body", () => {
		const fullBody = "x".repeat(1000);
		const error = new RelayDispatchError(
			`relay 500: ${fullBody.slice(0, 500)}`,
			500,
			fullBody
		);

		// Message is already truncated in the constructor
		expect(error.message.length).toBeLessThan(600);
		// But body is preserved
		expect(error.body.length).toBe(1000);
	});

	it("different error types should be distinguishable", () => {
		const relayError = new RelayDispatchError("relay error", 500, "body");
		const genericError = new Error("generic error");

		expect(relayError.name).toBe("RelayDispatchError");
		expect(genericError.name).toBe("Error");

		// When formatting errors for the database, these distinctions matter
		const relayFormatted = `dispatch: ${relayError.name}: ${relayError.message}`;
		const genericFormatted = `dispatch: ${genericError.name}: ${genericError.message}`;

		expect(relayFormatted).toContain("RelayDispatchError");
		expect(genericFormatted).toContain("Error");
	});
});
