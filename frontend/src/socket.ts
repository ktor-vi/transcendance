let socket: WebSocket;
let isConnecting = false;
let connectionId: string | null = null;

// Connect to backend WebSocket
export function connectWebSocket(onMessage: (data: any) => void, onOpenMessage?: () => any) {
	if (socket?.readyState === WebSocket.OPEN) return socket;
	if (isConnecting) return;

	socket?.close();
	isConnecting = true;
	connectionId = crypto.randomUUID();
	const hostname = import.meta.env.VITE_HOSTNAME;
	socket = new WebSocket(`wss://${hostname}:3000/ws`);

	socket.addEventListener("open", () => {
		console.log("[WSS] Connected"); // informational
		isConnecting = false;

		if (onOpenMessage) {
			const msg = onOpenMessage();
			if (msg) {
				msg.connectionId = connectionId;
				socket.send(JSON.stringify(msg));
			}
		}
	});

	socket.addEventListener("message", (event) => {
		try {
			onMessage(JSON.parse(event.data));
		} catch (err) {
			console.error("[WS] Invalid message:", err);
		}
	});

	socket.addEventListener("close", () => {
		console.warn("[WS] Disconnected");
		isConnecting = false;
		connectionId = null;
	});

	socket.addEventListener("error", (err) => {
		console.error("[WS] Error:", err);
		isConnecting = false;
		connectionId = null;
	});

	return socket;
}

// Send input move to server
export function sendMove(input: { type: "input"; left: boolean; right: boolean }) {
	if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(input));
}

// Close WebSocket connection
export function closeConnection() {
	if (socket) socket.close();
	isConnecting = false;
	connectionId = null;
}

