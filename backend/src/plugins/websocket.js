// ===== SOLUTION : websocketHandler.js avec distinction Dashboard/Tournament =====

import websocketPlugin from "@fastify/websocket";
import fastifyPlugin from "fastify-plugin";
import crypto from "crypto";
import { openDb, openDbHistory } from "../utils/db.js";

async function websocketHandler(fastify) {
  await fastify.register(websocketPlugin);

  const gameRoomConnections = new Map(); // roomId -> Set<WebSocket>
  const tournamentClients = new Set();

  // ===== INITIALISER LE MAP TOURNAMENTS SI INEXISTANT =====
  if (!fastify.tournaments) {
    fastify.decorate("tournaments", new Map());
  }

  function broadcastTournamentUpdate() {
    if (!fastify.tournaments) {
      return;
    }

    const tournament = fastify.tournaments.get("default");

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
  }

  async function updateMatchScore(
    roomId,
    P1Name,
    P2Name,
    scoreP1,
    scoreP2,
    winner = null
  ) {
    const db = await openDbHistory();

    if (!roomId || P1Name === undefined || P2Name === undefined) {
      return false;
    }

    const tournament = fastify.tournaments.get("default");

    const score1 = parseInt(scoreP1) || 0;
    const score2 = parseInt(scoreP2) || 0;

    // Si aucun winner n'est passé en paramètre, on le détermine
    if (!winner) {
      if (score1 >= 11 && score1 - score2 >= 2) {
        winner = P1Name;
      } else if (score2 >= 11 && score2 - score1 >= 2) {
        winner = P2Name;
      }
    }

    if (!tournament) {
      if (winner) {
        try {
          await db.run(
            `INSERT OR IGNORE INTO history
             (type, player_1, player_2, scores, winner)
             VALUES (?, ?, ?, ?, ?)`,
            ["match", P1Name, P2Name, `${score1} - ${score2}`, winner]
          );
        } catch (error) {}
      }
      return true;
    }

    if (tournament) {
      const match = tournament.matches
        ? tournament.matches.find((m) => m.roomId === roomId)
        : null;

      if (!match) {
        console.log(`⚠️ Match non trouvé pour roomId: ${roomId}`);
        return false;
      }
      
      if (match.status === "finished") {
        return false;
      }
      // Mise à jour du match
      match.scoreP1 = score1;
      match.scoreP2 = score2;

      if (winner) {
        match.winner = winner;
        match.status = "finished";

        let matchType = "tournament match";

        // Pour un tournoi à 3 joueurs :
        // Round 1 = match éliminatoire → "tournament match"
        // Round 2 = finale → "tournament final"
        const totalPlayers = tournament.players.length;
        const finalRound = Math.ceil(Math.log2(totalPlayers)); // Round final théorique

        if (tournament.round >= finalRound) {
          matchType = "tournament final";
        }

        // Sauvegarder ce match immédiatement
        try {
          await db.run(
            `INSERT OR IGNORE INTO history
             (type, player_1, player_2, scores, winner)
             VALUES (?, ?, ?, ?, ?)`,
            [
              matchType,
              match.player1,
              match.player2,
              `${score1} - ${score2}`,
              winner,
            ]
          );
        } catch (error) {}

        // Vérifier si tous les matches du round actuel sont terminés
        const allRoundFinished = tournament.matches.every(
          (m) => m.status === "finished" && m.winner
        );

        if (allRoundFinished && tournament.state === "running") {
          tournament.state = "completed_round";
        }
      } else {
        // Match en cours, pas de gagnant encore
        match.status = "playing";
      }

      broadcastTournamentUpdate();
      return true;
    }

    return false;
  }

  function broadcastToGameRoom(roomId, message) {
    const connections = gameRoomConnections.get(roomId);
    if (!connections) {
      //console.warn(`⚠️ Aucune connexion trouvée pour room ${roomId}`);
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

    if (type === "tournament") {
      handleTournamentConnection(conn, clientId);
    } else {
      handleGameConnection(conn, clientId);
    }
  });

  // ===== GESTION CONNEXIONS TOURNOI =====
  function handleTournamentConnection(conn, clientId) {
    tournamentClients.add(conn);
    try {
      if (!fastify.tournaments) {
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
    });

    conn.on("error", (error) => {
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
  
        case "chatMatch":
          fastify.createRoom(msg.roomId);
          break;
  
        case "leaveRoom":
          handleLeaveRoom(msg);
          break;
  
        default:
          console.log("Type de message non géré:", msg.type);
      }
    });
  
    function handleLeaveRoom(msg) {
      console.log("👋 handleLeaveRoom reçu", msg);
      const room = gameRoomConnections.get(msg.roomId);
      if (!room) {
        console.warn(`⚠️ Room ${msg.roomId} non trouvée`);
        return;
      }
      let removed = false;
      let leavingPlayerName = null;

      for (const c of room) {
        console.log(
          "🔍 Vérification connexion dans room",
          c.playerNumber,
          msg.playerNumber
        );
        if (c.playerNumber === msg.playerNumber) {
          removed = true;
          leavingPlayerName =
          c.playerName || msg.playerName || `Joueur${c.playerNumber}`;
          room.delete(c);
          try {
            c.close();
            console.log(`❌ Fermeture connexion du joueur ${msg.playerNumber}`);
          } catch (err) {}
        }
      }
      if (!removed) console.warn("⚠️ Joueur non trouvé dans la room");

      // Si l’autre joueur reste, il gagne
      if (room.size === 1) {
        const winnerConn = Array.from(room)[0];
        console.log(
          `🏆 L'autre joueur (${winnerConn.playerName}) gagne automatiquement`
        );
        fastify.updateMatchScore(
          msg.roomId,
          winnerConn.playerName,
          leavingPlayerName,
          11,
          0,
          winnerConn.playerName
        );

        winnerConn.send(
          JSON.stringify({
            type: "gameEnd",
            winner: winnerConn.playerName,
            scoreP1: 11,
            scoreP2: 0,
          })
        );

        gameRoomConnections.delete(msg.roomId);
      } else if (room.size === 0) {
        console.log(`🗑️ Room ${msg.roomId} vide, suppression`);
        gameRoomConnections.delete(msg.roomId);
      }
    }

    function handleJoinRoom(msg) {
      const { connectionId, playerName: msgPlayerName, roomId } = msg;
      playerName = msgPlayerName || connectionId;
      const isDashboardConnection =
        connectionId && connectionId.startsWith("dashboard-");

      if (isDashboardConnection) {
        handleDashboardJoinRoom(msg);
      } else {
        handleTournamentJoinRoom(msg);
      }
    }

    function handleDashboardJoinRoom(msg) {
      const { playerName: msgPlayerName, roomId } = msg;

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
            break;
          }
        }

        if (availableRoom) {
          targetRoomId = availableRoom;
        } else {
          // Créer une nouvelle room seulement si aucune n'est disponible
          if (fastify.createRoom) {
            targetRoomId = fastify.createRoom();
          } else {
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

      if (fastify.handlePlayerConnection) {
        fastify.handlePlayerConnection(joinedRoom, playerNumber, playerName);
      }

      // Envoyer l'assignation avec le nom du joueur
      conn.send(
        JSON.stringify({
          type: "assign",
          player: playerNumber,
          roomId: joinedRoom,
          playerName: playerName, 
        })
      );

      if (playerNumber === 1) {
        conn.send(
          JSON.stringify({
            type: "waiting",
            message: "En attente du second joueur...",
            playersCount: 1,
            maxPlayers: 2,
          })
        );
      } else if (playerNumber === 2) {
        const roomStatus = fastify.getRoomStatus
          ? fastify.getRoomStatus(joinedRoom)
          : null;
        const playersNames = roomStatus ? roomStatus.players : {};

        setTimeout(() => {
          broadcastToGameRoom(joinedRoom, {
            type: "gameReady",
            message: "Tous les joueurs sont connectés! La partie commence...",
            playersCount: 2,
            maxPlayers: 2,
            players: playersNames, 
          });

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
      }
    }

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
    }

    function handleScoreUpdate(msg) {
      const { roomId, scoreP1, scoreP2 } = msg;

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
      }
    }

  function handleDisconnection() {
    const roomId = conn.roomId;
    console.log("🔌 handleDisconnection appelé", {
      roomId,
      playerName: conn.playerName,
      playerNumber: conn.playerNumber,
    });

    if (!roomId) return;

    const connections = gameRoomConnections.get(roomId);
    if (!connections) {
      console.log("⚠️ Pas de room trouvée pour cette connexion", roomId);
      return;
    }

    connections.delete(conn);
    console.log(`📤 Connexion supprimée de la room ${roomId}`, {
      remainingPlayers: connections.size,
    });

    if (connections.size === 0) {
      console.log(`🗑️ Room ${roomId} vide → suppression`);
      gameRoomConnections.delete(roomId);
      return;
    }

    if (connections.size === 1) {
      const winnerConn = Array.from(connections)[0];
      console.log(
        `🏆 Un joueur reste → victoire automatique: ${winnerConn.playerName}`
      );

      try {
        fastify.updateMatchScore(
          roomId,
          winnerConn.playerName,
          conn.playerName || "opponent",
          11,
          0,
          winnerConn.playerName
        );
        winnerConn.send(
          JSON.stringify({
            type: "gameEnd",
            winner: winnerConn.playerName,
            scoreP1: 11,
            scoreP2: 0,
          })
        );
      } catch (e) {
        console.error("❌ Erreur envoi gameEnd:", e.message);
      }

      console.log(`🗑️ Room ${roomId} supprimée après victoire automatique`);
      gameRoomConnections.delete(roomId);
    }

    if (fastify.handlePlayerDisconnection && conn.playerNumber) {
      console.log(
        `🔔 Appel hook handlePlayerDisconnection pour player ${conn.playerNumber}`
      );
      fastify.handlePlayerDisconnection(roomId, conn.playerNumber);
    }
  }
  conn.on("close", () => handleDisconnection());
  conn.on("error", () => handleDisconnection()); 
}


  // ===== EXPOSER LES FONCTIONS AVEC LOGS DE CONFIRMATION =====

  fastify.decorate("updateMatchScore", updateMatchScore);
  fastify.decorate("broadcastToGameRoom", broadcastToGameRoom);
  fastify.decorate("broadcastTournamentUpdate", broadcastTournamentUpdate);
}

export default fastifyPlugin(websocketHandler, {
  name: "websocket-handler",
});
