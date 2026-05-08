import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@superset/ui/resizable";
import { useCallback, useRef, useState } from "react";
import { GoGitPullRequest, GoIssueOpened } from "react-icons/go";
import type { ImperativePanelHandle } from "react-resizable-panels";
import type { TaskWithStatus } from "../../hooks/useTasksData";
import { CollapsedColumnRail } from "../CollapsedColumnRail";
import { GitHubIssuesContent } from "../GitHubIssuesContent";
import { PullRequestsContent } from "../PullRequestsContent";
import { ActiveIcon } from "../shared/icons/ActiveIcon";
import { TasksColumn } from "../TasksColumn";

interface AllModePanelsProps {
	projectFilter: string | null;
	searchQuery: string;
	onTaskClick: (task: TaskWithStatus) => void;
}

export function AllModePanels({
	projectFilter,
	searchQuery,
	onTaskClick,
}: AllModePanelsProps) {
	const tasksRef = useRef<ImperativePanelHandle>(null);
	const prsRef = useRef<ImperativePanelHandle>(null);
	const issuesRef = useRef<ImperativePanelHandle>(null);

	const [tasksCollapsed, setTasksCollapsed] = useState(false);
	const [prsCollapsed, setPrsCollapsed] = useState(false);
	const [issuesCollapsed, setIssuesCollapsed] = useState(false);

	const collapseTasks = useCallback(() => tasksRef.current?.collapse(), []);
	const expandTasks = useCallback(() => tasksRef.current?.expand(), []);
	const collapsePrs = useCallback(() => prsRef.current?.collapse(), []);
	const expandPrs = useCallback(() => prsRef.current?.expand(), []);
	const collapseIssues = useCallback(() => issuesRef.current?.collapse(), []);
	const expandIssues = useCallback(() => issuesRef.current?.expand(), []);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			autoSaveId="tasks-all-layout"
			className="flex-1 min-h-0"
		>
			<ResizablePanel
				ref={tasksRef}
				defaultSize={33}
				minSize={15}
				collapsible
				collapsedSize={4}
				onCollapse={() => setTasksCollapsed(true)}
				onExpand={() => setTasksCollapsed(false)}
			>
				{tasksCollapsed ? (
					<CollapsedColumnRail
						label="Tasks"
						icon={<ActiveIcon className="size-4" />}
						onExpand={expandTasks}
					/>
				) : (
					<TasksColumn
						searchQuery={searchQuery}
						onTaskClick={onTaskClick}
						onCollapse={collapseTasks}
					/>
				)}
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel
				ref={prsRef}
				defaultSize={34}
				minSize={15}
				collapsible
				collapsedSize={4}
				onCollapse={() => setPrsCollapsed(true)}
				onExpand={() => setPrsCollapsed(false)}
			>
				{prsCollapsed ? (
					<CollapsedColumnRail
						label="Pull requests"
						icon={<GoGitPullRequest className="size-4" />}
						onExpand={expandPrs}
					/>
				) : (
					<PullRequestsContent
						projectFilter={projectFilter}
						searchQuery={searchQuery}
						onCollapse={collapsePrs}
					/>
				)}
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel
				ref={issuesRef}
				defaultSize={33}
				minSize={15}
				collapsible
				collapsedSize={4}
				onCollapse={() => setIssuesCollapsed(true)}
				onExpand={() => setIssuesCollapsed(false)}
			>
				{issuesCollapsed ? (
					<CollapsedColumnRail
						label="Issues"
						icon={<GoIssueOpened className="size-4" />}
						onExpand={expandIssues}
					/>
				) : (
					<GitHubIssuesContent
						projectFilter={projectFilter}
						searchQuery={searchQuery}
						onCollapse={collapseIssues}
					/>
				)}
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
