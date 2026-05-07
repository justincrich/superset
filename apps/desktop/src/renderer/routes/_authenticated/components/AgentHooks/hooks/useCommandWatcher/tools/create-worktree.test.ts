import { describe, expect, mock, test } from "bun:test";
import { createWorkspace } from "./create-worktree";
import type { ToolContext } from "./types";

// Reproduction for issue #4186 — UI not refreshing after MCP create_workspace.
//
// The MCP create_workspace tool routes through the desktop's v1 mutation
// (`electronTrpc.workspaces.create` → `localDb.workspaces`) and then leans on
// `useCreateWorkspace`'s `onSuccess` callback to fire
// `utils.workspaces.invalidate()`. That invalidation only touches v1 tRPC
// query keys — it cannot wake up the cloud-synced `v2Workspaces` Electric
// collection that the v2 dashboard sidebar reads from. The tool also never
// asks the host to create a `v2_workspaces` cloud row, so the v2 sidebar has
// nothing to sync once a workspace is created via MCP.
//
// `useCommandWatcher` exposes a `refetchWorkspaces` helper on the tool
// context for exactly this kind of UI-refresh signaling, but the tool never
// calls it. The test below pins that gap.
function buildWorkspaceResult(
	overrides: Partial<{ id: string; name: string; branch: string }> = {},
) {
	return {
		workspace: {
			id: overrides.id ?? "workspace-mcp-1",
			name: overrides.name ?? "MCP Workspace",
			branch: overrides.branch ?? "feature/mcp",
		},
		worktreePath: "/repos/example/.worktrees/feature-mcp",
		wasExisting: false,
	};
}

function buildCtx() {
	const mutateAsync = mock(async () => buildWorkspaceResult());
	const refetchWorkspaces = mock(async () => undefined);

	const ctx = {
		createWorktree: { mutateAsync },
		setActive: { mutateAsync: mock(async () => ({})) },
		deleteWorkspace: { mutateAsync: mock(async () => ({ success: true })) },
		updateWorkspace: { mutateAsync: mock(async () => ({})) },
		terminalCreateOrAttach: { mutateAsync: mock(async () => ({})) },
		terminalWrite: { mutateAsync: mock(async () => ({})) },
		refetchWorkspaces,
		getWorkspaces: () => [],
		getProjects: () => [],
		getActiveWorkspaceId: () => null,
		getWorktreePathByWorkspaceId: () => undefined,
	} as unknown as ToolContext;

	return { ctx, mutateAsync, refetchWorkspaces };
}

describe("createWorkspace tool — issue #4186 reproduction", () => {
	test("invokes the v1 mutation for each workspace input", async () => {
		const { ctx, mutateAsync } = buildCtx();

		const result = await createWorkspace.execute(
			{
				projectId: "project-1",
				workspaces: [{ name: "feat-a" }, { name: "feat-b" }],
			},
			ctx,
		);

		expect(result.success).toBe(true);
		expect(mutateAsync).toHaveBeenCalledTimes(2);
	});

	// `test.failing` documents the regression: today the tool does not call
	// `ctx.refetchWorkspaces` after a successful create, so the renderer has
	// no UI-refresh signal beyond the mutation hook's v1-only invalidation.
	// When the bug is fixed (e.g. by calling `ctx.refetchWorkspaces()` after
	// the mutation, or by routing v2 creates through a v2-aware path), this
	// test starts passing and should be flipped back to `test`.
	test.failing("signals the renderer to refresh the workspace list after creation", async () => {
		const { ctx, refetchWorkspaces } = buildCtx();

		await createWorkspace.execute(
			{ projectId: "project-1", workspaces: [{ name: "feat-a" }] },
			ctx,
		);

		expect(refetchWorkspaces).toHaveBeenCalled();
	});
});
