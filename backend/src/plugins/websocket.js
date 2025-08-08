// ===== SOLUTION : websocketHandler.js avec distinction Dashboard/Tournament =====

import websocketPlugin from "@fastify/websocket";
import fastifyPlugin from "fastify-plugin";
import crypto from "crypto";

async function websocketHandler(fastify) {
  await fastify.register(websocketPlugin);

  const gameRoomConnections = new Map(); // roomId -> Set<WebSocket>
  const tournamentClients = new Set();

  // ===== INITIALISER LE MAP TOURNAMENTS SI INEXISTANT =====
  if (!fastify.tournaments) {
    console.log("🏗️ Initialisation du Map tournaments");
    fastify.decorate("tournaments", new Map());
  }

  function broadcastTournamentUpdate() {

    if (!fastify.tournaments) {
      console.error("❌ fastify.tournaments non initialisé");
      return;
    }

    const tournament = fastify.tournaments.get("default");
    console.log("🔍 Tournoi 'default':", {
      found: !!tournament,
      state: tournament?.state,
      playersCount: tournament?.players?.length || 0,
      players: tournament?.players?.map((p) => p.name) || [],
    });

    const tournamentData = tournament
      ? {
          exists: true,
          state: tournament.state,
          round: tournament.round,
          players: tournament.players || [],
          matches: tournament.matches || [],
          winner: tournament.winner || null,
          qualified: tournament.qualified || [],
        }
      : {
          exists: false,
          state: "waiting",
          round: 0,
          players: [],
          matches: [],
          winner: null,
          qualified: [],
        };

    const payload = JSON.stringify({
      type: "update",
      data: tournamentData,
    });



    let successCount = 0;
    let failCount = 0;

    for (const socket of tournamentClients) {
      if (socket && socket.readyState === 1) {
        try {
          socket.send(payload);
          successCount++;
        } catch (err) {
          console.warn(`⚠️ Échec envoi à un client: ${err.message}`);
          tournamentClients.delete(socket);
          failCount++;
        }
      } else {
        tournamentClients.delete(socket);
        failCount++;
      }
    }

    console.log(
      `📡 Diffusion terminée: ${successCount} succès, ${failCount} échecs`
    );
  }

  function updateMatchScore(roomId, scoreP1, scoreP2, winner = null) {
    console.log("📊 updateMatchScore appelé");

    if (!fastify.tournaments) {
      console.error(`❌ fastify.tournaments non initialisé`);
      return false;
    }

    const tournament = fastify.tournaments.get("default");
    if (!tournament) {
      console.error(`❌ Tournoi par défaut non trouvé`);
      return false;
    }

    const match = tournament.matches
      ? tournament.matches.find((m) => m.roomId === roomId)
      : null;
    if (!match) {
      console.error(`❌ Match non trouvé pour roomId: ${roomId}`);
      return false;
    }

    console.log(
      `📊 Mise à jour score pour ${roomId}: ${scoreP1}-${scoreP2}${
        winner ? ` (Gagnant: ${winner})` : ""
      }`
    );

    match.scoreP1 = parseInt(scoreP1) || 0;
    match.scoreP2 = parseInt(scoreP2) || 0;

    if (winner) {
      match.winner = winner;
      match.status = "finished";
      console.log(`🏆 Match terminé: ${winner} gagne ${scoreP1}-${scoreP2}!`);

      const allFinished = tournament.matches.every(
        (m) => m.status === "finished" && m.winner
      );
      if (allFinished && tournament.state === "running") {
        console.log(`✅ Tous les matchs du round ${tournament.round} terminés`);
        tournament.state = "completed_round";
      }
    } else {
      match.status = "playing";
    }

    broadcastTournamentUpdate();
    return true;
  }

  function broadcastToGameRoom(roomId, message) {

    const connections = gameRoomConnections.get(roomId);
    if (!connections) {
      console.warn(`⚠️ Aucune connexion trouvée pour room ${roomId}`);
      return;
    }

    const messageStr = JSON.stringify(message);


    for (const conn of connections) {
      if (conn.readyState === 1) {
        try {
          conn.send(messageStr);
        } catch (error) {
          console.error("Erreur envoi message:", error.message);
          connections.delete(conn);
        }
      } else {
        connections.delete(conn);
      }
    }
  }

  // ===== WEBSOCKET UNIFIÉ =====
  fastify.get("/ws", { websocket: true }, (conn, req) => {
    const clientId = crypto.randomUUID();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const type = url.searchParams.get("type") || "game";

    console.log(`🔗 Nouvelle connexion WebSocket (${type}): ${clientId}`);

    if (type === "tournament") {
      handleTournamentConnection(conn, clientId);
    } else {
      handleGameConnection(conn, clientId);
    }
  });

  // ===== GESTION CONNEXIONS TOURNOI =====
  function handleTournamentConnection(conn, clientId) {
    tournamentClients.add(conn);
    console.log(
      `📡 NOUVEAU CLIENT TOURNOI connecté: ${clientId} (Total: ${tournamentClients.size})`
    );

    try {
      console.log("🔍 Vérification état pour nouveau client:", {
        tournamentsExists: !!fastify.tournaments,
        defaultTournament: !!fastify.tournaments?.get("default"),
      });

      if (!fastify.tournaments) {
        console.error("❌ tournaments non initialisé pour nouveau client");
        conn.send(
          JSON.stringify({
            type: "update",
            data: {
              exists: false,
              error: "Système de tournoi non initialisé",
              players: [],
              state: "waiting",
              round: 0,
              matches: [],
            },
          })
        );
        return;
      }

      const tournament = fastify.tournaments.get("default");
      console.log("🔍 Tournoi pour nouveau client:", {
        found: !!tournament,
        playersCount: tournament?.players?.length || 0,
        players: tournament?.players?.map((p) => p.name) || [],
      });

      const initialData = tournament
        ? {
            exists: true,
            state: tournament.state,
            round: tournament.round,
            players: tournament.players || [],
            matches: tournament.matches || [],
            winner: tournament.winner || null,
            qualified: tournament.qualified || [],
          }
        : {
            exists: false,
            state: "waiting",
            round: 0,
            players: [],
            matches: [],
            winner: null,
            qualified: [],
          };

      console.log(`📤 Envoi état initial à ${clientId}:`, {
        exists: initialData.exists,
        playersCount: initialData.players.length,
        state: initialData.state,
        players: initialData.players.map((p) => p.name),
      });

      conn.send(
        JSON.stringify({
          type: "update",
          data: initialData,
        })
      );
    } catch (error) {
      console.error(
        `❌ Erreur envoi état initial à ${clientId}:`,
        error.message
      );
      console.error("Stack:", error.stack);
    }

    conn.on("close", () => {
      tournamentClients.delete(conn);
      console.log(
        `📡 Client tournoi ${clientId} déconnecté (Reste: ${tournamentClients.size})`
      );
    });

    conn.on("error", (error) => {
      console.error(`❌ Erreur client tournoi ${clientId}:`, error.message);
      tournamentClients.delete(conn);
    });
  }

  // ===== GESTION CONNEXIONS JEU =====
  function handleGameConnection(conn, clientId) {
    let joinedRoom = null;
    let playerName = null;
    let playerNumber = 0;

    conn.on("message", (message) => {
      let msg;
      try {
        msg = JSON.parse(message.toString());
       
      } catch (e) {
        console.warn("Message WS non JSON", message.toString());
        return;
      }

      switch (msg.type) {
        case "joinRoom":
          handleJoinRoom(msg);
          break;

        case "scoreUpdate":
          handleScoreUpdate(msg);
          break;

        case "gameEnd":
          handleGameEnd(msg);
          break;

        case "input":
          handleInput(msg);
          break;

        default:
          console.log("Type de message non géré:", msg.type);
      }
    });

    function handleJoinRoom(msg) {
      const { connectionId, playerName: msgPlayerName, roomId } = msg;
      playerName = msgPlayerName || connectionId;

      console.log(`🎮 Demande de joinRoom:`, {
        connectionId,
        playerName,
        roomId,
        clientId,
      });

      // 🔧 DISTINCTION CRITIQUE: Dashboard vs Tournament
      const isDashboardConnection =
        connectionId && connectionId.startsWith("dashboard-");

      if (isDashboardConnection) {
        // 🎮 CONNEXION DASHBOARD - Utiliser le système de rooms 1v1
        console.log(`🎮 Connexion Dashboard détectée pour ${playerName}`);
        handleDashboardJoinRoom(msg);
      } else {
        // 🏆 CONNEXION TOURNOI - Utiliser le système de tournoi
        console.log(`🏆 Connexion Tournoi détectée pour ${playerName}`);
        handleTournamentJoinRoom(msg);
      }
    }

    // 🔧 NOUVELLE FONCTION: Gérer les connexions Dashboard (1v1)
    function handleDashboardJoinRoom(msg) {
      const { playerName: msgPlayerName, roomId } = msg;

      console.log(`🎮 Dashboard - Recherche de room pour ${msgPlayerName}`);

      // Créer ou rejoindre une room via le système de jeu
      let targetRoomId = roomId;

      if (!targetRoomId || targetRoomId === "auto") {
        // Chercher d'abord une room existante avec seulement 1 joueur
        let availableRoom = null;
        for (const [
          existingRoomId,
          connections,
        ] of gameRoomConnections.entries()) {
          if (connections.size === 1) {
            availableRoom = existingRoomId;
            console.log(`🔍 Room disponible trouvée: ${availableRoom}`);
            break;
          }
        }

        if (availableRoom) {
          targetRoomId = availableRoom;
        } else {
          // Créer une nouvelle room seulement si aucune n'est disponible
          if (fastify.createRoom) {
            targetRoomId = fastify.createRoom();
            console.log(`🆕 Nouvelle room créée: ${targetRoomId}`);
          } else {
            console.error("❌ fastify.createRoom non disponible");
            conn.send(
              JSON.stringify({
                type: "error",
                message: "Impossible de créer une room de jeu",
              })
            );
            return;
          }
        }
      } else {
        // S'assurer que la room existe
        if (fastify.ensureRoom) {
          fastify.ensureRoom(targetRoomId, msgPlayerName, null);
          console.log(`✅ Room ${targetRoomId} assurée pour ${msgPlayerName}`);
        }
      }

      playerName = msgPlayerName;
      joinedRoom = targetRoomId;

      // Déterminer le numéro de joueur (1 ou 2)
      if (!gameRoomConnections.has(joinedRoom)) {
        gameRoomConnections.set(joinedRoom, new Set());
      }

      const roomConnections = gameRoomConnections.get(joinedRoom);
      playerNumber = roomConnections.size + 1; // 1 ou 2

      if (playerNumber > 2) {
        conn.send(
          JSON.stringify({
            type: "error",
            message: "Room complète (2 joueurs maximum)",
          })
        );
        return;
      }

      roomConnections.add(conn);
      conn.roomId = joinedRoom;
      conn.playerName = playerName;
      conn.playerNumber = playerNumber;

      // 🔧 NOUVEAU: Informer le serveur de jeu de la connexion du joueur
      if (fastify.handlePlayerConnection) {
        fastify.handlePlayerConnection(joinedRoom, playerNumber, playerName);
      }

      // Envoyer l'assignation avec le nom du joueur
      conn.send(
        JSON.stringify({
          type: "assign",
          player: playerNumber,
          roomId: joinedRoom,
          playerName: playerName, // 🔧 NOUVEAU: Inclure le nom du joueur
        })
      );

      // 🔧 NOUVEAU: Envoyer l'état d'attente si on est le premier joueur
      if (playerNumber === 1) {
        conn.send(
          JSON.stringify({
            type: "waiting",
            message: "En attente du second joueur...",
            playersCount: 1,
            maxPlayers: 2,
          })
        );
        console.log(
          `⏳ ${playerName} en attente du second joueur dans ${joinedRoom}`
        );
      } else if (playerNumber === 2) {
        // 🔧 NOUVEAU: Récupérer les noms des deux joueurs
        const roomStatus = fastify.getRoomStatus
          ? fastify.getRoomStatus(joinedRoom)
          : null;
        const playersNames = roomStatus ? roomStatus.players : {};

        // 🔧 NOUVEAU: Informer les deux joueurs que la partie peut commencer
        setTimeout(() => {
          broadcastToGameRoom(joinedRoom, {
            type: "gameReady",
            message: "Tous les joueurs sont connectés! La partie commence...",
            playersCount: 2,
            maxPlayers: 2,
            players: playersNames, // 🔧 NOUVEAU: Inclure les noms des joueurs
          });

          // 🔧 IMPORTANT: Envoyer l'état initial du jeu après un court délai
          setTimeout(() => {
            const updatedRoomStatus = fastify.getRoomStatus
              ? fastify.getRoomStatus(joinedRoom)
              : null;
            if (updatedRoomStatus && updatedRoomStatus.gameState.gameActive) {
              broadcastToGameRoom(joinedRoom, {
                type: "state",
                gameState: {
                  ball: updatedRoomStatus.gameState.ball,
                  paddleOne: updatedRoomStatus.gameState.paddleOne,
                  paddleTwo: updatedRoomStatus.gameState.paddleTwo,
                  scoreP1: updatedRoomStatus.gameState.score.p1,
                  scoreP2: updatedRoomStatus.gameState.score.p2,
                  gameEnded: updatedRoomStatus.gameState.gameEnded,
                  gameActive: updatedRoomStatus.gameState.gameActive,
                },
              });
            }
          }, 500);
        }, 1000); // Délai pour que le client soit prêt

        console.log(
          `🚀 Partie prête à démarrer dans ${joinedRoom} avec ${Object.values(
            playersNames
          ).join(" vs ")}`
        );
      }

      console.log(
        `✅ Dashboard - Joueur ${playerName} assigné à ${joinedRoom} (Joueur ${playerNumber})`
      );
    }

    // 🔧 FONCTION EXISTANTE: Gérer les connexions Tournoi
    function handleTournamentJoinRoom(msg) {
      const { connectionId, playerName: msgPlayerName } = msg;
      playerName = msgPlayerName || connectionId;

      if (!fastify.tournaments) {
        conn.send(
          JSON.stringify({
            type: "error",
            message: "Système de tournoi non initialisé",
          })
        );
        return;
      }

      const tournament = fastify.tournaments.get("default");
      if (!tournament) {
        conn.send(
          JSON.stringify({
            type: "error",
            message: "Tournoi non trouvé",
          })
        );
        return;
      }

      console.log(`🔍 Recherche de match pour: ${playerName}`);

      const match = tournament.matches
        ? tournament.matches.find(
            (m) =>
              (m.player1 === playerName || m.player2 === playerName) &&
              m.status !== "finished"
          )
        : null;

      if (!match) {
        conn.send(
          JSON.stringify({
            type: "error",
            message: `Match non trouvé pour le joueur: ${playerName}`,
          })
        );
        return;
      }

      playerNumber = match.player1 === playerName ? 1 : 2;
      joinedRoom = match.roomId;

      if (!gameRoomConnections.has(joinedRoom)) {
        gameRoomConnections.set(joinedRoom, new Set());
      }
      gameRoomConnections.get(joinedRoom).add(conn);

      conn.roomId = joinedRoom;
      conn.playerName = playerName;
      conn.playerNumber = playerNumber;

      // S'assurer que la room existe avec les bons joueurs
      if (fastify.ensureRoom) {
        fastify.ensureRoom(joinedRoom, match.player1, match.player2);
      }

      // Envoyer l'assignation
      conn.send(
        JSON.stringify({
          type: "assign",
          player: playerNumber,
          roomId: joinedRoom,
        })
      );

      // Envoyer l'état initial
      const roomStatus = fastify.getRoomStatus
        ? fastify.getRoomStatus(joinedRoom)
        : null;
      if (roomStatus) {
        conn.send(
          JSON.stringify({
            type: "state",
            gameState: {
              scoreP1: roomStatus.gameState.score.p1,
              scoreP2: roomStatus.gameState.score.p2,
              player1: match.player1,
              player2: match.player2,
              gameEnded: roomStatus.gameState.gameEnded,
            },
          })
        );
      }

      console.log(
        `✅ Tournoi - Joueur ${playerName} assigné à ${joinedRoom} (Joueur ${playerNumber})`
      );
    }

    function handleScoreUpdate(msg) {
      const { roomId, scoreP1, scoreP2 } = msg;
      console.log(
        `📊 Score update reçu: Room ${roomId}, Score: ${scoreP1}-${scoreP2}`
      );

      const updated = updateMatchScore(roomId, scoreP1, scoreP2);

      if (updated) {
        broadcastToGameRoom(roomId, {
          type: "scoreUpdate",
          scoreP1: parseInt(scoreP1) || 0,
          scoreP2: parseInt(scoreP2) || 0,
        });
      }
    }

    function handleGameEnd(msg) {
      const { roomId, winner, scoreP1, scoreP2 } = msg;
      console.log(
        `🏁 Fin de jeu: Room ${roomId}, Gagnant: ${winner}, Score: ${scoreP1}-${scoreP2}`
      );

      if (!winner || !roomId) {
        console.error("❌ Données manquantes pour la fin de jeu:", msg);
        return;
      }

      const updated = updateMatchScore(roomId, scoreP1, scoreP2, winner);

      if (updated) {
        broadcastToGameRoom(roomId, {
          type: "gameEnd",
          winner: winner,
          scoreP1: parseInt(scoreP1) || 0,
          scoreP2: parseInt(scoreP2) || 0,
        });

        setTimeout(() => {
          const connections = gameRoomConnections.get(roomId);
          if (connections) {
            for (const conn of connections) {
              if (conn.readyState === 1) {
                try {
                  conn.close();
                } catch (error) {
                  console.error("Erreur fermeture connexion:", error.message);
                }
              }
            }
            gameRoomConnections.delete(roomId);
          }
        }, 3000);
      }
    }

    function handleInput(msg) {
      const effectivePlayerNumber =
        msg.playerNumber || conn.playerNumber || playerNumber;

      if (fastify.handleGameInput && joinedRoom && effectivePlayerNumber) {


        fastify.handleGameInput(joinedRoom, effectivePlayerNumber, msg);
      } else {
        console.warn(`⚠️ Input ignoré - Manque d'info:`, {
          hasHandler: !!fastify.handleGameInput,
          room: joinedRoom,
          player: effectivePlayerNumber,
        });
      }
    }

    conn.on("close", () => {
      handleDisconnection();
    });

    conn.on("error", (error) => {
      console.error("Erreur WebSocket:", error.message);
      handleDisconnection();
    });

    function handleDisconnection() {
      // 🔧 NOUVEAU: Informer le serveur de jeu de la déconnexion
      if (
        conn.roomId &&
        conn.playerNumber &&
        fastify.handlePlayerDisconnection
      ) {
        fastify.handlePlayerDisconnection(conn.roomId, conn.playerNumber);
      }

      for (const [roomId, connections] of gameRoomConnections.entries()) {
        if (connections.has(conn)) {
          connections.delete(conn);
          if (connections.size === 0) {
            gameRoomConnections.delete(roomId);
            console.log(`🗑️ Room ${roomId} supprimée (plus de connexions)`);
          } else {
            console.log(
              `👋 Joueur déconnecté de ${roomId} (${connections.size} restants)`
            );
          }
        }
      }
      console.log("👋 Connexion fermée");
    }
  }

  // ===== EXPOSER LES FONCTIONS AVEC LOGS DE CONFIRMATION =====

  fastify.decorate("updateMatchScore", updateMatchScore);
  fastify.decorate("broadcastToGameRoom", broadcastToGameRoom);
  fastify.decorate("broadcastTournamentUpdate", broadcastTournamentUpdate);

  console.log("✅ Fonctions WebSocket exposées:");
  console.log("  - updateMatchScore");
  console.log("  - broadcastToGameRoom");
  console.log("  - broadcastTournamentUpdate");

  console.log(
    "🌐 Gestionnaire WebSocket unifié initialisé avec distinction Dashboard/Tournament"
  );
}

export default fastifyPlugin(websocketHandler, {
  name: "websocket-handler",
});
