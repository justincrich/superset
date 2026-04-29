import { describe, expect, mock, test } from "bun:test";
import { resolveStartPoint } from "./resolve-start-point";

function createMockGit(existingFullRefs: Set<string>, defaultBranch?: string) {
	return {
		raw: mock(async (args: string[]) => {
			if (args[0] === "rev-parse" && args[1] === "--verify") {
				const ref = args[3]?.replace("^{commit}", "") ?? "";
				if (existingFullRefs.has(ref)) return "";
				throw new Error("fatal: Needed a single revision");
			}
			if (
				args[0] === "symbolic-ref" &&
				args[1] === "refs/remotes/origin/HEAD"
			) {
				if (defaultBranch) return `origin/${defaultBranch}`;
				throw new Error(
					"fatal: ref refs/remotes/origin/HEAD is not a symbolic ref",
				);
			}
			throw new Error(`Unexpected raw args: ${args.join(" ")}`);
		}),
	} as never;
}

describe("resolveStartPoint", () => {
	test("prefers local branch when it exists (even if origin/<branch> also exists)", async () => {
		const git = createMockGit(
			new Set(["refs/remotes/origin/main", "refs/heads/main"]),
		);
		const result = await resolveStartPoint(git, "main");

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("main");
			expect(result.fullRef).toBe("refs/heads/main");
		}
	});

	test("falls back to remote-tracking when local doesn't exist", async () => {
		const git = createMockGit(new Set(["refs/remotes/origin/main"]));
		const result = await resolveStartPoint(git, "main");

		expect(result.kind).toBe("remote-tracking");
		if (result.kind === "remote-tracking") {
			expect(result.shortName).toBe("main");
			expect(result.remote).toBe("origin");
			expect(result.fullRef).toBe("refs/remotes/origin/main");
		}
	});

	test("returns local for a local-only branch (e.g. workspace branch)", async () => {
		const git = createMockGit(new Set(["refs/heads/main"]));
		const result = await resolveStartPoint(git, "main");

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("main");
		}
	});

	test("workspace-style branch (local + stale remote cache) prefers local", async () => {
		const git = createMockGit(
			new Set([
				"refs/heads/agreeable-ermine",
				"refs/remotes/origin/agreeable-ermine",
			]),
		);
		const result = await resolveStartPoint(git, "agreeable-ermine");

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("agreeable-ermine");
		}
	});

	test("falls back to HEAD when neither exists", async () => {
		const git = createMockGit(new Set());
		const result = await resolveStartPoint(git, "main");

		expect(result.kind).toBe("head");
	});

	test("works with explicit branch name", async () => {
		const git = createMockGit(
			new Set(["refs/remotes/origin/develop", "refs/heads/develop"]),
		);
		const result = await resolveStartPoint(git, "develop");

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("develop");
		}
	});

	test("resolves default branch via symbolic-ref when baseBranch not provided", async () => {
		const git = createMockGit(
			new Set(["refs/remotes/origin/master", "refs/heads/master"]),
			"master",
		);
		const result = await resolveStartPoint(git, undefined);

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("master");
		}
	});

	test("defaults to 'main' when symbolic-ref fails and baseBranch not provided", async () => {
		const git = createMockGit(new Set(["refs/remotes/origin/main"]));
		const result = await resolveStartPoint(git, undefined);

		expect(result.kind).toBe("remote-tracking");
		if (result.kind === "remote-tracking") {
			expect(result.shortName).toBe("main");
		}
	});

	test("falls back to HEAD when symbolic-ref fails and no default branch exists", async () => {
		const git = createMockGit(new Set());
		const result = await resolveStartPoint(git, undefined);

		expect(result.kind).toBe("head");
	});

	test("handles empty/whitespace baseBranch as undefined", async () => {
		const git = createMockGit(new Set(["refs/remotes/origin/main"]));
		const result = await resolveStartPoint(git, "  ");

		expect(result.kind).toBe("remote-tracking");
		if (result.kind === "remote-tracking") {
			expect(result.shortName).toBe("main");
		}
	});

	test("local branch named origin/foo classifies as local, not remote-tracking", async () => {
		const git = createMockGit(new Set(["refs/heads/origin/foo"]));
		const result = await resolveStartPoint(git, "origin/foo");

		expect(result.kind).toBe("local");
		if (result.kind === "local") {
			expect(result.shortName).toBe("origin/foo");
			expect(result.fullRef).toBe("refs/heads/origin/foo");
		}
	});
});
