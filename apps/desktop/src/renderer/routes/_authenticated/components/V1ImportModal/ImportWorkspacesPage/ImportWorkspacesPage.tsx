import { useState } from "react";
import { LuLayoutGrid } from "react-icons/lu";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { getHostServiceClientByUrl } from "renderer/lib/host-service-client";
import { useDashboardSidebarState } from "renderer/routes/_authenticated/hooks/useDashboardSidebarState";
import { ImportPageShell } from "../components/ImportPageShell";
import { ImportRow, type RowAction } from "../components/ImportRow";

interface ImportWorkspacesPageProps {
	organizationId: string;
	activeHostUrl: string;
}

interface AuditLogEntry {
	v2Id: string | null;
	status: string;
	reason: string | null;
}

export function ImportWorkspacesPage({
	organizationId,
	activeHostUrl,
}: ImportWorkspacesPageProps) {
	const projectsQuery = electronTrpc.migration.readV1Projects.useQuery();
	const workspacesQuery = electronTrpc.migration.readV1Workspaces.useQuery();
	const worktreesQuery = electronTrpc.migration.readV1Worktrees.useQuery();
	const auditQuery = electronTrpc.migration.listState.useQuery({
		organizationId,
	});

	const isLoading =
		projectsQuery.isPending ||
		workspacesQuery.isPending ||
		worktreesQuery.isPending ||
		auditQuery.isPending;

	const projectAuditByV1Id = new Map<string, AuditLogEntry>();
	const workspaceAuditByV1Id = new Map<string, AuditLogEntry>();
	for (const row of auditQuery.data ?? []) {
		const entry: AuditLogEntry = {
			v2Id: row.v2Id,
			status: row.status,
			reason: row.reason,
		};
		if (row.kind === "project") projectAuditByV1Id.set(row.v1Id, entry);
		else if (row.kind === "workspace")
			workspaceAuditByV1Id.set(row.v1Id, entry);
	}

	const projectsById = new Map(
		(projectsQuery.data ?? []).map((p) => [p.id, p]),
	);
	const worktreesById = new Map(
		(worktreesQuery.data ?? []).map((w) => [w.id, w]),
	);
	const workspaces = workspacesQuery.data ?? [];

	const grouped = new Map<
		string,
		{
			projectName: string;
			items: typeof workspaces;
		}
	>();
	for (const workspace of workspaces) {
		const project = projectsById.get(workspace.projectId);
		if (!project) continue;
		const bucket = grouped.get(workspace.projectId) ?? {
			projectName: project.name,
			items: [],
		};
		bucket.items.push(workspace);
		grouped.set(workspace.projectId, bucket);
	}

	return (
		<ImportPageShell
			title="Bring over your workspaces"
			description="Adopt v1 workspaces under their imported v2 project. Workspaces under non-imported projects are blocked."
			isLoading={isLoading}
			itemCount={workspaces.length}
			emptyMessage="No v1 workspaces found on this device."
		>
			{Array.from(grouped.entries()).map(([projectV1Id, group]) => (
				<div key={projectV1Id} className="mb-2 flex min-w-0 flex-col">
					<div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
						{group.projectName}
					</div>
					{group.items.map((workspace) => (
						<WorkspaceRow
							key={workspace.id}
							workspace={workspace}
							worktreePath={
								workspace.worktreeId
									? worktreesById.get(workspace.worktreeId)?.path
									: undefined
							}
							baseBranch={
								workspace.worktreeId
									? (worktreesById.get(workspace.worktreeId)?.baseBranch ??
										null)
									: null
							}
							projectAudit={projectAuditByV1Id.get(workspace.projectId)}
							workspaceAudit={workspaceAuditByV1Id.get(workspace.id)}
							organizationId={organizationId}
							activeHostUrl={activeHostUrl}
						/>
					))}
				</div>
			))}
		</ImportPageShell>
	);
}

interface WorkspaceRowProps {
	workspace: {
		id: string;
		name: string;
		branch: string;
		projectId: string;
	};
	worktreePath: string | undefined;
	baseBranch: string | null;
	projectAudit: AuditLogEntry | undefined;
	workspaceAudit: AuditLogEntry | undefined;
	organizationId: string;
	activeHostUrl: string;
}

function WorkspaceRow({
	workspace,
	worktreePath,
	baseBranch,
	projectAudit,
	workspaceAudit,
	organizationId,
	activeHostUrl,
}: WorkspaceRowProps) {
	const upsertState = electronTrpc.migration.upsertState.useMutation();
	const trpcUtils = electronTrpc.useUtils();
	const { ensureWorkspaceInSidebar } = useDashboardSidebarState();
	const [running, setRunning] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const parentImported =
		projectAudit !== undefined &&
		projectAudit.v2Id !== null &&
		(projectAudit.status === "success" || projectAudit.status === "linked");
	const v2ProjectId = parentImported ? (projectAudit?.v2Id ?? null) : null;

	const auditImported =
		workspaceAudit !== undefined && workspaceAudit.status === "success";
	const auditError =
		workspaceAudit !== undefined && workspaceAudit.status === "error"
			? workspaceAudit.reason
			: null;

	const runImport = async () => {
		if (!v2ProjectId) return;
		setRunning(true);
		setErrorMessage(null);
		try {
			const client = getHostServiceClientByUrl(activeHostUrl);
			const result = await client.workspaceCreation.adopt.mutate({
				projectId: v2ProjectId,
				workspaceName: workspace.name,
				branch: workspace.branch,
				baseBranch: baseBranch ?? undefined,
				existingWorkspaceId: workspaceAudit?.v2Id ?? undefined,
				worktreePath,
			});

			await upsertState.mutateAsync({
				v1Id: workspace.id,
				kind: "workspace",
				v2Id: result.workspace.id,
				organizationId,
				status: "success",
				reason: null,
			});

			ensureWorkspaceInSidebar(result.workspace.id, v2ProjectId);
			await trpcUtils.migration.listState.invalidate({ organizationId });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setErrorMessage(message);
			await upsertState
				.mutateAsync({
					v1Id: workspace.id,
					kind: "workspace",
					v2Id: null,
					organizationId,
					status: "error",
					reason: message,
				})
				.catch(() => {});
			await trpcUtils.migration.listState.invalidate({ organizationId });
		} finally {
			setRunning(false);
		}
	};

	const action: RowAction = (() => {
		if (running) return { kind: "running" };
		if (auditImported) return { kind: "imported" };
		if (!parentImported) {
			return {
				kind: "blocked",
				reason: "Import the project on the Projects tab first.",
			};
		}
		if (errorMessage) {
			return { kind: "error", message: errorMessage, onRetry: runImport };
		}
		if (auditError) {
			return { kind: "error", message: auditError, onRetry: runImport };
		}
		return { kind: "ready", label: "Adopt", onClick: runImport };
	})();

	return (
		<ImportRow
			icon={<LuLayoutGrid className="size-3.5" strokeWidth={2} />}
			primary={workspace.name}
			secondary={workspace.branch}
			action={action}
		/>
	);
}
