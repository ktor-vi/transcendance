// 🎮 SERVEUR DE JEU AVEC ATTENTE DE 2 JOUEURS
import crypto from "crypto";
import fp from "fastify-plugin";

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const PDL_SPD = 0.25;
const MAX_SCORE = 11;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default fp(async function (fastify) {
  const rooms = new Map();

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
      playersReady: 0, // Compteur de joueurs connectés
      gameActive: false, // Jeu actif ou en attente
    };

    // Créer la room
    const room = {
      gameState,
      roomId,
      lastUpdateTime: Date.now(),
      loop: null, // Pas de boucle au début
    };

    rooms.set(roomId, room);
    console.log(`✅ Room ${roomId} créée - en attente de joueurs`);

    return roomId;
  }

  // 🔧 NOUVELLE FONCTION: Démarrer la boucle de jeu
  function startGameLoop(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      console.warn(`⚠️ Impossible de démarrer - room ${roomId} inexistante`);
      return;
    }

    if (room.loop) {
      console.log(`⚠️ Boucle de jeu déjà active pour ${roomId}`);
      return;
    }

    console.log(`🚀 Démarrage de la boucle de jeu pour ${roomId}`);
    room.gameState.gameActive = true;

    // Démarrer la boucle de jeu à 60 FPS
    room.loop = setInterval(() => updateRoom(roomId), 1000 / 60);
  }

  // 🔧 NOUVELLE FONCTION: Arrêter la boucle de jeu
  function stopGameLoop(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.loop) {
      clearInterval(room.loop);
      room.loop = null;
      room.gameState.gameActive = false;
      console.log(`⏹️ Boucle de jeu arrêtée pour ${roomId}`);
    }
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

    // 🔧 NOUVEAU: Ne pas mettre à jour si le jeu n'est pas actif
    if (!gs.gameActive || gs.gameEnded) {
      return;
    }

    // 🔧 NOUVEAU: Vérifier qu'il y a bien 2 joueurs
    if (gs.playersReady < 2) {
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

      // Informer le système de tournoi (si applicable)
      if (fastify.updateMatchScore) {
        const player1Name = gs.players.get(1) || "Player1";
        const player2Name = gs.players.get(2) || "Player2";

        fastify.updateMatchScore(
          roomId,
          player1Name,
          player2Name,
          gs.score.p1,
          gs.score.p2
        );
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
          gameActive: gs.gameActive,
        },
      });
    }
  }

  function endGame(room, winningPlayerNumber) {
    const gs = room.gameState;

    // Marquer le jeu comme terminé
    gs.gameEnded = true;
    gs.gameActive = false;
    gs.winner = winningPlayerNumber;

    // Récupérer les noms des joueurs
    const winnerName =
      gs.players.get(winningPlayerNumber) || `Player${winningPlayerNumber}`;
    const loserNumber = winningPlayerNumber === 1 ? 2 : 1;
    const loserName = gs.players.get(loserNumber) || `Player${loserNumber}`;

    console.log(
      `🏁 Fin de partie ${room.roomId}: ${winnerName} bat ${loserName} ${gs.score.p1}-${gs.score.p2}`
    );

    // Informer le système de tournoi du résultat final (si applicable)
    // if (fastify.updateMatchScore) {
    //   const player1Name = gs.players.get(1) || "Player1";
    //   const player2Name = gs.players.get(2) || "Player2";

    //   fastify.updateMatchScore(
    //     room.roomId,
    //     player1Name,
    //     player2Name,
    //     gs.score.p1,
    //     gs.score.p2,
    //     winnerName
    //   );
    // }

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
    stopGameLoop(room.roomId);

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

    // 🔧 MODIFICATION: Configurer les joueurs et démarrer si 2 joueurs
    if (player1Name) {
      room.gameState.players.set(1, player1Name);
    }
    if (player2Name) {
      room.gameState.players.set(2, player2Name);
    }

    // 🔧 NOUVEAU: Compter les joueurs connectés
    room.gameState.playersReady = room.gameState.players.size;

    console.log(
      `🎮 Room ${roomId} configurée: ${player1Name || "Player1"} vs ${
        player2Name || "Player2"
      } (${room.gameState.playersReady}/2 joueurs)`
    );

    // 🔧 NOUVEAU: Démarrer le jeu si 2 joueurs sont prêts
    if (room.gameState.playersReady >= 2 && !room.loop) {
      console.log(`🚀 2 joueurs connectés - démarrage du jeu ${roomId}`);
      startGameLoop(roomId);
    }

    return room;
  }

  // 🔧 MODIFICATION: Gérer la connexion/déconnexion des joueurs
  function handlePlayerConnection(roomId, playerNumber, playerName) {
    const room = rooms.get(roomId);
    if (!room) {
      console.warn(`⚠️ Room ${roomId} non trouvée pour connexion joueur`);
      return false;
    }

    // Ajouter le joueur
    room.gameState.players.set(playerNumber, playerName);
    room.gameState.playersReady = room.gameState.players.size;

    console.log(
      `👋 Joueur ${playerNumber} (${playerName}) connecté à ${roomId} (${room.gameState.playersReady}/2)`
    );

    // Démarrer le jeu si 2 joueurs sont connectés
    if (room.gameState.playersReady >= 2 && !room.loop) {
      console.log(`🚀 2 joueurs connectés - démarrage du jeu ${roomId}`);
      setTimeout(() => startGameLoop(roomId), 1000); // Petit délai pour que les clients soient prêts
    }

    return true;
  }

  function handlePlayerDisconnection(roomId, playerNumber) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Retirer le joueur
    room.gameState.players.delete(playerNumber);
    room.gameState.playersReady = room.gameState.players.size;

    console.log(
      `👋 Joueur ${playerNumber} déconnecté de ${roomId} (${room.gameState.playersReady}/2)`
    );

    // Arrêter le jeu si moins de 2 joueurs
    if (room.gameState.playersReady < 2) {
      console.log(`⏹️ Moins de 2 joueurs - arrêt du jeu ${roomId}`);
      stopGameLoop(roomId);
    }
  }

  function handleGameInput(roomId, playerNumber, inputMsg) {
    const room = rooms.get(roomId);

    if (!room) {
      console.warn(`⚠️ Input ignoré: room ${roomId} inexistante`);
      return;
    }

    // 🔧 NOUVEAU: Ignorer les inputs si le jeu n'est pas actif
    if (!room.gameState.gameActive || room.gameState.gameEnded) {
      return;
    }

    // 🔧 NOUVEAU: Ignorer si pas assez de joueurs
    if (room.gameState.playersReady < 2) {
      return;
    }

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
        gameActive: room.gameState.gameActive,
        playersReady: room.gameState.playersReady,
        winner: room.gameState.winner,
        players: Object.fromEntries(room.gameState.players),
        lastUpdate: room.lastUpdateTime,
      });
    }

    return roomList;
  }

  // 🔧 NOUVELLE FONCTION: Obtenir le statut d'une room spécifique
  function getRoomStatus(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      return null;
    }

    return {
      roomId,
      gameState: {
        ball: { ...room.gameState.ball },
        paddleOne: { ...room.gameState.paddleOne },
        paddleTwo: { ...room.gameState.paddleTwo },
        score: { ...room.gameState.score },
        gameEnded: room.gameState.gameEnded,
        gameActive: room.gameState.gameActive,
        playersReady: room.gameState.playersReady,
        winner: room.gameState.winner,
      },
      players: Object.fromEntries(room.gameState.players),
      lastUpdate: room.lastUpdateTime,
    };
  }

  // ===== EXPOSER LES FONCTIONS PUBLIQUES =====

  fastify.decorate("createRoom", createRoom);
  fastify.decorate("ensureRoom", ensureRoom);
  fastify.decorate("handleGameInput", handleGameInput);
  fastify.decorate("getRoomStatus", getRoomStatus);
  fastify.decorate("getAllRoomsStatus", getAllRoomsStatus);
  fastify.decorate("handlePlayerConnection", handlePlayerConnection);
  fastify.decorate("handlePlayerDisconnection", handlePlayerDisconnection);

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

  console.log("🎮 Serveur de jeu initialisé avec attente de 2 joueurs");
});
