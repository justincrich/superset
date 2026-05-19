import type { WorkspaceState } from "@superset/panes";
import { buildHostRoutingKey } from "@superset/shared/host-routing";
import { useLiveQuery } from "@tanstack/react-db";
import { useEffectEvent, useMemo } from "react";
import { useRelayUrl } from "renderer/hooks/useRelayUrl";
import { authClient } from "renderer/lib/auth-client";
import { electronTrpc } from "renderer/lib/electron-trpc";
import type { PaneViewerData } from "renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/types";
import { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import {
	type InFlightEntry,
	useWorkspaceCreatesStore,
} from "renderer/stores/workspace-creates";
import { NOTIFICATION_EVENTS } from "shared/constants";
import type { AgentLifecycleEvent } from "shared/notification-types";
import {
	HostNotificationSubscriber,
	type HostNotificationWorkspaceState,
} from "./components/HostNotificationSubscriber";
import { handleV2AgentLifecycleStatusEvent } from "./lib/lifecycleEvents";

interface WorkspaceHostRow {
	workspaceId: string;
	organizationId: string;
	hostId: string;
	name: string;
	branch: string;
}

interface HostNotificationSubscriberGroup {
	hostUrl: string;
	workspaces: HostNotificationWorkspaceState[];
}

type ElectronNotificationEventName =
	(typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

type ElectronNotificationEvent =
	| {
			type: typeof NOTIFICATION_EVENTS.AGENT_LIFECYCLE;
			data?: AgentLifecycleEvent;
	  }
	| {
			type: Exclude<
				ElectronNotificationEventName,
				typeof NOTIFICATION_EVENTS.AGENT_LIFECYCLE
			>;
			data?: unknown;
	  };

/**
 * Mounts one v2 notification listener per host-service URL so backgrounded
 * workspaces update their sidebar status indicator and play the finish sound.
 * Sibling to `AgentHooks`; rendered at the authenticated layout level.
 *
 * A host subscriber subscribes with workspaceId `*` and filters against the
 * workspaces assigned to that host. This keeps the topology O(1 listener per
 * host), not O(1 listener and settings observer per workspace).
 */
export function V2NotificationController() {
	const collections = useCollections();
	const { machineId, activeHostUrl } = useLocalHostService();
	const relayUrl = useRelayUrl();
	const { data: session } = authClient.useSession();
	const activeOrganizationId = session?.session?.activeOrganizationId ?? null;
	const inFlightCreates = useWorkspaceCreatesStore((store) => store.entries);
	const { data: workspaceHosts = [] } = useLiveQuery(
		(q) =>
			q
				.from({ v2Workspaces: collections.v2Workspaces })
				.select(({ v2Workspaces }) => ({
					workspaceId: v2Workspaces.id,
					organizationId: v2Workspaces.organizationId,
					hostId: v2Workspaces.hostId,
					name: v2Workspaces.name,
					branch: v2Workspaces.branch,
				})),
		[collections],
	);
	const { data: localWorkspaceRows = [] } = useLiveQuery(
		(q) =>
			q
				.from({ v2WorkspaceLocalState: collections.v2WorkspaceLocalState })
				.select(({ v2WorkspaceLocalState }) => ({
					workspaceId: v2WorkspaceLocalState.workspaceId,
					paneLayout: v2WorkspaceLocalState.paneLayout,
				})),
		[collections],
	);
	const notificationWorkspaceHosts = useMemo(
		() =>
			mergeWorkspaceHostRows(
				workspaceHosts,
				getInFlightWorkspaceHostRows({
					entries: inFlightCreates,
					organizationId: activeOrganizationId,
				}),
			),
		[workspaceHosts, inFlightCreates, activeOrganizationId],
	);
	const workspaceStatesById = useMemo(
		() =>
			getNotificationWorkspaceStatesById({
				workspaceHosts: notificationWorkspaceHosts,
				localWorkspaceRows,
			}),
		[notificationWorkspaceHosts, localWorkspaceRows],
	);
	const hostGroups = useMemo(
		() =>
			groupWorkspacesByHostUrl({
				workspaceHosts: notificationWorkspaceHosts,
				localWorkspaceRows,
				machineId,
				activeHostUrl,
				relayUrl,
			}),
		[
			notificationWorkspaceHosts,
			localWorkspaceRows,
			machineId,
			activeHostUrl,
			relayUrl,
		],
	);

	const handleElectronAgentLifecycle = useEffectEvent(
		(event: ElectronNotificationEvent) => {
			if (event.type !== NOTIFICATION_EVENTS.AGENT_LIFECYCLE) return;
			const data = event.data;
			if (!data?.workspaceId || !data.terminalId) return;
			const workspace = workspaceStatesById.get(data.workspaceId);

			// Adopted shells keep their launch-time host-service hook URL. When
			// that URL is stale, the Electron fallback still has terminal context.
			handleV2AgentLifecycleStatusEvent({
				workspaceId: data.workspaceId,
				payload: {
					eventType:
						data.eventType === "PendingQuestion"
							? "PermissionRequest"
							: data.eventType,
					terminalId: data.terminalId,
					occurredAt: Date.now(),
				},
				paneLayout: workspace?.paneLayout ?? null,
			});
		},
	);

	electronTrpc.notifications.subscribe.useSubscription(undefined, {
		onData: handleElectronAgentLifecycle,
	});

	return (
		<>
			{hostGroups.map((group) => (
				<HostNotificationSubscriber
					key={group.hostUrl}
					hostUrl={group.hostUrl}
					workspaces={group.workspaces}
				/>
			))}
		</>
	);
}

function getInFlightWorkspaceHostRows({
	entries,
	organizationId,
}: {
	entries: InFlightEntry[];
	organizationId: string | null;
}): WorkspaceHostRow[] {
	const rows: WorkspaceHostRow[] = [];

	for (const entry of entries) {
		const workspaceId = entry.cloudRow?.id ?? entry.snapshot.id;
		const resolvedOrganizationId =
			entry.cloudRow?.organizationId ?? organizationId;
		if (!workspaceId || !resolvedOrganizationId) continue;

		rows.push({
			workspaceId,
			organizationId: resolvedOrganizationId,
			hostId: entry.cloudRow?.hostId ?? entry.hostId,
			name: entry.cloudRow?.name ?? entry.snapshot.name ?? "",
			branch: entry.cloudRow?.branch ?? entry.snapshot.branch ?? "",
		});
	}

	return rows;
}

function mergeWorkspaceHostRows(
	persistedRows: WorkspaceHostRow[],
	inFlightRows: WorkspaceHostRow[],
): WorkspaceHostRow[] {
	const rowsById = new Map<string, WorkspaceHostRow>();
	for (const row of inFlightRows) {
		rowsById.set(row.workspaceId, row);
	}
	for (const row of persistedRows) {
		rowsById.set(row.workspaceId, row);
	}
	return [...rowsById.values()];
}

function getNotificationWorkspaceStatesById({
	workspaceHosts,
	localWorkspaceRows,
}: {
	workspaceHosts: WorkspaceHostRow[];
	localWorkspaceRows: Array<{
		workspaceId: string;
		paneLayout: unknown;
	}>;
}): Map<string, HostNotificationWorkspaceState> {
	const paneLayoutsByWorkspaceId = new Map(
		localWorkspaceRows.map((row) => [
			row.workspaceId,
			row.paneLayout as WorkspaceState<PaneViewerData>,
		]),
	);

	return new Map(
		workspaceHosts.map((workspace) => [
			workspace.workspaceId,
			{
				workspaceId: workspace.workspaceId,
				workspaceName:
					workspace.name.trim() || workspace.branch.trim() || "Workspace",
				paneLayout: paneLayoutsByWorkspaceId.get(workspace.workspaceId) ?? null,
			},
		]),
	);
}

function groupWorkspacesByHostUrl({
	workspaceHosts,
	localWorkspaceRows,
	machineId,
	activeHostUrl,
	relayUrl,
}: {
	workspaceHosts: WorkspaceHostRow[];
	localWorkspaceRows: Array<{
		workspaceId: string;
		paneLayout: unknown;
	}>;
	machineId: string | null;
	activeHostUrl: string | null;
	relayUrl: string;
}): HostNotificationSubscriberGroup[] {
	const paneLayoutsByWorkspaceId = new Map(
		localWorkspaceRows.map((row) => [
			row.workspaceId,
			row.paneLayout as WorkspaceState<PaneViewerData>,
		]),
	);
	const groups = new Map<string, HostNotificationWorkspaceState[]>();
	if (activeHostUrl) {
		groups.set(activeHostUrl, []);
	}

	for (const workspace of workspaceHosts) {
		const hostUrl = getHostUrlForWorkspace({
			organizationId: workspace.organizationId,
			hostId: workspace.hostId,
			machineId,
			activeHostUrl,
			relayUrl,
		});
		if (!hostUrl) continue;

		const group = groups.get(hostUrl) ?? [];
		group.push({
			workspaceId: workspace.workspaceId,
			workspaceName:
				workspace.name.trim() || workspace.branch.trim() || "Workspace",
			paneLayout: paneLayoutsByWorkspaceId.get(workspace.workspaceId) ?? null,
		});
		groups.set(hostUrl, group);
	}

	return [...groups.entries()].map(([hostUrl, workspaces]) => ({
		hostUrl,
		workspaces,
	}));
}

function getHostUrlForWorkspace({
	organizationId,
	hostId,
	machineId,
	activeHostUrl,
	relayUrl,
}: {
	organizationId: string;
	hostId: string;
	machineId: string | null;
	activeHostUrl: string | null;
	relayUrl: string;
}): string | null {
	if (machineId && hostId === machineId) {
		return activeHostUrl;
	}
	return `${relayUrl}/hosts/${buildHostRoutingKey(organizationId, hostId)}`;
}
