import { getDeviceName, getHashedDeviceId } from "@superset/shared/device-info";
import { TRPCError } from "@trpc/server";
import { workspaces } from "../../../../../../../db/schema";
import type { HostServiceContext } from "../../../../../../../types";

export interface RegisterWorkspaceArgs {
	ctx: HostServiceContext;
	id?: string;
	projectId: string;
	name: string;
	branch: string;
	worktreePath: string;
	rollback: () => Promise<void>;
}

/**
 * ensureV2Host → cloud workspace create → local workspaces insert.
 * Rolls back the worktree (caller-supplied) and any preceding cloud row
 * on failure.
 */
export async function registerWorkspace(args: RegisterWorkspaceArgs): Promise<{
	id: string;
	projectId: string;
	name: string;
	branch: string;
}> {
	const deviceClientId = getHashedDeviceId();
	const deviceName = getDeviceName();

	let host: { id: string };
	try {
		host = await args.ctx.api.device.ensureV2Host.mutate({
			organizationId: args.ctx.organizationId,
			machineId: deviceClientId,
			name: deviceName,
		});
	} catch (err) {
		await args.rollback();
		if (err instanceof TRPCError) throw err;
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Failed to register host: ${err instanceof Error ? err.message : String(err)}`,
		});
	}

	const cloudRow = await args.ctx.api.v2Workspace.create
		.mutate({
			id: args.id,
			organizationId: args.ctx.organizationId,
			projectId: args.projectId,
			name: args.name,
			branch: args.branch,
			hostId: host.id,
		})
		.catch(async (err) => {
			await args.rollback();
			throw err;
		});

	if (!cloudRow) {
		await args.rollback();
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Cloud workspace create returned no row",
		});
	}

	try {
		args.ctx.db
			.insert(workspaces)
			.values({
				id: cloudRow.id,
				projectId: args.projectId,
				worktreePath: args.worktreePath,
				branch: args.branch,
			})
			.run();
	} catch (err) {
		await args.rollback();
		await args.ctx.api.v2Workspace.delete
			.mutate({ id: cloudRow.id })
			.catch((cleanupErr) => {
				console.warn("[registerWorkspace] failed to rollback cloud workspace", {
					workspaceId: cloudRow.id,
					err: cleanupErr,
				});
			});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `Failed to persist workspace locally: ${err instanceof Error ? err.message : String(err)}`,
		});
	}

	return cloudRow;
}
