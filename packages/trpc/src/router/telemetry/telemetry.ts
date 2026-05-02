import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { posthog } from "../../lib/analytics";
import { jwtProcedure } from "../../trpc";

// Allowlist of event names callable by SDK consumers. Server prefixes all
// captures with `sdk_` so this endpoint can never be used to forge events
// from other surfaces.
const ALLOWED_SDK_EVENTS = ["method_called", "session_started"] as const;

export const telemetryRouter = {
	captureSdk: jwtProcedure
		.input(
			z.object({
				event: z.enum(ALLOWED_SDK_EVENTS),
				properties: z
					.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
					.optional(),
			}),
		)
		.mutation(({ ctx, input }) => {
			posthog.capture({
				distinctId: ctx.userId,
				event: `sdk_${input.event}`,
				properties: input.properties ?? {},
			});
			return { ok: true as const };
		}),
} satisfies TRPCRouterRecord;
