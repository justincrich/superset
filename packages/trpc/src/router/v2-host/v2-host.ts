import { db } from "@superset/db/client";
import { v2UsersHostRoleValues } from "@superset/db/enums";
import { members, v2Hosts, v2UsersHosts } from "@superset/db/schema";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { requireActiveOrgId } from "../utils/active-org";

async function requireHostOwner(
	userId: string,
	hostId: string,
	organizationId: string,
) {
	const host = await db.query.v2Hosts.findFirst({
		where: and(
			eq(v2Hosts.id, hostId),
			eq(v2Hosts.organizationId, organizationId),
		),
		columns: { id: true, organizationId: true },
	});

	if (!host) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Host not found in this organization",
		});
	}

	const access = await db.query.v2UsersHosts.findFirst({
		where: and(
			eq(v2UsersHosts.hostId, hostId),
			eq(v2UsersHosts.userId, userId),
		),
		columns: { role: true },
	});

	if (!access || access.role !== "owner") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only host owners can change membership",
		});
	}

	return host;
}

async function requireOrgMember(userId: string, organizationId: string) {
	const member = await db.query.members.findFirst({
		where: and(
			eq(members.userId, userId),
			eq(members.organizationId, organizationId),
		),
		columns: { id: true },
	});

	if (!member) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "User is not a member of this organization",
		});
	}
}

async function countOwners(hostId: string) {
	const owners = await db
		.select({ id: v2UsersHosts.id })
		.from(v2UsersHosts)
		.where(
			and(eq(v2UsersHosts.hostId, hostId), eq(v2UsersHosts.role, "owner")),
		);
	return owners.length;
}

export const v2HostRouter = {
	addMember: protectedProcedure
		.input(
			z.object({
				hostId: z.string().uuid(),
				userId: z.string().uuid(),
				role: z.enum(v2UsersHostRoleValues).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = requireActiveOrgId(ctx);
			await requireHostOwner(ctx.session.user.id, input.hostId, organizationId);
			await requireOrgMember(input.userId, organizationId);

			await db
				.insert(v2UsersHosts)
				.values({
					organizationId,
					userId: input.userId,
					hostId: input.hostId,
					role: input.role ?? "member",
				})
				.onConflictDoNothing({
					target: [
						v2UsersHosts.organizationId,
						v2UsersHosts.userId,
						v2UsersHosts.hostId,
					],
				});

			return { success: true };
		}),

	removeMember: protectedProcedure
		.input(
			z.object({
				hostId: z.string().uuid(),
				userId: z.string().uuid(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = requireActiveOrgId(ctx);
			await requireHostOwner(ctx.session.user.id, input.hostId, organizationId);

			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You can't remove yourself from a host you own.",
				});
			}

			const target = await db.query.v2UsersHosts.findFirst({
				where: and(
					eq(v2UsersHosts.hostId, input.hostId),
					eq(v2UsersHosts.userId, input.userId),
				),
				columns: { role: true },
			});

			if (!target) {
				return { success: true };
			}

			if (target.role === "owner") {
				const ownerCount = await countOwners(input.hostId);
				if (ownerCount <= 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A host must have at least one owner.",
					});
				}
			}

			await db
				.delete(v2UsersHosts)
				.where(
					and(
						eq(v2UsersHosts.hostId, input.hostId),
						eq(v2UsersHosts.userId, input.userId),
					),
				);

			return { success: true };
		}),

	setMemberRole: protectedProcedure
		.input(
			z.object({
				hostId: z.string().uuid(),
				userId: z.string().uuid(),
				role: z.enum(v2UsersHostRoleValues),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const organizationId = requireActiveOrgId(ctx);
			await requireHostOwner(ctx.session.user.id, input.hostId, organizationId);

			if (input.role === "member" && input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You can't demote yourself.",
				});
			}

			if (input.role === "member") {
				const ownerCount = await db
					.select({ id: v2UsersHosts.id })
					.from(v2UsersHosts)
					.where(
						and(
							eq(v2UsersHosts.hostId, input.hostId),
							eq(v2UsersHosts.role, "owner"),
							ne(v2UsersHosts.userId, input.userId),
						),
					);
				if (ownerCount.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A host must have at least one owner.",
					});
				}
			}

			await db
				.update(v2UsersHosts)
				.set({ role: input.role })
				.where(
					and(
						eq(v2UsersHosts.hostId, input.hostId),
						eq(v2UsersHosts.userId, input.userId),
					),
				);

			return { success: true };
		}),
} satisfies TRPCRouterRecord;
