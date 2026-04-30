import { setHostOnline } from "./access";
import type {
	Env,
	TunnelHttpResponse,
	TunnelRequest,
	TunnelResponse,
	TunnelWsClose,
	TunnelWsFrame,
} from "./types";

interface HostAttachment {
	type: "host";
	hostId: string;
	token: string;
	generation: number;
	stale?: boolean;
}

interface ClientAttachment {
	type: "client";
	channelId: string;
}

// Renderer-side WS for a dedicated terminal channel. Keyed by terminalId.
interface TerminalRendererAttachment {
	type: "terminal-renderer";
	terminalId: string;
}

// Host-side outbound WS for a dedicated terminal channel. Keyed by terminalId.
interface TerminalHostAttachment {
	type: "terminal-host";
	terminalId: string;
}

type Attachment =
	| HostAttachment
	| ClientAttachment
	| TerminalRendererAttachment
	| TerminalHostAttachment;

interface PendingRequest {
	resolve: (response: TunnelHttpResponse) => void;
	reject: (error: Error) => void;
	timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30_000;
const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MISSED = 3;
const TERMINAL_BUFFER_MAX_FRAMES = 256;

export class HostTunnel implements DurableObject {
	private hostWs: WebSocket | null = null;
	private hostGeneration = 0;
	private pending = new Map<string, PendingRequest>();
	private clientChannels = new Map<string, WebSocket>();
	// Dedicated terminal channels: keyed by terminalId, two WS each (one to
	// the renderer, one outbound from the host) bridged 1:1.
	private terminalRenderers = new Map<string, WebSocket>();
	private terminalHosts = new Map<string, WebSocket>();
	// Frames received from a renderer before its host counterpart connects.
	// Drained on host connect, capped to TERMINAL_BUFFER_MAX_FRAMES.
	private terminalRendererBuffers = new Map<string, (string | ArrayBuffer)[]>();
	private missedPings = 0;
	private pingTimer: ReturnType<typeof setInterval> | null = null;

	constructor(
		private readonly state: DurableObjectState,
		private readonly env: Env,
	) {
		// Re-derive in-memory state on cold start. Pending HTTP requests cannot
		// survive hibernation (they hold Promise resolvers), but persistent WS
		// connections do, and we rebuild their indexes here.
		for (const ws of this.state.getWebSockets()) {
			const att = ws.deserializeAttachment() as Attachment | undefined;
			if (!att) continue;
			if (att.type === "host" && !att.stale) {
				this.hostWs = ws;
				this.hostGeneration = Math.max(this.hostGeneration, att.generation);
			} else if (att.type === "client") {
				this.clientChannels.set(att.channelId, ws);
			} else if (att.type === "terminal-renderer") {
				this.terminalRenderers.set(att.terminalId, ws);
			} else if (att.type === "terminal-host") {
				this.terminalHosts.set(att.terminalId, ws);
			}
		}
		if (this.hostWs) this.startPingTimer();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/tunnel") {
			return this.registerHost(request, url);
		}

		// Host-side dedicated terminal callback: /terminal/<hostId>/<terminalId>
		const terminalCallback = url.pathname.match(/^\/terminal\/[^/]+\/([^/]+)$/);
		if (terminalCallback?.[1]) {
			return this.acceptTerminalHost(
				request,
				decodeURIComponent(terminalCallback[1]),
			);
		}

		const subpath = url.pathname.replace(/^\/hosts\/[^/]+/, "") || "/";

		if (request.headers.get("Upgrade") === "websocket") {
			// Renderer-side terminal upgrade: /hosts/<hostId>/terminal/<terminalId>
			const terminalRender = subpath.match(/^\/terminal\/(.+)$/);
			if (terminalRender?.[1]) {
				return this.openClientTerminal(terminalRender[1], subpath, url.search);
			}
			return this.openClientWs(subpath, url.search);
		}
		return this.proxyHttp(request, subpath + url.search);
	}

	// ── Host registration ──────────────────────────────────────────────

	private async registerHost(request: Request, url: URL): Promise<Response> {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}

		const hostId = url.searchParams.get("hostId");
		const token = extractToken(request);
		if (!hostId || !token) {
			return new Response("Missing hostId or token", { status: 400 });
		}

		// Last-write-wins: if a tunnel already exists, mark it stale and close
		// it. The stale flag lets `webSocketClose` skip cleanup of the new
		// tunnel's state when the old socket finishes closing.
		if (this.hostWs) {
			const oldAtt = this.hostWs.deserializeAttachment() as
				| HostAttachment
				| undefined;
			if (oldAtt) {
				this.hostWs.serializeAttachment({ ...oldAtt, stale: true });
			}
			try {
				this.hostWs.close(1000, "replaced");
			} catch {
				// already closed
			}
		}

		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		this.hostGeneration++;
		const attachment: HostAttachment = {
			type: "host",
			hostId,
			token,
			generation: this.hostGeneration,
		};

		this.state.acceptWebSocket(server, ["host"]);
		server.serializeAttachment(attachment);

		this.hostWs = server;
		this.missedPings = 0;
		this.startPingTimer();
		console.log(`[relay-cf] tunnel registered: ${hostId}`);

		void setHostOnline(token, hostId, true, this.env.NEXT_PUBLIC_API_URL);

		return new Response(null, {
			status: 101,
			webSocket: client,
		} as ResponseInit);
	}

	// ── Client HTTP → host ────────────────────────────────────────────

	private async proxyHttp(
		request: Request,
		pathWithQuery: string,
	): Promise<Response> {
		if (!this.hostWs) {
			// Drain the request body so the runtime doesn't error trying to flush
			// it after we've already sent the response.
			if (request.body) await request.body.cancel().catch(() => {});
			return new Response('{"error":"Host not connected"}', {
				status: 503,
				headers: { "Content-Type": "application/json" },
			});
		}

		const id = crypto.randomUUID();
		const reqHeaders: Record<string, string> = {};
		request.headers.forEach((value, key) => {
			if (key !== "host" && key !== "authorization") reqHeaders[key] = value;
		});

		const body = request.body
			? await request.text().catch(() => "")
			: undefined;

		const responsePromise = new Promise<TunnelHttpResponse>(
			(resolve, reject) => {
				const timer = setTimeout(() => {
					this.pending.delete(id);
					reject(new Error("Tunnel request timed out"));
				}, REQUEST_TIMEOUT_MS);
				this.pending.set(id, { resolve, reject, timer });
			},
		);

		this.sendToHost({
			type: "http",
			id,
			method: request.method,
			path: pathWithQuery,
			headers: reqHeaders,
			body,
		});

		try {
			const response = await responsePromise;
			return new Response(response.body ?? null, {
				status: response.status,
				headers: response.headers,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : "Proxy error",
				}),
				{ status: 502, headers: { "Content-Type": "application/json" } },
			);
		}
	}

	// ── Renderer-side WS (multiplexed) ───────────────────────────────

	private openClientWs(subpath: string, search: string): Response {
		if (!this.hostWs) {
			return new Response("Host not connected", { status: 503 });
		}

		const channelId = crypto.randomUUID();
		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		const attachment: ClientAttachment = { type: "client", channelId };
		this.state.acceptWebSocket(server, ["client"]);
		server.serializeAttachment(attachment);
		this.clientChannels.set(channelId, server);

		const query = search.startsWith("?")
			? search.slice(1)
			: search || undefined;
		this.sendToHost({
			type: "ws:open",
			id: channelId,
			path: subpath,
			query,
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		} as ResponseInit);
	}

	// ── Renderer-side WS (dedicated terminal channel) ─────────────────

	private openClientTerminal(
		terminalId: string,
		path: string,
		search: string,
	): Response {
		if (!this.hostWs) {
			return new Response("Host not connected", { status: 503 });
		}

		const hostAtt = this.hostWs.deserializeAttachment() as
			| HostAttachment
			| undefined;
		if (!hostAtt) {
			return new Response("Host attachment missing", { status: 503 });
		}

		// Reconnecting renderer for an existing terminal: close the old
		// renderer side and replace it. The old host outbound (if any) will
		// be closed when its renderer counterpart goes away.
		const existingRenderer = this.terminalRenderers.get(terminalId);
		if (existingRenderer) {
			try {
				existingRenderer.close(1000, "renderer reconnect");
			} catch {
				// already closed
			}
			this.terminalRenderers.delete(terminalId);
		}
		// Same for the host side: a stale outbound from a prior session
		// shouldn't sit around alongside a fresh renderer.
		const existingHost = this.terminalHosts.get(terminalId);
		if (existingHost) {
			try {
				existingHost.close(1000, "renderer reconnect");
			} catch {
				// already closed
			}
			this.terminalHosts.delete(terminalId);
		}
		this.terminalRendererBuffers.delete(terminalId);

		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		const attachment: TerminalRendererAttachment = {
			type: "terminal-renderer",
			terminalId,
		};
		this.state.acceptWebSocket(server, ["terminal-renderer"]);
		server.serializeAttachment(attachment);
		this.terminalRenderers.set(terminalId, server);

		const query = search.startsWith("?")
			? search.slice(1)
			: search || undefined;
		this.sendToHost({
			type: "ws:open:dedicated",
			terminalId,
			hostId: hostAtt.hostId,
			path,
			query,
			token: hostAtt.token,
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		} as ResponseInit);
	}

	// ── Host-side dedicated terminal callback ─────────────────────────

	private acceptTerminalHost(request: Request, terminalId: string): Response {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}

		const renderer = this.terminalRenderers.get(terminalId);
		if (!renderer) {
			// Renderer disconnected before host's callback arrived. Reject so
			// the host doesn't keep an orphan WS open.
			return new Response("No pending terminal channel", { status: 404 });
		}

		const existing = this.terminalHosts.get(terminalId);
		if (existing) {
			try {
				existing.close(1000, "host replaced");
			} catch {
				// already closed
			}
			this.terminalHosts.delete(terminalId);
		}

		const pair = new WebSocketPair();
		const client = pair[0];
		const server = pair[1];

		const attachment: TerminalHostAttachment = {
			type: "terminal-host",
			terminalId,
		};
		this.state.acceptWebSocket(server, ["terminal-host"]);
		server.serializeAttachment(attachment);
		this.terminalHosts.set(terminalId, server);

		// Flush any frames the renderer sent before the host connected.
		const buffered = this.terminalRendererBuffers.get(terminalId);
		if (buffered) {
			for (const frame of buffered) {
				try {
					server.send(frame);
				} catch {
					// host already closed
				}
			}
			this.terminalRendererBuffers.delete(terminalId);
		}

		return new Response(null, {
			status: 101,
			webSocket: client,
		} as ResponseInit);
	}

	// ── Hibernatable WS callbacks ──────────────────────────────────────

	async webSocketMessage(
		ws: WebSocket,
		raw: string | ArrayBuffer,
	): Promise<void> {
		const att = ws.deserializeAttachment() as Attachment | undefined;
		if (!att) return;

		if (att.type === "terminal-renderer") {
			const hostWs = this.terminalHosts.get(att.terminalId);
			if (hostWs?.readyState === WebSocket.READY_STATE_OPEN) {
				try {
					hostWs.send(raw);
				} catch {
					// host channel torn down mid-send
				}
				return;
			}
			// Host hasn't connected yet (or has dropped) — buffer up to a cap.
			let buf = this.terminalRendererBuffers.get(att.terminalId);
			if (!buf) {
				buf = [];
				this.terminalRendererBuffers.set(att.terminalId, buf);
			}
			if (buf.length < TERMINAL_BUFFER_MAX_FRAMES) buf.push(raw);
			return;
		}

		if (att.type === "terminal-host") {
			const rendererWs = this.terminalRenderers.get(att.terminalId);
			if (rendererWs?.readyState === WebSocket.READY_STATE_OPEN) {
				try {
					rendererWs.send(raw);
				} catch {
					// renderer torn down mid-send
				}
			}
			return;
		}

		const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);

		if (att.type === "host") {
			if (att.stale) return;
			let msg: TunnelResponse;
			try {
				msg = JSON.parse(text) as TunnelResponse;
			} catch {
				return;
			}
			this.handleHostMessage(msg);
			return;
		}

		// Legacy multiplex: client WS frame → forward as ws:frame.
		this.sendToHost({ type: "ws:frame", id: att.channelId, data: text });
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		_reason: string,
		_wasClean: boolean,
	): Promise<void> {
		const att = ws.deserializeAttachment() as Attachment | undefined;
		if (!att) return;

		if (att.type === "host") {
			if (att.stale) return;
			// Host disconnected: tear down everything bound to it.
			this.hostWs = null;
			this.stopPingTimer();
			for (const pending of this.pending.values()) {
				clearTimeout(pending.timer);
				pending.reject(new Error("Tunnel disconnected"));
			}
			this.pending.clear();
			for (const channel of this.clientChannels.values()) {
				try {
					channel.close(1011, "tunnel disconnected");
				} catch {
					// already closed
				}
			}
			this.clientChannels.clear();
			for (const renderer of this.terminalRenderers.values()) {
				try {
					renderer.close(1011, "tunnel disconnected");
				} catch {
					// already closed
				}
			}
			this.terminalRenderers.clear();
			for (const hostSide of this.terminalHosts.values()) {
				try {
					hostSide.close(1011, "tunnel disconnected");
				} catch {
					// already closed
				}
			}
			this.terminalHosts.clear();
			this.terminalRendererBuffers.clear();
			if (att.token && att.hostId) {
				void setHostOnline(
					att.token,
					att.hostId,
					false,
					this.env.NEXT_PUBLIC_API_URL,
				);
			}
			return;
		}

		if (att.type === "terminal-renderer") {
			if (this.terminalRenderers.get(att.terminalId) === ws) {
				this.terminalRenderers.delete(att.terminalId);
			}
			this.terminalRendererBuffers.delete(att.terminalId);
			const hostSide = this.terminalHosts.get(att.terminalId);
			if (hostSide) {
				this.terminalHosts.delete(att.terminalId);
				try {
					hostSide.close(code, "renderer closed");
				} catch {
					// already closed
				}
			}
			return;
		}

		if (att.type === "terminal-host") {
			if (this.terminalHosts.get(att.terminalId) === ws) {
				this.terminalHosts.delete(att.terminalId);
			}
			const renderer = this.terminalRenderers.get(att.terminalId);
			if (renderer) {
				this.terminalRenderers.delete(att.terminalId);
				try {
					renderer.close(code, "host closed");
				} catch {
					// already closed
				}
			}
			return;
		}

		// Legacy multiplex client channel closed: tell host.
		if (this.clientChannels.get(att.channelId) === ws) {
			this.clientChannels.delete(att.channelId);
		}
		this.sendToHost({ type: "ws:close", id: att.channelId, code });
	}

	async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
		// onclose follows onerror; rely on the close handler to clean up.
		const att = ws.deserializeAttachment() as Attachment | undefined;
		if (
			att?.type === "client" ||
			att?.type === "terminal-renderer" ||
			att?.type === "terminal-host"
		) {
			try {
				ws.close(1011, "channel error");
			} catch {
				// already closed
			}
		}
	}

	// ── Internal message dispatch ──────────────────────────────────────

	private handleHostMessage(msg: TunnelResponse): void {
		switch (msg.type) {
			case "pong":
				this.missedPings = 0;
				return;
			case "http:response":
				this.handleResponse(msg);
				return;
			case "ws:frame":
				this.handleWsFrame(msg);
				return;
			case "ws:close":
				this.handleWsCloseFromHost(msg);
				return;
		}
	}

	private handleResponse(msg: TunnelHttpResponse): void {
		const pending = this.pending.get(msg.id);
		if (!pending) return;
		clearTimeout(pending.timer);
		this.pending.delete(msg.id);
		pending.resolve(msg);
	}

	private handleWsFrame(msg: TunnelWsFrame): void {
		const channel = this.clientChannels.get(msg.id);
		if (channel?.readyState === WebSocket.READY_STATE_OPEN) {
			channel.send(msg.data);
		}
	}

	private handleWsCloseFromHost(msg: TunnelWsClose): void {
		const channel = this.clientChannels.get(msg.id);
		if (channel) {
			this.clientChannels.delete(msg.id);
			try {
				channel.close(msg.code ?? 1000);
			} catch {
				// already closed
			}
		}
	}

	private sendToHost(msg: TunnelRequest): void {
		if (this.hostWs?.readyState === WebSocket.READY_STATE_OPEN) {
			this.hostWs.send(JSON.stringify(msg));
		}
	}

	// ── Server-side ping (matches the Fly relay's behavior) ────────────

	private startPingTimer(): void {
		this.stopPingTimer();
		this.pingTimer = setInterval(() => {
			if (!this.hostWs) {
				this.stopPingTimer();
				return;
			}
			this.missedPings++;
			if (this.missedPings >= PING_TIMEOUT_MISSED) {
				try {
					this.hostWs.close(1000, "ping timeout");
				} catch {}
				return;
			}
			this.sendToHost({ type: "ping" });
		}, PING_INTERVAL_MS);
	}

	private stopPingTimer(): void {
		if (this.pingTimer) {
			clearInterval(this.pingTimer);
			this.pingTimer = null;
		}
	}
}

function extractToken(req: Request): string | null {
	const header = req.headers.get("Authorization");
	if (header?.startsWith("Bearer ")) return header.slice(7);
	const url = new URL(req.url);
	return url.searchParams.get("token");
}
