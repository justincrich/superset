import { projects, workspaces } from "@superset/local-db";
import { eq } from "drizzle-orm";
import { getHostServiceCoordinator } from "main/lib/host-service-coordinator";
import { localDb } from "main/lib/local-db";
import { getWorkspaceRuntimeRegistry } from "main/lib/workspace-runtime/registry";

export type ResourceMetricsSurface = "v1" | "v2";

export interface WorkspaceSessionEntry {
	sessionId: string;
	paneId: string;
	pid: number;
	title: string | null;
}

export type WorkspaceSessionMap = Map<string, WorkspaceSessionEntry[]>;

export interface WorkspaceMetadata {
	workspaceName: string;
	projectId: string;
	projectName: string;
}

interface V2ResourceSessionPayload {
	terminalId: unknown;
	workspaceId: unknown;
	pid: unknown;
	title: unknown;
}

function toPositiveInteger(value: unknown): number | null {
	if (typeof value !== "number" || !Number.isFinite(value)) return null;
	const integer = Math.floor(value);
	return integer > 0 ? integer : null;
}

async function collectV1WorkspaceSessionMap(): Promise<WorkspaceSessionMap> {
	const registry = getWorkspaceRuntimeRegistry();
	const { sessions } = await registry
		.getDefault()
		.terminal.management.listSessions();
	const workspaceSessionMap: WorkspaceSessionMap = new Map();

	for (const session of sessions) {
		if (!session.isAlive || session.pid == null) continue;

		let entries = workspaceSessionMap.get(session.workspaceId);
		if (!entries) {
			entries = [];
			workspaceSessionMap.set(session.workspaceId, entries);
		}
		entries.push({
			sessionId: session.sessionId,
			paneId: session.paneId,
			pid: session.pid,
			title: null,
		});
	}

	return workspaceSessionMap;
}

export function parseV2ResourceSessions(payload: unknown): WorkspaceSessionMap {
	const workspaceSessionMap: WorkspaceSessionMap = new Map();
	const rawSessions =
		payload &&
		typeof payload === "object" &&
		Array.isArray((payload as { sessions?: unknown }).sessions)
			? (payload as { sessions: unknown[] }).sessions
			: [];

	for (const rawSession of rawSessions) {
		if (!rawSession || typeof rawSession !== "object") continue;
		const session = rawSession as V2ResourceSessionPayload;
		if (typeof session.terminalId !== "string" || !session.terminalId) {
			continue;
		}
		if (typeof session.workspaceId !== "string" || !session.workspaceId) {
			continue;
		}
		const pid = toPositiveInteger(session.pid);
		if (pid === null) continue;

		let entries = workspaceSessionMap.get(session.workspaceId);
		if (!entries) {
			entries = [];
			workspaceSessionMap.set(session.workspaceId, entries);
		}
		entries.push({
			sessionId: session.terminalId,
			paneId: session.terminalId,
			pid,
			title: typeof session.title === "string" ? session.title : null,
		});
	}

	return workspaceSessionMap;
}

function mergeWorkspaceSessionMaps(
	target: WorkspaceSessionMap,
	source: WorkspaceSessionMap,
): void {
	for (const [workspaceId, entries] of source) {
		const targetEntries = target.get(workspaceId);
		if (targetEntries) {
			targetEntries.push(...entries);
		} else {
			target.set(workspaceId, [...entries]);
		}
	}
}

async function collectV2WorkspaceSessionMap(
	organizationId?: string,
): Promise<WorkspaceSessionMap> {
	const coordinator = getHostServiceCoordinator();
	const organizationIds = organizationId
		? [organizationId]
		: coordinator.getActiveOrganizationIds();
	const workspaceSessionMap: WorkspaceSessionMap = new Map();

	await Promise.all(
		organizationIds.map(async (id) => {
			const connection = coordinator.getConnection(id);
			if (!connection) return;

			try {
				const response = await fetch(
					`http://127.0.0.1:${connection.port}/terminal/resource-sessions`,
					{
						headers: {
							Authorization: `Bearer ${connection.secret}`,
						},
					},
				);
				if (!response.ok) {
					console.warn(
						`[resource-metrics] Failed to list v2 terminal resource sessions for org ${id}: ${response.status}`,
					);
					return;
				}
				mergeWorkspaceSessionMaps(
					workspaceSessionMap,
					parseV2ResourceSessions(await response.json()),
				);
			} catch (error) {
				console.warn(
					`[resource-metrics] Failed to list v2 terminal resource sessions for org ${id}`,
					error,
				);
			}
		}),
	);

	return workspaceSessionMap;
}

export function collectWorkspaceSessionMap({
	surface,
	organizationId,
}: {
	surface: ResourceMetricsSurface;
	organizationId?: string;
}): Promise<WorkspaceSessionMap> {
	return surface === "v2"
		? collectV2WorkspaceSessionMap(organizationId)
		: collectV1WorkspaceSessionMap();
}

export function getWorkspaceMetadata(
	surface: ResourceMetricsSurface,
	workspaceId: string,
): WorkspaceMetadata {
	if (surface === "v1") {
		const ws = localDb
			.select({
				workspaceName: workspaces.name,
				projectId: workspaces.projectId,
				projectName: projects.name,
			})
			.from(workspaces)
			.leftJoin(projects, eq(projects.id, workspaces.projectId))
			.where(eq(workspaces.id, workspaceId))
			.get();

		return {
			workspaceName: ws?.workspaceName ?? "Unknown",
			projectId: ws?.projectId ?? "unknown",
			projectName: ws?.projectName ?? "Unknown Project",
		};
	}

	// v2 workspace/project display names are hydrated in the renderer from
	// Electric collections. Keep stable non-empty placeholders for validation.
	return {
		workspaceName: `Workspace ${workspaceId.slice(0, 8)}`,
		projectId: "v2",
		projectName: "V2 Workspaces",
	};
}
