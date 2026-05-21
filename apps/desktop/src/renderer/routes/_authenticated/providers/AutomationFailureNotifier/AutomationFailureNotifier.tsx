import { useLiveQuery } from "@tanstack/react-db";
import { useEffect, useRef } from "react";
import { electronTrpcClient } from "renderer/lib/trpc-client";
import { useCollections } from "../CollectionsProvider";

export function AutomationFailureNotifier() {
	const collections = useCollections();
	const notifiedRunIdsRef = useRef<Set<string>>(new Set());

	// Watch for automation run failures
	const { data: automationRuns = [] } = useLiveQuery(
		(q) =>
			q
				.from({ automationRuns: collections.automationRuns })
				.select(({ automationRuns: ar }) => ({
					id: ar.id,
					title: ar.title,
					status: ar.status,
					error: ar.error,
				})),
		[collections],
	);

	useEffect(() => {
		if (!automationRuns || automationRuns.length === 0) {
			return;
		}

		for (const run of automationRuns) {
			// Check if this is a failure status
			if (
				(run.status === "dispatch_failed" ||
					run.status === "skipped_offline") &&
				!notifiedRunIdsRef.current.has(run.id)
			) {
				// Mark as notified
				notifiedRunIdsRef.current.add(run.id);

				// Fire notification
				void electronTrpcClient.notifications.showNative.mutate({
					title: "Automation failed",
					body: run.error || "Run failed",
				});
			}
		}
	}, [automationRuns]);

	// This component is a pure observer - it renders nothing
	return null;
}
