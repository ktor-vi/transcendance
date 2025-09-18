export function renderChat() {
	setTimeout(() => {
		// Build WebSocket URL dynamically based on current location
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const host = window.location.host;
		const socketUrl = `${protocol}//${host}/chat`;

		console.log(`[CHAT] Connecting to: ${socketUrl}`);
		const socket = new WebSocket(socketUrl);

		// Socket connection opened
		socket.addEventListener("open", () => {
			console.log("[CHAT] Connected to WebSocket server");
		});

		// Receive messages from server
		socket.addEventListener("message", (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "chatMessage") {
					addMessage(`${data.user}: ${data.content}`);
				}
			} catch {
				// Ignore invalid messages
			}
		});

		// Reconnect on close
		socket.addEventListener("close", () => {
			console.log("[CHAT] Disconnected, reconnecting in 3s...");
			setTimeout(() => renderChat(), 3000);
		});

		// Send a chat message
		function sendMessage() {
			const message = input.value.trim();
			if (!message) return;
			if (socket.readyState !== WebSocket.OPEN) {
				addMessage("⚠️ Connection closed, reconnecting...");
				return;
			}
			socket.send(JSON.stringify({ type: "chatMessage", content: message, user: "lol" }));
			addMessage(`Me: ${message}`);
			input.value = "";
		}

		// DOM elements
		const input = document.getElementById("chatInput") as HTMLInputElement;
		const btn = document.getElementById("sendBtn") as HTMLButtonElement;
		if (!input || !btn) return;

		function addMessage(msg: string) {
			const node = document.createElement("p");
			node.textContent = msg;
			node.classList.add("text-violet-400", "py-1");

			const chatMessages = document.getElementById("chatMessages");
			if (chatMessages) {
				chatMessages.appendChild(node);
				chatMessages.scrollTop = chatMessages.scrollHeight; // auto-scroll
			}
		}

		btn.addEventListener("click", sendMessage);
		input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
	}, 0);

	// HTML structure for chat page
	return `
	<script>0</script>
		<div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">
			<h1 class="text-xl font-bold mb-2">Live Chat</h1>
			<div id="chatMessages" class="flex-1 overflow-y-auto border rounded p-4 bg-white shadow-inner mb-4">
				<p class="text-gray-500 italic">Waiting for connection...</p>
			</div>
			<div class="flex items-center border rounded p-2 bg-white shadow">
				<input id="chatInput" type="text" placeholder="Write a message..."
					class="flex-1 px-4 py-2 border rounded mr-2 focus:outline-none focus:ring focus:border-blue-300" />
				<button id="sendBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded">
					Send
				</button>
			</div>
		</div>
	`;
}
