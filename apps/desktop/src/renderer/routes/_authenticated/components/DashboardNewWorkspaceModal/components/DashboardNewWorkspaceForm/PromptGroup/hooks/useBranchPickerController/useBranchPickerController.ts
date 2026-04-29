import { toast } from "@superset/ui/sonner";
import { useLiveQuery } from "@tanstack/react-db";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import type { BaseBranchSource } from "../../../../../stores/newWorkspaceDraft";
import type { WorkspaceHostTarget } from "../../../components/DevicePicker";
import {
	type BranchFilter,
	useBranchContext,
} from "../../../hooks/useBranchContext";
import type { CompareBaseBranchPicker } from "../../components/CompareBaseBranchPicker";
import type {
	SubmitAttachment,
	SubmitIntent,
} from "../useSubmitWorkspace/useSubmitWorkspace";

type PickerProps = React.ComponentProps<typeof CompareBaseBranchPicker>;

export interface UseBranchPickerControllerArgs {
	projectId: string | null;
	hostTarget: WorkspaceHostTarget;
	baseBranch: string | null;
	/** When set, used as the workspace name for picker actions; falls back to the branch name. */
	typedWorkspaceName: string;
	onBaseBranchChange: (
		branch: string | null,
		source: BaseBranchSource | null,
	) => void;
	closeModal: () => void;
	submit: (intent: SubmitIntent, files?: SubmitAttachment[]) => Promise<void>;
}

/**
 * Owns branch search/filter state, the branch-context query, and per-row
 * actions. Open existing workspaces directly; checkout / adopt go through
 * the unified `submit` so they share dispatch and AI-rename gating with
 * the modal's main Submit button.
 */
export function useBranchPickerController(args: UseBranchPickerControllerArgs) {
	const {
		projectId,
		hostTarget,
		baseBranch,
		onBaseBranchChange,
		closeModal,
		submit,
	} = args;

	const navigate = useNavigate();
	const collections = useCollections();
	const { machineId } = useLocalHostService();

	const [branchSearch, setBranchSearch] = useState("");
	const [branchFilter, setBranchFilter] = useState<BranchFilter>("branch");

	const {
		branches,
		defaultBranch,
		isLoading: isBranchesLoading,
		isError: isBranchesError,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	} = useBranchContext(projectId, hostTarget, branchSearch, branchFilter);

	const effectiveCompareBaseBranch = baseBranch || defaultBranch || null;

	const { data: projectWorkspaces } = useLiveQuery(
		(q) => q.from({ workspaces: collections.v2Workspaces }),
		[collections],
	);
	const { data: allHosts } = useLiveQuery(
		(q) => q.from({ hosts: collections.v2Hosts }),
		[collections],
	);

	const targetHostId = useMemo<string | null>(() => {
		if (hostTarget.kind === "host") return hostTarget.hostId;
		if (!machineId || !allHosts) return null;
		return allHosts.find((h) => h.machineId === machineId)?.id ?? null;
	}, [hostTarget, allHosts, machineId]);

	const workspaceByBranch = useMemo(() => {
		const map = new Map<string, string>();
		if (!projectId || !projectWorkspaces || !targetHostId) return map;
		for (const w of projectWorkspaces) {
			if (w.projectId === projectId && w.hostId === targetHostId && w.branch) {
				map.set(w.branch, w.id);
			}
		}
		return map;
	}, [projectId, projectWorkspaces, targetHostId]);

	const hasWorkspaceForBranch = useCallback(
		(name: string) => workspaceByBranch.has(name),
		[workspaceByBranch],
	);

	const onAdoptWorktree = useCallback(
		(branchName: string) => {
			void submit({ kind: "adopt", branchName });
		},
		[submit],
	);

	const onCheckoutBranch = useCallback(
		(branchName: string) => {
			void submit({ kind: "checkout", branchName });
		},
		[submit],
	);

	const onOpenExisting = useCallback(
		(branchName: string) => {
			const workspaceId = workspaceByBranch.get(branchName);
			if (!workspaceId) {
				toast.error("Could not find existing workspace for this branch");
				return;
			}
			closeModal();
			void navigate({
				to: "/v2-workspace/$workspaceId",
				params: { workspaceId },
			});
		},
		[workspaceByBranch, closeModal, navigate],
	);

	const onSelectCompareBaseBranch = useCallback(
		(branch: string, source: BaseBranchSource) => {
			onBaseBranchChange(branch, source);
		},
		[onBaseBranchChange],
	);

	const onLoadMore = useCallback(() => {
		void fetchNextPage();
	}, [fetchNextPage]);

	const pickerProps: PickerProps = {
		effectiveCompareBaseBranch,
		defaultBranch,
		isBranchesLoading,
		isBranchesError,
		branches,
		branchSearch,
		onBranchSearchChange: setBranchSearch,
		branchFilter,
		onBranchFilterChange: setBranchFilter,
		isFetchingNextPage,
		hasNextPage: hasNextPage ?? false,
		onLoadMore,
		onSelectCompareBaseBranch,
		onCheckoutBranch,
		onOpenExisting,
		onAdoptWorktree,
		hasWorkspaceForBranch,
	};

	return { pickerProps };
}
