import { beforeEach, describe, expect, test } from "bun:test";
import { buildSubmitPrompt } from "./buildSubmitPrompt";
import {
	makePromptContextKey,
	useNewWorkspacePromptContextStore,
} from "./store";

describe("buildSubmitPrompt", () => {
	beforeEach(() => {
		useNewWorkspacePromptContextStore.setState({ entries: new Map() });
	});

	test("scopes linked GitHub issue bodies by project and host context", async () => {
		const store = useNewWorkspacePromptContextStore.getState();
		store.register(makePromptContextKey("github-issue", 7, "project-a"), () =>
			Promise.resolve({ text: "body from project A" }),
		);
		store.register(makePromptContextKey("github-issue", 7, "project-b"), () =>
			Promise.resolve({ text: "body from project B" }),
		);
		await store.awaitPending(1000);

		const prompt = buildSubmitPrompt({
			userPrompt: "",
			linkedPR: null,
			contextScope: "project-b",
			linkedIssues: [
				{
					source: "github",
					slug: "gh-7",
					title: "Issue 7",
					number: 7,
					url: "https://example.com/issues/7",
				},
			],
		});

		expect(prompt).toContain("body from project B");
		expect(prompt).not.toContain("body from project A");
	});
});
