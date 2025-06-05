let socket: WebSocket;

export function connectWebSocket(
  onMessage: (data: any) => void,
  onOpenMessage?: () => any
) {
  socket = new WebSocket(`ws://${location.hostname}:3000/ws`);

  socket.addEventListener('open', () => {
    console.log('[WS] Connecté');
    if (onOpenMessage) {
      const msg = onOpenMessage();
      if (msg) socket.send(JSON.stringify(msg));
    }
  });

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('[WS] Message invalide :', err);
    }
  });

  socket.addEventListener('close', () => console.warn('[WS] Déconnecté'));
  socket.addEventListener('error', (err) => console.error('[WS] Erreur :', err));
}

export function sendMove(input: {
  type: 'input',
  player: number,
  left: boolean,
  right: boolean
}) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(input));
  }
}
