import { Spinner } from "@superset/ui/spinner";
import type { ReactNode } from "react";

interface ImportPageShellProps {
	title: string;
	description?: string;
	isLoading?: boolean;
	emptyMessage?: string;
	itemCount: number;
	children: ReactNode;
}

export function ImportPageShell({
	title,
	description,
	isLoading,
	emptyMessage,
	itemCount,
	children,
}: ImportPageShellProps) {
	return (
		<div className="flex h-[454px] flex-col bg-background">
			<div className="border-b px-8 py-5">
				<div className="text-lg font-semibold text-foreground">{title}</div>
				{description && (
					<p className="mt-1 text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
				{isLoading ? (
					<div className="flex flex-1 items-center justify-center">
						<Spinner className="size-5" />
					</div>
				) : itemCount === 0 ? (
					<div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
						{emptyMessage ?? "Nothing to import."}
					</div>
				) : (
					children
				)}
			</div>
		</div>
	);
}
