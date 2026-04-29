import { generateFriendlyBranchName } from "@superset/shared/workspace-launch";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { WorkspaceHostTarget } from "../../components/DashboardNewWorkspaceForm/components/DevicePicker";

export type LinkedIssueDraft =
	| {
			source: "github";
			number: number;
			slug: string;
			title: string;
			body: string;
			url: string;
			state?: "open" | "closed";
	  }
	| {
			source: "internal";
			taskId: string;
			slug: string;
			title: string;
			body: string;
			url?: string;
	  };

export interface LinkedPRDraft {
	number: number;
	title: string;
	body: string;
	url: string;
	state: string;
	/** Head ref name. Needed for the composer's branch-context preamble. */
	branch: string;
}

export type HostAttachmentStatus = "uploading" | "ready" | "error";

export interface HostAttachmentDraft {
	clientId: string;
	attachmentId: string | null;
	status: HostAttachmentStatus;
	displayName: string;
	mediaType: string;
	sizeBytes: number | null;
	error: string | null;
}

export type BaseBranchSource = "local" | "remote-tracking";

export interface NewWorkspaceDraftState {
	selectedProjectId: string | null;
	hostTarget: WorkspaceHostTarget;
	prompt: string;
	baseBranch: string | null;
	baseBranchSource: BaseBranchSource | null;
	name: string;
	nameEdited: boolean;
	branchName: string;
	branchNameEdited: boolean;
	linkedIssues: LinkedIssueDraft[];
	linkedPR: LinkedPRDraft | null;
	attachments: HostAttachmentDraft[];
	agentId: string | null;
	/**
	 * Random friendly name (e.g. `curious-otter`) generated once per draft.
	 * Used as the submit fallback AND the picker preview so the user sees the
	 * same name that will be committed.
	 */
	friendlyFallback: string;
	/** Bumped on reset so consumers that need to clear (PromptInput, file pickers) can react. */
	resetKey: number;
}

interface NewWorkspaceDraftActions {
	updateDraft: (patch: Partial<NewWorkspaceDraftState>) => void;
	resetDraft: () => void;
}

export type NewWorkspaceDraftStore = NewWorkspaceDraftState &
	NewWorkspaceDraftActions;

function buildInitialState(): NewWorkspaceDraftState {
	return {
		selectedProjectId: null,
		hostTarget: { kind: "local" },
		prompt: "",
		baseBranch: null,
		baseBranchSource: null,
		name: "",
		nameEdited: false,
		branchName: "",
		branchNameEdited: false,
		linkedIssues: [],
		linkedPR: null,
		attachments: [],
		agentId: null,
		friendlyFallback: generateFriendlyBranchName(),
		resetKey: 0,
	};
}

export const useNewWorkspaceDraftStore = create<NewWorkspaceDraftStore>()(
	devtools(
		(set) => ({
			...buildInitialState(),
			updateDraft: (patch) => set(patch),
			resetDraft: () =>
				set((prev) => ({
					...buildInitialState(),
					resetKey: prev.resetKey + 1,
				})),
		}),
		{ name: "NewWorkspaceDraftStore" },
	),
);
