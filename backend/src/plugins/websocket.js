// ===== SOLUTION : websocketHandler.js avec fastify-plugin =====

import websocketPlugin from "@fastify/websocket";
import fastifyPlugin from "fastify-plugin"; // 🔥 AJOUT CRITIQUE
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
    console.log("📡 broadcastTournamentUpdate appelé");
    console.log("🔍 État de fastify.tournaments:", {
      exists: !!fastify.tournaments,
      isMap: fastify.tournaments instanceof Map,
      size: fastify.tournaments ? fastify.tournaments.size : "N/A",
      keys: fastify.tournaments ? Array.from(fastify.tournaments.keys()) : [],
    });

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

    console.log("📡 BROADCASTING UPDATE:", {
      exists: tournamentData.exists,
      state: tournamentData.state,
      playersCount: tournamentData.players.length,
      players: tournamentData.players.map((p) => p.name),
      clientsConnected: tournamentClients.size,
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
    console.log("📡 broadcastToGameRoom appelé");

    const connections = gameRoomConnections.get(roomId);
    if (!connections) {
      console.warn(`⚠️ Aucune connexion trouvée pour room ${roomId}`);
      return;
    }

    const messageStr = JSON.stringify(message);
    console.log(
      `📡 Broadcasting to room ${roomId} (${connections.size} clients):`,
      message.type
    );

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
        console.log(
          "📨 Message reçu:",
          msg.type,
          msg.connectionId || msg.playerName || ""
        );
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

      // 🔧 CORRECTION: S'assurer que la room existe avec les bons joueurs
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
        `✅ Joueur ${playerName} assigné à ${joinedRoom} (Joueur ${playerNumber})`
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

    // Dans websocketHandler.js, fonction handleInput :
    function handleInput(msg) {
      // 🔧 CORRECTION : Utiliser le playerNumber du message ou de la connexion
      const effectivePlayerNumber =
        msg.playerNumber || conn.playerNumber || playerNumber;

      if (fastify.handleGameInput && joinedRoom && effectivePlayerNumber) {
        console.log(
          `🎮 Transmission input: Room ${joinedRoom}, P${effectivePlayerNumber}`,
          {
            left: msg.left,
            right: msg.right,
          }
        );

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
      for (const [roomId, connections] of gameRoomConnections.entries()) {
        if (connections.has(conn)) {
          connections.delete(conn);
          if (connections.size === 0) {
            gameRoomConnections.delete(roomId);
            console.log(`🗑️ Room ${roomId} supprimée (plus de connexions)`);
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
    "🌐 Gestionnaire WebSocket unifié initialisé avec fastify-plugin"
  );
}

export default fastifyPlugin(websocketHandler, {
  name: "websocket-handler",
});

