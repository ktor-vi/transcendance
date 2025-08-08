// 🎮 SERVEUR DE JEU PROPRE ET CORRIGÉ
import crypto from "crypto";
import fp from "fastify-plugin";

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const PDL_SPD = 0.25;
const MAX_SCORE = 11;

export default fp(async function (fastify) {
  const rooms = new Map();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createRoom(forcedId = null) {
    const roomId = forcedId || crypto.randomUUID().slice(0, 8);

    // Nettoyer l'ancienne room si elle existe
    if (rooms.has(roomId)) {
      const oldRoom = rooms.get(roomId);
      if (oldRoom.loop) {
        clearInterval(oldRoom.loop);
      }
      rooms.delete(roomId);
      console.log(`🧹 Ancienne room ${roomId} nettoyée`);
    }

    console.log(`🎮 Création de la room: ${roomId}`);

    // État initial du jeu
    const gameState = {
      ball: { x: 0, z: 0, dx: 0.05, dz: 0.1 },
      paddleOne: { x: 0 },
      paddleTwo: { x: 0 },
      score: { p1: 0, p2: 0 },
      gameEnded: false,
      winner: null,
      players: new Map(), // playerNumber -> playerName
    };

    // Créer la room
    const room = {
      gameState,
      roomId,
      lastUpdateTime: Date.now(),
    };

    rooms.set(roomId, room);

    // Démarrer la boucle de jeu à 60 FPS
    room.loop = setInterval(() => updateRoom(roomId), 1000 / 60);

    return roomId;
  }

  function updateRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      console.warn(
        `⚠️ Tentative de mise à jour d'une room inexistante: ${roomId}`
      );
      return;
    }

    const gs = room.gameState;

    // Ignorer si le jeu est terminé
    if (gs.gameEnded) {
      return;
    }

    // Physique de la balle
    gs.ball.x += gs.ball.dx;
    gs.ball.z += gs.ball.dz;

    // Contraindre les paddles dans les limites du terrain
    gs.paddleOne.x = clamp(
      gs.paddleOne.x,
      -FIELD_WIDTH / 2 + 1,
      FIELD_WIDTH / 2 - 1
    );
    gs.paddleTwo.x = clamp(
      gs.paddleTwo.x,
      -FIELD_WIDTH / 2 + 1,
      FIELD_WIDTH / 2 - 1
    );

    // Rebonds sur les murs latéraux
    if (gs.ball.x <= -FIELD_WIDTH / 2 || gs.ball.x >= FIELD_WIDTH / 2) {
      gs.ball.dx *= -1;
    }

    // Collision avec le paddle du joueur 1 (côté négatif Z)
    if (
      gs.ball.z <= -FIELD_DEPTH / 2 + 0.5 &&
      gs.ball.z >= -FIELD_DEPTH / 2 - 0.5 &&
      Math.abs(gs.ball.x - gs.paddleOne.x) < 1.1
    ) {
      gs.ball.z = -FIELD_DEPTH / 2 + 0.5;
      gs.ball.dz = Math.abs(gs.ball.dz); // Renvoie vers le positif
    }

    // Collision avec le paddle du joueur 2 (côté positif Z)
    if (
      gs.ball.z >= FIELD_DEPTH / 2 - 0.5 &&
      gs.ball.z <= FIELD_DEPTH / 2 + 0.5 &&
      Math.abs(gs.ball.x - gs.paddleTwo.x) < 1.1
    ) {
      gs.ball.z = FIELD_DEPTH / 2 - 0.5;
      gs.ball.dz = -Math.abs(gs.ball.dz); // Renvoie vers le négatif
    }

    // Gestion des points
    let pointScored = false;
    let scoringPlayer = null;

    if (gs.ball.z <= -FIELD_DEPTH / 2 - 0.5) {
      // La balle sort côté joueur 1 → Joueur 2 marque
      gs.score.p2++;
      scoringPlayer = 2;
      pointScored = true;
      console.log(`🎯 Point pour P2! Score: ${gs.score.p1}-${gs.score.p2}`);
    } else if (gs.ball.z >= FIELD_DEPTH / 2 + 0.5) {
      // La balle sort côté joueur 2 → Joueur 1 marque
      gs.score.p1++;
      scoringPlayer = 1;
      pointScored = true;
      console.log(`🎯 Point pour P1! Score: ${gs.score.p1}-${gs.score.p2}`);
    }

    if (pointScored) {
      // Réinitialiser la position de la balle
      gs.ball.x = 0;
      gs.ball.z = 0;
      gs.ball.dx = (Math.random() - 0.5) * 0.1; // Direction horizontale aléatoire
      gs.ball.dz = scoringPlayer === 1 ? 0.1 : -0.1; // Direction vers l'adversaire

      // Informer le système de tournoi
      if (fastify.updateMatchScore) {
        fastify.updateMatchScore(roomId, gs.score.p1, gs.score.p2);
      }

      // Vérifier la condition de fin de partie
      if (gs.score.p1 >= MAX_SCORE || gs.score.p2 >= MAX_SCORE) {
        endGame(room, scoringPlayer);
        return; // Sortir pour éviter de diffuser après la fin
      }
    }

    // Diffuser l'état du jeu via le gestionnaire WebSocket unifié
    if (fastify.broadcastToGameRoom) {
      fastify.broadcastToGameRoom(roomId, {
        type: "state",
        gameState: {
          ball: { ...gs.ball },
          paddleOne: { ...gs.paddleOne },
          paddleTwo: { ...gs.paddleTwo },
          scoreP1: gs.score.p1,
          scoreP2: gs.score.p2,
          gameEnded: gs.gameEnded,
        },
      });
    }
  }

  function endGame(room, winningPlayerNumber) {
    const gs = room.gameState;

    // Marquer le jeu comme terminé
    gs.gameEnded = true;
    gs.winner = winningPlayerNumber;

    // Récupérer les noms des joueurs
    const winnerName =
      gs.players.get(winningPlayerNumber) || `Player${winningPlayerNumber}`;
    const loserNumber = winningPlayerNumber === 1 ? 2 : 1;
    const loserName = gs.players.get(loserNumber) || `Player${loserNumber}`;

    console.log(
      `🏁 Fin de partie ${room.roomId}: ${winnerName} bat ${loserName} ${gs.score.p1}-${gs.score.p2}`
    );

    // Informer le système de tournoi du résultat final
    if (fastify.updateMatchScore) {
      fastify.updateMatchScore(
        room.roomId,
        gs.score.p1,
        gs.score.p2,
        winnerName
      );
    }

    // Diffuser la fin de partie
    if (fastify.broadcastToGameRoom) {
      fastify.broadcastToGameRoom(room.roomId, {
        type: "gameEnd",
        winner: winnerName,
        loser: loserName,
        scoreP1: gs.score.p1,
        scoreP2: gs.score.p2,
        winnerNumber: winningPlayerNumber,
      });
    }

    // Arrêter la boucle de mise à jour
    if (room.loop) {
      clearInterval(room.loop);
      room.loop = null;
    }

    // Programmer la suppression de la room
    setTimeout(() => {
      rooms.delete(room.roomId);
      console.log(`🗑️ Room ${room.roomId} supprimée après fin de partie`);
    }, 5000);
  }

  function ensureRoom(roomId, player1Name, player2Name) {
    // Créer la room si elle n'existe pas
    if (!rooms.has(roomId)) {
      createRoom(roomId);
    }

    const room = rooms.get(roomId);

    // Configurer les joueurs
    if (player1Name) {
      room.gameState.players.set(1, player1Name);
    }
    if (player2Name) {
      room.gameState.players.set(2, player2Name);
    }

    console.log(
      `🎮 Room ${roomId} configurée: ${player1Name || "Player1"} vs ${
        player2Name || "Player2"
      }`
    );

    return room;
  }

  // Dans gameServer.js, modifier handleGameInput :
  function handleGameInput(roomId, playerNumber, inputMsg) {
    const room = rooms.get(roomId);

    if (!room) {
      console.warn(`⚠️ Input ignoré: room ${roomId} inexistante`);
      return;
    }

    if (room.gameState.gameEnded) {
      return;
    }

    // 🔧 CORRECTION : Utiliser le playerNumber du message si disponible
    const actualPlayerNumber = inputMsg.playerNumber || playerNumber;

    if (actualPlayerNumber !== 1 && actualPlayerNumber !== 2) {
      console.warn(`⚠️ Numéro de joueur invalide: ${actualPlayerNumber}`);
      return;
    }

    const paddle =
      actualPlayerNumber === 1
        ? room.gameState.paddleOne
        : room.gameState.paddleTwo;

    const PADDLE_SPEED = 0.3; // Augmenté pour plus de réactivité

    // Log pour debug
    console.log(
      `🎮 Input P${actualPlayerNumber}: L:${inputMsg.left} R:${
        inputMsg.right
      } Pos:${paddle.x.toFixed(2)}`
    );

    // Appliquer le mouvement
    if (inputMsg.left) {
      paddle.x = Math.max(paddle.x - PADDLE_SPEED, -FIELD_WIDTH / 2 + 1);
    }
    if (inputMsg.right) {
      paddle.x = Math.min(paddle.x + PADDLE_SPEED, FIELD_WIDTH / 2 - 1);
    }
  }

  function getAllRoomsStatus() {
    const roomList = [];

    for (const [roomId, room] of rooms.entries()) {
      roomList.push({
        roomId,
        score: { ...room.gameState.score },
        gameEnded: room.gameState.gameEnded,
        winner: room.gameState.winner,
        players: Object.fromEntries(room.gameState.players),
        lastUpdate: room.lastUpdateTime,
      });
    }

    return roomList;
  }

  

  

  // ===== EXPOSER LES FONCTIONS PUBLIQUES =====

  fastify.decorate("createRoom", createRoom);
  fastify.decorate("ensureRoom", ensureRoom);
  fastify.decorate("handleGameInput", handleGameInput);

  // ===== NETTOYAGE À L'ARRÊT =====

  fastify.addHook("onClose", async () => {
    console.log("🧹 Nettoyage des rooms de jeu...");

    for (const [roomId, room] of rooms.entries()) {
      if (room.loop) {
        clearInterval(room.loop);
      }
    }

    rooms.clear();
    console.log("✅ Serveur de jeu nettoyé");
  });

  console.log("🎮 Serveur de jeu initialisé (architecture propre)");
});
