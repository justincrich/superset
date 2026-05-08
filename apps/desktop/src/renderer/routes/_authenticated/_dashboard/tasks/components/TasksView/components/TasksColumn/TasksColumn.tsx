import { Button } from "@superset/ui/button";
import { LuMinus } from "react-icons/lu";
import type { TaskWithStatus } from "../../hooks/useTasksData";
import { useTasksData } from "../../hooks/useTasksData";
import { ActiveIcon } from "../shared/icons/ActiveIcon";
import { TableContent } from "../TableContent";

interface TasksColumnProps {
	searchQuery: string;
	onTaskClick: (task: TaskWithStatus) => void;
	onCollapse?: () => void;
}

export function TasksColumn({
	searchQuery,
	onTaskClick,
	onCollapse,
}: TasksColumnProps) {
	const { data: tasks } = useTasksData({
		filterTab: "all",
		searchQuery,
		assigneeFilter: null,
	});
	const count = tasks.length;

	return (
		<div className="@container flex flex-col h-full overflow-hidden">
			<div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
				<ActiveIcon className="size-3.5 text-muted-foreground" />
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Tasks
				</span>
				<span className="ml-auto text-xs text-muted-foreground tabular-nums">
					{count}
				</span>
				{onCollapse && (
					<Button
						variant="ghost"
						size="icon-xs"
						title="Minimize"
						onClick={onCollapse}
					>
						<LuMinus className="size-3.5" />
					</Button>
				)}
			</div>
			<div className="flex-1 min-h-0 flex flex-col">
				<TableContent
					filterTab="all"
					searchQuery={searchQuery}
					assigneeFilter={null}
					onTaskClick={onTaskClick}
				/>
			</div>
		</div>
	);
}
