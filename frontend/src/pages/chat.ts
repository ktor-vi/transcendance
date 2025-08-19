export function renderChat() {
  setTimeout(() => {
    // Construction de l'URL WebSocket basée sur la location actuelle
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}/chat`;

    console.log(`[CHAT] Tentative de connexion à: ${socketUrl}`);

    const socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => {
      console.log("[CHAT] Connecté au serveur WebSocket");
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chatMessage") {
          addMessage(`${data.user}: ${data.content}`);
        }
      } catch (err) {
        console.error("[CHAT] Message invalide:", event.data, err);
      }
    });

    socket.addEventListener("close", (event) => {
      console.log(
        `[CHAT] Déconnecté du serveur (Code: ${event.code}, Raison: ${event.reason})`
      );

      // Tentative de reconnexion automatique après 3 secondes
      setTimeout(() => {
        console.log("[CHAT] Tentative de reconnexion...");
        renderChat(); // Relance la fonction pour reconnecter
      }, 3000);
    });

    socket.addEventListener("error", (err) => {
      console.error("[CHAT] Erreur WebSocket:", err);
    });

    function sendMessage() {
      const message = input.value.trim();

      if (!message) return;

      // Vérifier que la socket est ouverte avant d'envoyer
      if (socket.readyState !== WebSocket.OPEN) {
        console.warn("[CHAT] Socket fermée, impossible d'envoyer le message");
        addMessage("⚠️ Connexion fermée, reconnexion en cours...");
        return;
      }

      const payload = {
        type: "chatMessage",
        content: message,
        user: "Moi", // Optionnel, le serveur peut overrider
      };

      try {
        socket.send(JSON.stringify(payload));
        addMessage(`Moi: ${message}`);
        input.value = "";
      } catch (err) {
        console.error("[CHAT] Erreur envoi message:", err);
        addMessage("⚠️ Erreur lors de l'envoi du message");
      }
    }

    // Récupération des éléments DOM
    const input = document.getElementById("chatInput") as HTMLInputElement;
    const btn = document.getElementById("sendBtn") as HTMLButtonElement;

    if (!input || !btn) {
      console.error("[CHAT] Éléments DOM introuvables");
      return;
    }

    function addMessage(msg: string) {
      const node = document.createElement("p");
      node.textContent = msg;
      node.classList.add("text-violet-400", "py-1");

      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.appendChild(node);
        // Auto-scroll vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        console.error("[CHAT] Zone de messages introuvable");
      }
    }

    btn.addEventListener("click", sendMessage);

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }, 0);

  // HTML de base
  return `
    <div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">  
      <h1 class="text-xl font-bold mb-2">Live Chat</h1>

      <!-- Zone des messages -->
      <div id="chatMessages" class="flex-1 overflow-y-auto border rounded p-4 bg-white shadow-inner mb-4">
        <p class="text-gray-500 italic">En attente de connexion...</p>
      </div>

      <!-- Barre d'envoi -->
      <div class="flex items-center border rounded p-2 bg-white shadow">
        <input
          id="chatInput"
          type="text"
          placeholder="Écris un message..."
          class="flex-1 px-4 py-2 border rounded mr-2 focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          id="sendBtn"
          class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
        >
          Envoyer
        </button>
      </div>
    </div>
  `;
}
