// dmChat.ts
export function renderDmChat(receiverId: string) {
  return `
    <div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">
      <h1 class="text-xl font-bold mb-2">DM avec ${receiverId}</h1>

      <div id="dmMessages" class="flex-1 overflow-y-auto border rounded p-4 bg-white shadow-inner mb-4">
        <p class="text-gray-500 italic">En attente de connexion...</p>
      </div>

      <div class="flex items-center border rounded p-2 bg-white shadow">
        <input
          id="dmInput"
          type="text"
          placeholder="Écris un message privé..."
          class="flex-1 px-4 py-2 border rounded mr-2 focus:outline-none focus:ring focus:border-green-300"
        />
        <button
          id="dmSendBtn"
          class="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded"
        >
          Envoyer
        </button>
      </div>
    </div>
  `;
}

// --- Partie front après injection du HTML ---
export function initDmChat(receiverId: string, senderId: string) {
  const dmContainer = document.getElementById("dmMessages");
  const input = document.getElementById("dmInput") as HTMLInputElement;
  const btn = document.getElementById("dmSendBtn") as HTMLButtonElement;

  if (!dmContainer || !input || !btn) {
    console.error("[DM] Container ou input/button introuvable !");
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const dmSocketUrl = `${protocol}//${host}/dm?senderId=${encodeURIComponent(senderId)}&receiverId=${encodeURIComponent(receiverId)}`;
  console.log(`[DM] Tentative de connexion à: ${dmSocketUrl}`);
  const socket = new WebSocket(dmSocketUrl);

  socket.addEventListener("open", () => {
    console.log("[DM] Connecté au serveur WebSocket (DM)");
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "dmMessage") {
        addMessage(`👤 ${data.from} → ${data.content}`);
      }
    } catch (err) {
      console.error("[DM] Message invalide:", event.data, err);
    }
  });

  socket.addEventListener("close", (event) => {
    console.log(`[DM] Déconnecté (Code: ${event.code}, Raison: ${event.reason})`);
    setTimeout(() => {
      console.log("[DM] Tentative de reconnexion...");
      initDmChat(receiverId, senderId);
    }, 3000);
  });

  socket.addEventListener("error", (err) => {
    console.error("[DM] Erreur WebSocket:", err);
  });

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    if (socket.readyState !== WebSocket.OPEN) {
      console.warn("[DM] Socket fermée, impossible d'envoyer le message");
      addMessage("⚠️ Connexion fermée, reconnexion en cours...");
      return;
    }

    const payload = {
      type: "dmMessage",
      to: receiverId,
      content: message,
    };

    try {
      socket.send(JSON.stringify(payload));
      addMessage(`Moi → ${message}`);
      input.value = "";
    } catch (err) {
      console.error("[DM] Erreur envoi:", err);
      addMessage("⚠️ Erreur lors de l'envoi");
    }
  }

  function addMessage(msg: string) {
    const node = document.createElement("p");
    node.textContent = msg;
    node.classList.add("text-green-600", "py-1");
    dmContainer.appendChild(node);
    dmContainer.scrollTop = dmContainer.scrollHeight;
  }

  btn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

