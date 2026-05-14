import type {
	NavigateOptions,
	UseNavigateResult,
} from "@tanstack/react-router";

export interface WorkspaceSearchParams {
	tabId?: string;
	paneId?: string;
}

export interface V2WorkspaceSearchParams {
	terminalId?: string;
	chatSessionId?: string;
	focusRequestId?: string;
	openUrl?: string;
	openUrlTarget?: "current-tab" | "new-tab";
	openUrlRequestId?: string;
}

type V2WorkspaceNavigateRest = Omit<
	NavigateOptions,
	"to" | "params" | "search"
>;

interface QueuedV2WorkspaceNavigation {
	workspaceId: string;
	navigate: UseNavigateResult<string>;
	rest: V2WorkspaceNavigateRest;
	resolve: () => void;
	reject: (error: unknown) => void;
}

let queuedV2WorkspaceNavigation: QueuedV2WorkspaceNavigation | null = null;
let v2WorkspaceNavigationTimer: ReturnType<typeof setTimeout> | null = null;
let v2WorkspaceNavigationInFlight = false;
const WORKSPACE_SWITCH_COALESCE_MS = 25;

function getCurrentV2WorkspaceId(): string | null {
	if (typeof window === "undefined") return null;
	const match = window.location.hash.match(/^#\/v2-workspace\/([^/?#]+)/);
	if (!match?.[1]) return null;
	return decodeURIComponent(match[1]);
}

function hasSearchParams(search: V2WorkspaceSearchParams | undefined): boolean {
	return search != null && Object.values(search).some((value) => value != null);
}

function performV2WorkspaceNavigation(
	workspaceId: string,
	navigate: UseNavigateResult<string>,
	rest: V2WorkspaceNavigateRest,
	search: V2WorkspaceSearchParams = {},
): Promise<void> {
	const shouldReplaceWorkspaceSwitch =
		rest.replace == null &&
		typeof window !== "undefined" &&
		window.location.hash.startsWith("#/v2-workspace/");

	return navigate({
		to: "/v2-workspace/$workspaceId",
		params: { workspaceId },
		search,
		...rest,
		replace: shouldReplaceWorkspaceSwitch ? true : rest.replace,
	});
}

function scheduleV2WorkspaceNavigationDrain() {
	if (v2WorkspaceNavigationInFlight) {
		return;
	}

	if (v2WorkspaceNavigationTimer) {
		clearTimeout(v2WorkspaceNavigationTimer);
	}
	v2WorkspaceNavigationTimer = setTimeout(() => {
		void drainQueuedV2WorkspaceNavigation();
	}, WORKSPACE_SWITCH_COALESCE_MS);
}

async function drainQueuedV2WorkspaceNavigation() {
	v2WorkspaceNavigationTimer = null;
	const next = queuedV2WorkspaceNavigation;
	queuedV2WorkspaceNavigation = null;
	if (!next) return;

	v2WorkspaceNavigationInFlight = true;
	try {
		if (getCurrentV2WorkspaceId() !== next.workspaceId) {
			await performV2WorkspaceNavigation(
				next.workspaceId,
				next.navigate,
				next.rest,
			);
		}
		next.resolve();
	} catch (error) {
		next.reject(error);
	} finally {
		v2WorkspaceNavigationInFlight = false;
		if (queuedV2WorkspaceNavigation) {
			scheduleV2WorkspaceNavigationDrain();
		}
	}
}

function enqueueV2WorkspaceNavigation(
	workspaceId: string,
	navigate: UseNavigateResult<string>,
	rest: V2WorkspaceNavigateRest,
): Promise<void> {
	queuedV2WorkspaceNavigation?.resolve();
	return new Promise<void>((resolve, reject) => {
		queuedV2WorkspaceNavigation = {
			workspaceId,
			navigate,
			rest,
			resolve,
			reject,
		};
		scheduleV2WorkspaceNavigationDrain();
	});
}

/**
 * Navigate to a workspace and update localStorage to remember it as the last viewed workspace.
 * This ensures the workspace will be restored when the app is reopened.
 *
 * @param workspaceId - The ID of the workspace to navigate to
 * @param navigate - The navigate function from useNavigate()
 * @param options - Optional navigation options (replace, resetScroll, etc.)
 */
export function navigateToWorkspace(
	workspaceId: string,
	navigate: UseNavigateResult<string>,
	options?: Omit<NavigateOptions, "to" | "params"> & {
		search?: WorkspaceSearchParams;
	},
): Promise<void> {
	const { search, ...rest } = options ?? {};
	localStorage.setItem("lastViewedWorkspaceId", workspaceId);
	return navigate({
		to: "/workspace/$workspaceId",
		params: { workspaceId },
		search: search ?? {},
		...rest,
	});
}

/**
 * Navigate to a V2 workspace route.
 */
export function navigateToV2Workspace(
	workspaceId: string,
	navigate: UseNavigateResult<string>,
	options?: Omit<NavigateOptions, "to" | "params" | "search"> & {
		search?: V2WorkspaceSearchParams;
	},
): Promise<void> {
	const { search, ...rest } = options ?? {};
	if (!hasSearchParams(search) && getCurrentV2WorkspaceId() === workspaceId) {
		return Promise.resolve();
	}

	if (!hasSearchParams(search)) {
		return enqueueV2WorkspaceNavigation(workspaceId, navigate, rest);
	}

	return performV2WorkspaceNavigation(workspaceId, navigate, rest, search);
}
