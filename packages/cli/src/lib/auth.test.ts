import { describe, expect, test } from "bun:test";
import { login } from "./auth";

describe("login", () => {
	test("surfaces the authorization URL via onAuthUrl before launching the browser", async () => {
		const controller = new AbortController();
		const urls: string[] = [];

		const loginPromise = login({
			signal: controller.signal,
			onAuthUrl: (url) => {
				urls.push(url);
				controller.abort();
			},
		});

		await expect(loginPromise).rejects.toThrow();

		expect(urls).toHaveLength(1);
		const parsed = new URL(urls[0]!);
		expect(parsed.pathname).toBe("/cli/authorize");
		expect(parsed.searchParams.get("redirect_uri")).toMatch(
			/^http:\/\/127\.0\.0\.1:\d+\/callback$/,
		);
		expect(parsed.searchParams.get("state")).toBeTruthy();
	});
});
