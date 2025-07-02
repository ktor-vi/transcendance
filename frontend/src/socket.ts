let socket: WebSocket;

/**
 * Fonction pour établir une connexion WebSocket avec le serveur
 * @param onMessage - callback appelé à chaque réception de message du serveur
 * @param onOpenMessage - callback optionnel exécuté une fois la connexion ouverte. Il peut retourner un message à envoyer.
 */
export function connectWebSocket(
  onMessage: (data: any) => void,
  onOpenMessage?: () => any
) {
  // Création d'une nouvelle connexion WebSocket vers le serveur à l'adresse spécifiée
  // Ici, on suppose que le serveur WebSocket écoute sur le port 3000, à la route "/ws"
  socket = new WebSocket(`wss://${process.env.HOSTNAME}}:3000/ws`);

  // Événement déclenché une fois la connexion WebSocket établie
  socket.addEventListener('open', () => {
    console.log('[WSS] Connecté');

    // Si une fonction onOpenMessage est fournie
    if (onOpenMessage) {
      // On exécute cette fonction et récupère un message initial
      const msg = onOpenMessage();
      // Si ce message est défini, on l'envoie au serveur sous forme JSON
      if (msg) socket.send(JSON.stringify(msg));
    }
  });

  // Événement déclenché à chaque réception de message depuis le serveur WebSocket
  socket.addEventListener('message', (event) => {
    try {
      // On tente de parser les données reçues (sous forme de texte JSON) en objet JS
      const data = JSON.parse(event.data);
      // On appelle la fonction onMessage avec les données
      onMessage(data);
    } catch (err) {
      // En cas d'erreur de parsing JSON, on affiche un message dans la console
      console.error('[WS] Message invalide :', err);
    }
  });

  // Événement déclenché lorsque la connexion est fermée
  socket.addEventListener('close', () => console.warn('[WS] Déconnecté'));

  // Événement déclenché en cas d'erreur de communication avec le serveur
  socket.addEventListener('error', (err) => console.error('[WS] Erreur :', err));
}

/**
 * Fonction utilitaire pour envoyer les mouvements du joueur via WebSocket
 * @param input - un objet contenant l'état des contrôles du joueur
 * Exemple : { type: 'input', player: 1, left: true, right: false }
 */
export function sendMove(input: {
  type: 'input',
  player: number,
  left: boolean,
  right: boolean
}) {
  // Vérifie que la connexion est bien ouverte avant d'envoyer le message
  if (socket?.readyState === WebSocket.OPEN) {
    // Envoie l'objet "input" converti en JSON au serveur
    socket.send(JSON.stringify(input));
  }
}
