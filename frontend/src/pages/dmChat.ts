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


// dmChat.ts - Code frontend corrigé
/*
// Fonction pour établir la connexion DM
function connectToDM(receiverUserId) {
    console.log("[DM] Tentative de connexion DM avec utilisateur ID:", receiverUserId);

    // ✅ CORRECTION 1: Utiliser le bon port (3000 au lieu de 5173)
    // ✅ CORRECTION 2: Utiliser l'ID numérique, pas le nom d'utilisateur
    const wsUrl = `wss://mi-r4-p4.s19.be:3000/dm?receiverId=${receiverUserId}`;

    console.log("[DM] URL de connexion:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("[DM] ✅ Connecté au serveur WebSocket (DM)");
    };

    ws.onmessage = (event) => {
        console.log("[DM] Message reçu:", event.data);
        const data = JSON.parse(event.data);

        switch(data.type) {
            case "dmConnected":
                console.log("[DM] ✅ Connexion DM établie:", data);
                // Afficher l'interface de chat
                showDMInterface(data);
                break;

            case "dmMessage":
                console.log("[DM] 💬 Nouveau message reçu:", data);
                // Afficher le message reçu
                displayReceivedMessage(data);
                break;

            case "dmSent":
                console.log("[DM] ✅ Message envoyé confirmé:", data);
                // Afficher le message envoyé dans l'interface
                displaySentMessage(data);
                break;

            case "error":
                console.error("[DM] ❌ Erreur:", data.message);
                alert(`Erreur DM: ${data.message}`);
                break;
        }
    };

    ws.onclose = (event) => {
        console.log(`[DM] Connexion fermée: ${event.code} ${event.reason}`);
    };

    ws.onerror = (error) => {
        console.error("[DM] Erreur WebSocket:", error);
    };

    return ws;
}

// Fonction pour envoyer un message DM
function sendDMMessage(ws, content, receiverUserId) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: "dmMessage",
            content: content,
            // Note: le receiverId est déjà connu par le serveur via l'URL de connexion
        };

        console.log("[DM] Envoi du message:", message);
        ws.send(JSON.stringify(message));
    } else {
        console.error("[DM] WebSocket n'est pas connectée");
        alert("Connexion fermée. Veuillez recharger la page.");
    }
}

// Fonction pour afficher l'interface DM
function showDMInterface(connectionData) {
    const dmContainer = document.querySelector('#dm-container');
    if (dmContainer) {
        dmContainer.innerHTML = `
            <div class="dm-header">
                <h3>DM avec utilisateur ${connectionData.receiverId}</h3>
                <p>Conversation ID: ${connectionData.conversationId || 'En attente...'}</p>
            </div>
            <div class="dm-messages" id="dm-messages"></div>
            <div class="dm-input">
                <input type="text" id="dm-message-input" placeholder="Tapez votre message...">
                <button id="dm-send-btn">Envoyer</button>
            </div>
        `;

        // Ajouter l'événement d'envoi
        const sendBtn = document.querySelector('#dm-send-btn');
        const messageInput = document.querySelector('#dm-message-input');

        sendBtn.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                sendDMMessage(currentDMSocket, message, connectionData.receiverId);
                messageInput.value = '';
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
}

// Fonction pour afficher un message reçu
function displayReceivedMessage(messageData) {
    const messagesContainer = document.querySelector('#dm-messages');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dm-message received';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">De: ${messageData.from}</span>
                <span class="timestamp">${new Date(messageData.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${messageData.content}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Fonction pour afficher un message envoyé
function displaySentMessage(messageData) {
    const messagesContainer = document.querySelector('#dm-messages');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dm-message sent';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">Moi</span>
                <span class="timestamp">${new Date(messageData.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${messageData.content}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Variable globale pour la connexion DM courante
let currentDMSocket = null;

// Fonction pour ouvrir une conversation DM
function openDMConversation(receiverUserId) {
    console.log("[DM] Ouverture de la conversation avec l'utilisateur ID:", receiverUserId);

    // Fermer la connexion précédente si elle existe
    if (currentDMSocket) {
        currentDMSocket.close();
    }

    // Établir nouvelle connexion avec l'ID utilisateur correct
    currentDMSocket = connectToDM(receiverUserId);
}

// ✅ CORRECTION IMPORTANTE: Comment obtenir l'ID utilisateur au lieu du nom
// Dans votre code existant, au lieu de passer 'lili' ou 'lala', vous devez passer les IDs:

// Exemple d'utilisation corrigée:
// openDMConversation(6); // ID de lili
// openDMConversation(5); // ID de lala

export { connectToDM, sendDMMessage, openDMConversation };*/
