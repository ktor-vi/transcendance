// dmChat.ts - VERSION CORRIGÉE
import page from "page";

export function renderDmChat(receiverId: string) {
  return `
    <div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">
      <h1 class="text-xl font-bold mb-2">DM avec ${receiverId}</h1>
      <div id="matchDiv">
        <button id="inviteMatchBtn" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
          🎮 Lancer une partie
        </button>
      </div>
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
  const dmSocketUrl = `${protocol}//${host}/dm?senderId=${encodeURIComponent(
    senderId
  )}&receiverId=${encodeURIComponent(receiverId)}`;
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
      if (data.type === "matchInvitation") {
        acceptMatch();
      }
      if (data.type === "launchMatch") {
        matchLaunch(data.content);
      }
    } catch (err) {
      console.error("[DM] Message invalide:", event.data, err);
    }
  });

  socket.addEventListener("close", (event) => {
    console.log(
      `[DM] Déconnecté (Code: ${event.code}, Raison: ${event.reason})`
    );
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

  const matchdiv = document.getElementById("matchDiv");
  const invitematch = document.getElementById("inviteMatchBtn");
  invitematch?.addEventListener("click", inviteMatch);

  function inviteMatch() {
    const invitematch = document.getElementById("inviteMatchBtn");
    const invitetext: HTMLHeadingElement = document.createElement("h2");
    invitetext.textContent =
      "Vous allez lancer une invitation à une partie, prêt ?";
    invitetext.className = "text-center";
    const accept = document.createElement("button");
    accept.className = "icons-btn";
    accept.innerHTML = `<img src="/images/ok-svgrepo-com.svg" alt="Accepter" class="w-10">`;
    const decline = document.createElement("button");
    decline.className = "icons-btn";
    decline.innerHTML = `<img src="/images/cancel-svgrepo-com.svg" alt="Refuser" class="w-10">`;
    invitematch.style.visibility = "hidden";

    matchdiv?.appendChild(invitetext);
    matchdiv?.appendChild(accept);
    matchdiv?.appendChild(decline);

    accept.addEventListener("click", () => {
      const payload = {
        type: "matchInvite",
        to: receiverId,
        content: "test",
      };
      addMessage(`J'ai lancé une invitation pour le match.`);
      socket.send(JSON.stringify(payload));
    });

    decline.addEventListener("click", () => {
      // Nettoyer l'interface
      invitetext.remove();
      accept.remove();
      decline.remove();
      invitematch.style.visibility = "visible";
    });
  }

  function acceptMatch() {
    const invitetext: HTMLHeadingElement = document.createElement("h2");
    invitetext.textContent = "Vous êtes invité à lancer une partie, prêt ?";
    invitetext.className = "text-center";
    const accept = document.createElement("button");
    accept.className = "icons-btn";
    accept.innerHTML = `<img src="/images/ok-svgrepo-com.svg" alt="Accepter" class="w-10">`;
    const decline = document.createElement("button");
    decline.className = "icons-btn";
    decline.innerHTML = `<img src="/images/cancel-svgrepo-com.svg" alt="Refuser" class="w-10">`;

    const invitematch = document.getElementById("inviteMatchBtn");
    if (invitematch) invitematch.style.visibility = "hidden";

    matchdiv?.appendChild(invitetext);
    matchdiv?.appendChild(accept);
    matchdiv?.appendChild(decline);

    accept.addEventListener("click", () => {
      const payload = {
        type: "matchConfirmation",
        to: receiverId,
        content: "test",
      };
      addMessage(`Vous êtes prêt pour le match.`);
      socket.send(JSON.stringify(payload));
    });

    decline.addEventListener("click", () => {
      // Nettoyer l'interface
      invitetext.remove();
      accept.remove();
      decline.remove();
      if (invitematch) invitematch.style.visibility = "visible";
      addMessage(`Invitation refusée.`);
    });
  }

  // ✅ CORRECTION PRINCIPALE : Stocker le roomId dans sessionStorage
  function matchLaunch(roomId: string) {
    console.log(`[DM] Lancement de partie avec roomId: ${roomId}`);

    // Stocker le roomId pour le dashboard
    sessionStorage.setItem("chatMatchRoomId", roomId);

    addMessage(`🎮 Redirection vers le dashboard pour la partie ${roomId}...`);

    // Rediriger vers le dashboard
    page("/dashboard");
  }
}
