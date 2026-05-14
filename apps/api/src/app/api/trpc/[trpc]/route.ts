import { appRouter } from "@superset/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@/trpc/context";

export const maxDuration = 60;

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext,
		onError: ({ path, error }) => {
			// NOT_FOUND is expected from old desktop clients calling removed
			// procedures (e.g. device.heartbeat removed in #4490). Those clients
			// are gated behind UpdateRequiredPage and their calls have no
			// downstream consumer — suppress to avoid false-positive error noise.
			if (error.code === "NOT_FOUND") return;
			console.error(`❌ tRPC error on ${path ?? "<no-path>"}:`, error);
		},
	});

export { handler as GET, handler as POST };
