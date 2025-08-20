let socket: WebSocket;
let isConnecting = false;
let connectionId: string | null = null;
let gameInstance = null;

export function connectWebSocket(
  onMessage: (data: any) => void,
  onOpenMessage?: () => any
) {
  // Éviter les connexions multiples
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.warn("[WS] Connexion déjà active");
    return socket;
  }

  if (isConnecting) {
    console.warn("[WS] Connexion déjà en cours");
    return;
  }

  // Fermer l'ancienne connexion si elle existe
  if (socket) {
    socket.close();
  }

  isConnecting = true;
  connectionId = crypto.randomUUID();
  const hostname = import.meta.env.VITE_HOSTNAME;
  socket = new WebSocket(`wss://${hostname}:3000/ws`);

  socket.addEventListener("open", () => {
    console.log("[WSS] Connecté");
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
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("[WS] Message invalide :", err);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("[WS] Déconnecté");
    isConnecting = false;
    connectionId = null;
  });

  socket.addEventListener("error", (err) => {
    console.error("[WS] Erreur :", err);
    isConnecting = false;
    connectionId = null;
  });

  return socket;
}

export function sendMove(input: {
  type: "input";
  left: boolean;
  right: boolean;
}) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(input));
  }
}

export function closeConnection() {
  if (socket) {
    socket.close();
    isConnecting = false;
    connectionId = null;
  }
}
