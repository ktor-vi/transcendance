// dmChat.ts - Render and initialize direct messages with a single user
import page from "page";
import { backButtonArrow, setupBackButton } from '../components/backButton.js';

export function renderDmChat(receiverId: string) {
	return `
<section class="flex flex-col items-center text-center">
	<div class="self-start ml-16 mt-12">
	${backButtonArrow()}
	</div>
	<img src="/images/hellokittyfuck.png" class="absolute right-12 h-32 z-10 -mt-4">
	<img src="/images/controller.png" class="absolute h-20 mt-[1%] z-10 left-[38%]">
	<button id="" class="button bg-red-400 hover:bg-red-500 mb-4 h-[2.8em] self-end -mt-[5%] mr-[5%]">
		BLOQUER
	</button>
	<div class="-mt-12">
		<button id="inviteMatchBtn" class="button bg-pink-400 hover:bg-pink-500 mb-4 mr-4 h-[2.5em] self-center">
			LANCER UNE PARTIE
		</button>
		<button id="" class="button bg-pink-400 hover:bg-pink-500 mb-4 h-[2.5em] self-center">
			VOIR LE PROFIL
		</button>
	</div>
	<div id="matchDiv" class="w-[70%] mx-auto"> 
	<h1 class="text-xl font-bold text-left mt-4">DM avec ${receiverId}</h1>
	<!-- Conteneur centré qui fait 80% de la page -->
	
	
	<!-- Bloc principal -->
	<div id="blockDiv" class="w-full h-[70vh] flex flex-col gap-4">
		
		<div id="dmMessages" class="flex-1 overflow-y-auto rounded-xl p-4 bg-white/80 shadow">
		<p>En attente de connexion...</p>
		</div>

		<div class="flex items-center rounded-xl p-2 bg-white/80 shadow">
		<input id="dmInput" type="text" placeholder="Commencer à écrire..."
			class="flex-1 px-4 py-2 rounded-xl mr-2 border-2 focus:outline-none focus:ring" />
		<button id="dmSendBtn" class="button bg-pink-400 hover:bg-pink-500">
			Envoyer
		</button>
		</div>

	</div>
	</div>
</section>

	`;
}

export async function initDmChat(receiverId: string, senderId: string) {
	setupBackButton();
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
