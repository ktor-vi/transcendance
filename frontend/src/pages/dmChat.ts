// dmChat.ts - Render and initialize direct messages with a single user
import page from "page";

export function renderDmChat(receiverId: string) {
	return `
		<div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">
			<h1 class="text-xl font-bold mb-2">DM with ${receiverId}</h1>
			<div id="matchDiv">
				<button id="inviteMatchBtn" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
					🎮 Start Match
				</button>
				<div id="blockDiv"></div>
			</div>
			<div id="dmMessages" class="flex-1 overflow-y-auto border rounded p-4 bg-white shadow-inner mb-4">
				<p class="text-gray-500 italic">Waiting for connection...</p>
			</div>
			<div class="flex items-center border rounded p-2 bg-white shadow">
				<input id="dmInput" type="text" placeholder="Write a private message..."
					class="flex-1 px-4 py-2 border rounded mr-2 focus:outline-none focus:ring focus:border-green-300" />
				<button id="dmSendBtn" class="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded">
					Send
				</button>
			</div>
		</div>
	`;
}

export async function initDmChat(receiverId: string, senderId: string) {
	const dmContainer = document.getElementById("dmMessages");
	const input = document.getElementById("dmInput") as HTMLInputElement;
	const btn = document.getElementById("dmSendBtn") as HTMLButtonElement;
	if (!dmContainer || !input || !btn) return;

	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const host = window.location.host;
	const dmSocketUrl = `${protocol}//${host}/dm?senderId=${encodeURIComponent(senderId)}&receiverId=${encodeURIComponent(receiverId)}`;

	console.log(`[DM] Connecting to: ${dmSocketUrl}`);
	const socket = new WebSocket(dmSocketUrl);

	socket.addEventListener("open", () => console.log("[DM] Connected to WebSocket"));
	socket.addEventListener("close", () => console.log("[DM] Disconnected"));

	// Receive DM messages or match events
	socket.addEventListener("message", (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.type === "dmMessage") addMessage(`👤 ${data.from} → ${data.content}`);
			if (data.type === "matchInvitation") acceptMatch();
			if (data.type === "launchMatch") matchLaunch(data.content);
		} catch { /* ignore invalid messages */ }
	});

	// Send DM message
	function sendMessage() {
		const message = input.value.trim();
		if (!message || socket.readyState !== WebSocket.OPEN) {
			addMessage("⚠️ Connection closed, reconnecting...");
			return;
		}
		socket.send(JSON.stringify({ type: "dmMessage", to: receiverId, content: message }));
		addMessage(`Me → ${message}`);
		input.value = "";
	}

	function addMessage(msg: string) {
		const node = document.createElement("p");
		node.textContent = msg;
		node.classList.add("text-green-600", "py-1");
		dmContainer.appendChild(node);
		dmContainer.scrollTop = dmContainer.scrollHeight;
	}

	btn.addEventListener("click", sendMessage);
	input.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

	// Match invitation logic
	const matchDiv = document.getElementById("matchDiv");
	const inviteBtn = document.getElementById("inviteMatchBtn");
	inviteBtn?.addEventListener("click", inviteMatch);

	function inviteMatch() {
		if (!matchDiv || !inviteBtn) return;
		inviteBtn.style.visibility = "hidden";

		const text = document.createElement("h2");
		text.textContent = "Do you want to send a match invitation?";
		text.className = "text-center";

		const accept = document.createElement("button");
		accept.className = "icons-btn";
		accept.innerHTML = `<img src="/images/ok-svgrepo-com.svg" alt="Accept" class="w-10">`;

		const decline = document.createElement("button");
		decline.className = "icons-btn";
		decline.innerHTML = `<img src="/images/cancel-svgrepo-com.svg" alt="Decline" class="w-10">`;

		matchDiv.appendChild(text);
		matchDiv.appendChild(accept);
		matchDiv.appendChild(decline);

		accept.addEventListener("click", () => socket.send(JSON.stringify({ type: "matchInvite", to: receiverId, content: "test" })));
		decline.addEventListener("click", () => { text.remove(); accept.remove(); decline.remove(); inviteBtn.style.visibility = "visible"; });
	}

	function acceptMatch() { /* similar logic for accepting invitation */ }

	function matchLaunch(roomId: string) {
		sessionStorage.setItem("chatMatchRoomId", roomId);
		addMessage(`🎮 Redirecting to dashboard for match ${roomId}...`);
		page("/dashboard");
	}
}
