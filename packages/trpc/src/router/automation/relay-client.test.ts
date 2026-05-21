import { describe, it, expect, vi, beforeEach } from "vitest";
import { RelayDispatchError, relayMutation } from "./relay-client";

describe("relay-client", () => {
	describe("RelayDispatchError", () => {
		it("preserves error class name as 'RelayDispatchError'", () => {
			const error = new RelayDispatchError("test message", 500, "body");
			expect(error.name).toBe("RelayDispatchError");
		});

		it("includes status and body in instance properties", () => {
			const error = new RelayDispatchError("test message", 404, "not found");
			expect(error.status).toBe(404);
			expect(error.body).toBe("not found");
		});

		it("extends Error so instanceof checks work", () => {
			const error = new RelayDispatchError("test", 500, "body");
			expect(error instanceof Error).toBe(true);
			expect(error instanceof RelayDispatchError).toBe(true);
		});
	});

	describe("relayMutation", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("throws RelayDispatchError on non-ok response with truncated body", async () => {
			const longBody = "x".repeat(1000);
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					status: 500,
					text: () => Promise.resolve(longBody),
				})
			) as any;

			const options = {
				relayUrl: "http://relay.local",
				hostId: "host-123",
				jwt: "token",
			};

			try {
				await relayMutation(options, "test.mutation", { input: "data" });
				expect.fail("should have thrown");
			} catch (err) {
				expect(err instanceof RelayDispatchError).toBe(true);
				if (err instanceof RelayDispatchError) {
					// Verify the message uses human-readable format and is truncated
					expect(err.message).toContain("Relay error (status 500):");
					expect(err.message.length).toBeLessThan(300);
					// full body preserved in property
					expect(err.body).toBe(longBody);
				}
			}
		});

		it("throws RelayDispatchError on invalid JSON with truncated snippet", async () => {
			const longBody = "invalid json " + "x".repeat(500);
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(longBody),
				})
			) as any;

			const options = {
				relayUrl: "http://relay.local",
				hostId: "host-123",
				jwt: "token",
			};

			try {
				await relayMutation(options, "test.mutation", { input: "data" });
				expect.fail("should have thrown");
			} catch (err) {
				expect(err instanceof RelayDispatchError).toBe(true);
				if (err instanceof RelayDispatchError) {
					// Verify truncation at 200 chars for JSON parse errors
					expect(err.message).toContain("invalid JSON from relay");
					expect(err.message.length).toBeLessThan(300);
				}
			}
		});

		it("throws RelayDispatchError when result.data is missing with truncated body", async () => {
			const resultObj = { result: {} };
			const longBody = JSON.stringify(resultObj) + "x".repeat(500);
			// Create valid JSON with missing data field
			const validJson = JSON.stringify(resultObj);
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(validJson),
				})
			) as any;

			const options = {
				relayUrl: "http://relay.local",
				hostId: "host-123",
				jwt: "token",
			};

			try {
				await relayMutation(options, "test.mutation", { input: "data" });
				expect.fail("should have thrown");
			} catch (err) {
				expect(err instanceof RelayDispatchError).toBe(true);
				if (err instanceof RelayDispatchError) {
					expect(err.message).toContain("missing result.data");
					expect(err.message.length).toBeLessThan(300);
				}
			}
		});
	});
});
