import { Button } from "@superset/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@superset/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@superset/ui/select";
import { toast } from "@superset/ui/sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@superset/ui/table";
import { cn } from "@superset/ui/utils";
import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useMemo, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { apiTrpcClient } from "renderer/lib/api-trpc-client";
import { authClient } from "renderer/lib/auth-client";
import { useCollections } from "renderer/routes/_authenticated/providers/CollectionsProvider";

interface HostSettingsProps {
	hostId: string;
}

interface MemberRow {
	usersHostsId: string;
	userId: string;
	role: "owner" | "member";
	name: string;
	email: string;
}

interface CandidateRow {
	userId: string;
	name: string;
	email: string;
}

export function HostSettings({ hostId }: HostSettingsProps) {
	const collections = useCollections();
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user?.id ?? null;
	const [busy, setBusy] = useState(false);

	const { data: hostRows = [] } = useLiveQuery(
		(q) =>
			q
				.from({ hosts: collections.v2Hosts })
				.where(({ hosts }) => eq(hosts.id, hostId))
				.select(({ hosts }) => ({ ...hosts })),
		[collections, hostId],
	);
	const host = hostRows[0];

	const { data: hostUserRows = [] } = useLiveQuery(
		(q) =>
			q
				.from({ uh: collections.v2UsersHosts })
				.where(({ uh }) => eq(uh.hostId, hostId))
				.select(({ uh }) => ({ ...uh })),
		[collections, hostId],
	);

	const { data: orgUsers = [] } = useLiveQuery(
		(q) =>
			q.from({ users: collections.users }).select(({ users }) => ({
				id: users.id,
				name: users.name,
				email: users.email,
			})),
		[collections],
	);

	const { data: orgMembers = [] } = useLiveQuery(
		(q) =>
			q
				.from({ m: collections.members })
				.where(({ m }) => eq(m.organizationId, host?.organizationId ?? ""))
				.select(({ m }) => ({ userId: m.userId })),
		[collections, host?.organizationId],
	);

	const userMap = useMemo(() => {
		const map = new Map<string, { name: string; email: string }>();
		for (const u of orgUsers) {
			map.set(u.id, { name: u.name, email: u.email });
		}
		return map;
	}, [orgUsers]);

	const members: MemberRow[] = useMemo(() => {
		return hostUserRows
			.map((row) => {
				const u = userMap.get(row.userId);
				return {
					usersHostsId: row.id,
					userId: row.userId,
					role: row.role as "owner" | "member",
					name: u?.name ?? "Unknown user",
					email: u?.email ?? "",
				};
			})
			.sort((a, b) => {
				if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
				return a.name.localeCompare(b.name);
			});
	}, [hostUserRows, userMap]);

	const candidates: CandidateRow[] = useMemo(() => {
		const onHost = new Set(hostUserRows.map((r) => r.userId));
		return orgMembers
			.filter((m) => !onHost.has(m.userId))
			.map((m) => {
				const u = userMap.get(m.userId);
				return {
					userId: m.userId,
					name: u?.name ?? "Unknown user",
					email: u?.email ?? "",
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [orgMembers, hostUserRows, userMap]);

	const currentUserRole = useMemo(() => {
		if (!currentUserId) return null;
		return hostUserRows.find((r) => r.userId === currentUserId)?.role ?? null;
	}, [hostUserRows, currentUserId]);
	const isOwner = currentUserRole === "owner";

	if (!host) {
		return (
			<div className="p-6 text-sm text-muted-foreground">
				Host not found in this organization.
			</div>
		);
	}

	const handleAddMember = async (userId: string) => {
		setBusy(true);
		try {
			await apiTrpcClient.v2Host.addMember.mutate({ hostId, userId });
			toast.success("Member added");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to add member");
		} finally {
			setBusy(false);
		}
	};

	const handleRemoveMember = async (userId: string) => {
		setBusy(true);
		try {
			await apiTrpcClient.v2Host.removeMember.mutate({ hostId, userId });
			toast.success("Member removed");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to remove member",
			);
		} finally {
			setBusy(false);
		}
	};

	const handleSetRole = async (userId: string, role: "owner" | "member") => {
		setBusy(true);
		try {
			await apiTrpcClient.v2Host.setMemberRole.mutate({ hostId, userId, role });
			toast.success("Role updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to update role");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="p-6 max-w-4xl w-full select-text">
			<div className="mb-8">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"h-2 w-2 rounded-full",
							host.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40",
						)}
					/>
					<h2 className="text-xl font-semibold">{host.name}</h2>
				</div>
				<p className="text-sm text-muted-foreground mt-1">
					{host.isOnline ? "Online" : "Offline"} · machine ID{" "}
					<code className="text-xs">{host.machineId}</code>
				</p>
			</div>

			<section className="space-y-3">
				<div className="flex items-end justify-between">
					<div>
						<h3 className="text-base font-medium">Members</h3>
						<p className="text-sm text-muted-foreground">
							People in your organization who can use this host.
						</p>
					</div>
					{isOwner && (
						<AddMemberDropdown
							candidates={candidates}
							disabled={busy}
							onPick={handleAddMember}
						/>
					)}
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead className="w-32">Role</TableHead>
								{isOwner && <TableHead className="w-12" />}
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.map((m) => {
								const isSelf = m.userId === currentUserId;
								return (
									<TableRow key={m.usersHostsId}>
										<TableCell className="font-medium">{m.name}</TableCell>
										<TableCell className="text-muted-foreground">
											{m.email}
										</TableCell>
										<TableCell>
											{isOwner ? (
												<Select
													value={m.role}
													onValueChange={(value) =>
														handleSetRole(m.userId, value as "owner" | "member")
													}
													disabled={busy || isSelf}
												>
													<SelectTrigger className="h-8">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="owner">Owner</SelectItem>
														<SelectItem value="member">Member</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<span className="text-sm capitalize">{m.role}</span>
											)}
										</TableCell>
										{isOwner && (
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													disabled={busy || isSelf}
													onClick={() => handleRemoveMember(m.userId)}
													aria-label={`Remove ${m.name}`}
												>
													<HiOutlineTrash className="h-4 w-4" />
												</Button>
											</TableCell>
										)}
									</TableRow>
								);
							})}
							{members.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={isOwner ? 4 : 3}
										className="text-center text-sm text-muted-foreground py-6"
									>
										No members yet.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				{!isOwner && (
					<p className="text-xs text-muted-foreground">
						Only owners of this host can change membership.
					</p>
				)}
			</section>
		</div>
	);
}

function AddMemberDropdown({
	candidates,
	disabled,
	onPick,
}: {
	candidates: CandidateRow[];
	disabled: boolean;
	onPick: (userId: string) => void;
}) {
	if (candidates.length === 0) {
		return (
			<Button size="sm" variant="outline" disabled>
				<HiOutlinePlus className="h-4 w-4 mr-1" />
				Add member
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="sm" variant="outline" disabled={disabled}>
					<HiOutlinePlus className="h-4 w-4 mr-1" />
					Add member
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				{candidates.map((c) => (
					<DropdownMenuItem key={c.userId} onSelect={() => onPick(c.userId)}>
						<div className="flex flex-col">
							<span className="text-sm">{c.name}</span>
							<span className="text-xs text-muted-foreground">{c.email}</span>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
