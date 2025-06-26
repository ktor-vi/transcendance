import crypto from 'crypto';
import fp from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const PDL_SPD = 0.25;

//On utilise le serveur websocket sous forme de plugin
export default fp(async function (fastify) {
  await fastify.register(fastifyWebsocket);

  //Les rooms seront stockées dans une Map, chaque room contient un clients (map des websockets) et un objet gameState
  const rooms = new Map();

  //Crée une nouvelle room et assigne les valeurs par défaut, crée un ID le retourne après avoir ajouté la room à la map
  function createRoom() {
    const roomId = crypto.randomUUID().slice(0, 8);
    const gameState = {
      ball: { x: 0, z: 0, dx: 0.05, dz: 0.1 },
      paddleOne: { x: 0 },
      paddleTwo: { x: 0 },
    };
    const clients = new Map();
    rooms.set(roomId, { clients, gameState });
    return roomId;
  }

  //Fonction clamp éviter les valeurs hors limites des palettes
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  // Game loop, est exécutée a 60 FPS
  setInterval(() => {
    //La boucle for s'assure d'exécuter le jeu pour chaque room
    for (const { clients, gameState } of rooms.values()) {
      gameState.ball.x += gameState.ball.dx;
      gameState.ball.z += gameState.ball.dz;

      //clamp les valeurs des palettes
      gameState.paddleOne.x = clamp(gameState.paddleOne.x, -FIELD_WIDTH / 2, FIELD_WIDTH / 2);
      gameState.paddleTwo.x = clamp(gameState.paddleTwo.x, -FIELD_WIDTH / 2, FIELD_WIDTH / 2);

      //rebonds contre les murs
      if (gameState.ball.x <= -FIELD_WIDTH / 2 || gameState.ball.x >= FIELD_WIDTH / 2) {
        gameState.ball.dx *= -1;
      }

      if (
        Math.abs(gameState.ball.z + FIELD_DEPTH / 2) < 0.4 &&
        Math.abs(gameState.ball.x - gameState.paddleOne.x) < 1.1
      ) gameState.ball.dz *= -1;

      if (
        Math.abs(gameState.ball.z - FIELD_DEPTH / 2) < 0.4 &&
        Math.abs(gameState.ball.x - gameState.paddleTwo.x) < 1.1
      ) gameState.ball.dz *= -1;

      //Si la balle sort du terrain on la remet au centre
      if (Math.abs(gameState.ball.z) >= FIELD_DEPTH) {
        Object.assign(gameState.ball, { x: 0, z: 0, dx: 0.05, dz: 0.1 });
      }

      //Envoie la nouvelle position de la balle aux clients
      const payload = JSON.stringify({ type: 'state', gameState });
      for (const { socket } of clients.values()) {
        if (socket.readyState === 1) socket.send(payload);
      }
    }
  }, 1000 / 60);

  //Création d'une route avec websocket ws, quand on se connecte on recoit un ID et on envoie le state de la partie
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const clientId = crypto.randomUUID();
    let joinedRoom = null;
    let playerNum = 0;

    // Flux de données du websocket
    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.type === 'joinRoom') {
        // soit joindre une existante
        let roomId = msg.roomId;
        if (roomId === 'auto') {
          // soit rejoindre une room existante (auto)
          for (const [id, room] of rooms.entries()) {
            // vérifie s'il y a de la place (2 joueurs max)
            if (room.clients.size === 1) {
              roomId = id;
              break;
            }
          }
        }
        // soit créer une nouvelle
        if (!roomId || !rooms.has(roomId)) {
          roomId = createRoom();
        }

        const room = rooms.get(roomId);
        const takenNums = [...room.clients.values()].map(c => c.playerNum);

        //error handling
        if (takenNums.length >= 2) {
          socket.send(JSON.stringify({ type: 'error', message: 'Room full' }));
          socket.close();
          return;
        }
        // assigne le numéro de joueur (1 ou 2)
        if (!takenNums.includes(1)) playerNum = 1;
        else if (!takenNums.includes(2)) playerNum = 2;

        //Assigne le client a la room
        room.clients.set(clientId, { socket, playerNum });
        joinedRoom = roomId;

        //renvoie tout ça
        socket.send(JSON.stringify({ type: 'assign', roomId, player: playerNum }));
        console.log(`👤 Joueur ${playerNum} rejoint room ${roomId}`);
      }

      //Gère les inputs des paddles
      if (msg.type === 'input' && joinedRoom) {
        const room = rooms.get(joinedRoom);
        if (!room) return;
        const gs = room.gameState;
        const paddle = playerNum === 1 ? gs.paddleOne : gs.paddleTwo;
        if (msg.left) paddle.x -= PDL_SPD;
        if (msg.right) paddle.x += PDL_SPD;
      }
    });

    //Fonction pour nettoyer la room et les clients en cas de close ou d'error
    function cleanUp() {
      if (!joinedRoom) return;
      const room = rooms.get(joinedRoom);
      if (!room) return;
      room.clients.delete(clientId);
      if (room.clients.size === 0) {
        rooms.delete(joinedRoom);
        console.log(`🧹 Room ${joinedRoom} supprimée`);
      }
    }

    socket.on('close', cleanUp);
    socket.on('error', cleanUp);
  });
});
