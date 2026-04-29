import { useCallback } from "react";
import { useCloseNewWorkspaceModal } from "renderer/stores/new-workspace-modal";
import { useNewWorkspaceDraftStore } from "../../stores/newWorkspaceDraft";

/**
 * Resets draft state and closes the modal. Used by both the explicit cancel
 * action and post-submit cleanup.
 */
export function useCloseAndResetDraft() {
	const closeModal = useCloseNewWorkspaceModal();
	const resetDraft = useNewWorkspaceDraftStore((s) => s.resetDraft);

	return useCallback(() => {
		resetDraft();
		closeModal();
	}, [closeModal, resetDraft]);
}
