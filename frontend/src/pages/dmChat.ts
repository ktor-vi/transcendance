/*export async function renderDmChat(receiverId: string) {
	  const me = await fetch("/api/me").then(res => res.json());
  //ENELEVR TIMEOUT ??
	  setTimeout(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    //const socketUrl = `${protocol}//${host}/dm?receiverId=${encodeURIComponent(receiverId)}`;
    const dmSocketUrl = `${protocol}//${host}/dm?senderId=${encodeURIComponent(me.id)}&receiverId=${encodeURIComponent(receiverId)}`;
    console.log(`[DM] Tentative de connexion à: ${dmSocketUrl}`);
    console.log("[DM] Sender ID:", me.username);
console.log("[DM] Receiver ID:", receiverId);
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
        renderDmChat(receiverId);
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

    const input = document.getElementById("dmInput") as HTMLInputElement;
    const btn = document.getElementById("dmSendBtn") as HTMLButtonElement;

    if (!input || !btn) {
      console.error("[DM] DOM manquant");
      return;
    }

    function addMessage(msg: string) {
      const node = document.createElement("p");
      node.textContent = msg;
      node.classList.add("text-green-600", "py-1");

      const dmMessages = document.getElementById("dmMessages");
      if (dmMessages) {
        dmMessages.appendChild(node);
        dmMessages.scrollTop = dmMessages.scrollHeight;
      }
    }

    btn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }, 0);

  // Retourne le HTML
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
}*/ 

export async function renderDmChat(receiverId: string) {
  try {
    // Récupère les infos de l'utilisateur courant
    const meRes = await fetch("/api/me");
    const me = await meRes.json();

    if (!me?.id) {
      console.error("[DM] Impossible de récupérer l'utilisateur courant !");
      return;
    }

    const senderId = me.id;
    console.log("[DM] Sender ID:", senderId);
    console.log("[DM] Receiver ID:", receiverId);

    // Génère le HTML du chat
    const chatHtml = `
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

    // Injecte le HTML dans la page (assurez-vous d'avoir un container)
    const container = document.getElementById("chatContainer");
    if (!container) {
      console.error("[DM] Container du chat introuvable !");
      return;
    }
    container.innerHTML = chatHtml;

    // Récupère les éléments du DOM
    const input = document.getElementById("dmInput") as HTMLInputElement;
    const btn = document.getElementById("dmSendBtn") as HTMLButtonElement;
    const dmMessages = document.getElementById("dmMessages");
    if (!input || !btn || !dmMessages) {
      console.error("[DM] DOM manquant !");
      return;
    }

    // URL WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const dmSocketUrl = `${protocol}//${host}/dm?senderId=${encodeURIComponent(senderId)}&receiverId=${encodeURIComponent(receiverId)}`;
    console.log("[DM] Tentative de connexion à:", dmSocketUrl);

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
        renderDmChat(receiverId);
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
      dmMessages.appendChild(node);
      dmMessages.scrollTop = dmMessages.scrollHeight;
    }

    btn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

  } catch (err) {
    console.error("[DM] Erreur renderDmChat:", err);
  }
}


