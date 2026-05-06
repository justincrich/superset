import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LuFolder } from "react-icons/lu";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { getHostServiceClientByUrl } from "renderer/lib/host-service-client";
import { useFinalizeProjectSetup } from "renderer/react-query/projects";
import { ImportPageShell } from "../components/ImportPageShell";
import { ImportRow, type RowAction } from "../components/ImportRow";

interface ImportProjectsPageProps {
	organizationId: string;
	activeHostUrl: string;
}

interface AuditLogEntry {
	v2Id: string | null;
	status: string;
	reason: string | null;
}

export function ImportProjectsPage({
	organizationId,
	activeHostUrl,
}: ImportProjectsPageProps) {
	const projectsQuery = electronTrpc.migration.readV1Projects.useQuery();
	const auditQuery = electronTrpc.migration.listState.useQuery({
		organizationId,
	});

	const isLoading =
		projectsQuery.isPending || auditQuery.isPending || !projectsQuery.data;

	const auditByV1Id = new Map<string, AuditLogEntry>();
	for (const row of auditQuery.data ?? []) {
		if (row.kind !== "project") continue;
		auditByV1Id.set(row.v1Id, {
			v2Id: row.v2Id,
			status: row.status,
			reason: row.reason,
		});
	}

	const projects = projectsQuery.data ?? [];

	return (
		<ImportPageShell
			title="Bring over your projects"
			description="Import each v1 project into v2. Already-imported projects show as Imported."
			isLoading={isLoading}
			itemCount={projects.length}
			emptyMessage="No v1 projects found on this device."
		>
			{projects.map((project) => (
				<ProjectRow
					key={project.id}
					project={project}
					audit={auditByV1Id.get(project.id)}
					organizationId={organizationId}
					activeHostUrl={activeHostUrl}
				/>
			))}
		</ImportPageShell>
	);
}

interface ProjectRowProps {
	project: {
		id: string;
		name: string;
		mainRepoPath: string;
	};
	audit: AuditLogEntry | undefined;
	organizationId: string;
	activeHostUrl: string;
}

function ProjectRow({
	project,
	audit,
	organizationId,
	activeHostUrl,
}: ProjectRowProps) {
	const queryClient = useQueryClient();
	const finalizeSetup = useFinalizeProjectSetup();
	const upsertState = electronTrpc.migration.upsertState.useMutation();
	const trpcUtils = electronTrpc.useUtils();
	const [running, setRunning] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const auditImported =
		audit !== undefined &&
		(audit.status === "success" || audit.status === "linked");
	const auditError =
		audit !== undefined && audit.status === "error" ? audit.reason : null;

	const findByPathQuery = useQuery({
		queryKey: ["v1-import", "findByPath", project.mainRepoPath, activeHostUrl],
		queryFn: async () => {
			const client = getHostServiceClientByUrl(activeHostUrl);
			return client.project.findByPath.query({
				repoPath: project.mainRepoPath,
			});
		},
		enabled: !auditImported,
	});

	const runImport = async () => {
		setRunning(true);
		setErrorMessage(null);
		try {
			const client = getHostServiceClientByUrl(activeHostUrl);
			const candidates = findByPathQuery.data?.candidates ?? [];

			let v2ProjectId: string;
			let mainWorkspaceId: string | null = null;
			let repoPath = project.mainRepoPath;
			let status: "success" | "linked";

			const [first] = candidates;
			if (first) {
				const result = await client.project.setup.mutate({
					projectId: first.id,
					mode: { kind: "import", repoPath: project.mainRepoPath },
				});
				v2ProjectId = first.id;
				mainWorkspaceId = result.mainWorkspaceId;
				repoPath = result.repoPath;
				status = "linked";
			} else {
				const result = await client.project.create.mutate({
					name: project.name,
					mode: { kind: "importLocal", repoPath: project.mainRepoPath },
				});
				v2ProjectId = result.projectId;
				mainWorkspaceId = result.mainWorkspaceId;
				repoPath = result.repoPath;
				status = "success";
			}

			await upsertState.mutateAsync({
				v1Id: project.id,
				kind: "project",
				v2Id: v2ProjectId,
				organizationId,
				status,
				reason: null,
			});

			finalizeSetup(activeHostUrl, {
				projectId: v2ProjectId,
				repoPath,
				mainWorkspaceId,
			});

			await trpcUtils.migration.listState.invalidate({ organizationId });
			await queryClient.invalidateQueries({
				queryKey: ["v1-import", "findByPath", project.mainRepoPath],
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setErrorMessage(message);
			await upsertState
				.mutateAsync({
					v1Id: project.id,
					kind: "project",
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
		if (auditImported) {
			return {
				kind: "imported",
				label: audit?.status === "linked" ? "Linked" : "Imported",
			};
		}
		if (errorMessage) {
			return { kind: "error", message: errorMessage, onRetry: runImport };
		}
		if (auditError) {
			return { kind: "error", message: auditError, onRetry: runImport };
		}
		if (findByPathQuery.isPending) return { kind: "running" };
		const candidates = findByPathQuery.data?.candidates ?? [];
		if (candidates.length > 1) {
			return {
				kind: "blocked",
				reason: `${candidates.length} v2 projects use this repo — pick one in settings first`,
			};
		}
		return {
			kind: "ready",
			label: candidates.length === 1 ? "Link" : "Import",
			onClick: runImport,
		};
	})();

	return (
		<ImportRow
			icon={<LuFolder className="size-3.5" strokeWidth={2} />}
			primary={project.name}
			secondary={project.mainRepoPath}
			action={action}
		/>
	);
}
