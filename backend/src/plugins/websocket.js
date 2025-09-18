import websocketPlugin from "@fastify/websocket";
import fastifyPlugin from "fastify-plugin";
import crypto from "crypto";
import { openDbHistory } from "../utils/db.js";

async function websocketHandler(fastify) {
	await fastify.register(websocketPlugin);

	const gameRoomConnections = new Map(); // roomId -> Set<WebSocket>
	const tournamentClients = new Set();

	// initialize tournaments map if missing
	if (!fastify.tournaments) {
		fastify.decorate("tournaments", new Map());
	}

	// send tournament state to all clients
	function broadcastTournamentUpdate() {
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

		const payload = JSON.stringify({ type: "update", data: tournamentData });

		for (const socket of tournamentClients) {
			if (socket && socket.readyState === 1) {
				try {
					socket.send(payload);
				} catch {
					tournamentClients.delete(socket);
				}
			} else {
				tournamentClients.delete(socket);
			}
		}
	}

	// save scores in history and update tournament matches
	async function updateMatchScore(roomId, P1Name, P2Name, scoreP1, scoreP2, winner = null) {
		const db = await openDbHistory();
		if (!roomId || P1Name === undefined || P2Name === undefined) return false;

		const tournament = fastify.tournaments.get("default");
		const score1 = parseInt(scoreP1) || 0;
		const score2 = parseInt(scoreP2) || 0;

		// determine winner if not provided
		if (!winner) {
			if (score1 >= 11 && score1 - score2 >= 2) winner = P1Name;
			else if (score2 >= 11 && score2 - score1 >= 2) winner = P2Name;
		}

		// simple match (no tournament)
		if (!tournament) {
			if (winner) {
				await db.run(
					`INSERT OR IGNORE INTO history
					(type, player_1, player_2, scores, winner)
					VALUES (?, ?, ?, ?, ?)`,
					["match", P1Name, P2Name, `${score1} - ${score2}`, winner]
				);
			}
			return true;
		}

		// tournament match
		const match = tournament.matches?.find((m) => m.roomId === roomId);
		if (!match) return false;

		match.scoreP1 = score1;
		match.scoreP2 = score2;

		if (winner) {
			match.winner = winner;
			match.status = "finished";

			let matchType = "tournament match";
			const totalPlayers = tournament.players.length;
			const finalRound = Math.ceil(Math.log2(totalPlayers));
			if (tournament.round >= finalRound) matchType = "tournament final";

			await db.run(
				`INSERT OR IGNORE INTO history
				(type, player_1, player_2, scores, winner)
				VALUES (?, ?, ?, ?, ?)`,
				[matchType, match.player1, match.player2, `${score1} - ${score2}`, winner]
			);

			const allRoundFinished = tournament.matches.every(
				(m) => m.status === "finished" && m.winner
			);
			if (allRoundFinished && tournament.state === "running") {
				tournament.state = "completed_round";
			}
		} else {
			match.status = "playing";
		}

		broadcastTournamentUpdate();
		return true;
	}

	// broadcast message to all sockets in a game room
	function broadcastToGameRoom(roomId, message) {
		const connections = gameRoomConnections.get(roomId);
		if (!connections) return;

		const messageStr = JSON.stringify(message);
		for (const conn of connections) {
			if (conn.readyState === 1) {
				try {
					conn.send(messageStr);
				} catch {
					connections.delete(conn);
				}
			} else {
				connections.delete(conn);
			}
		}
	}

	// unified WebSocket handler
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

	// handle tournament clients
	function handleTournamentConnection(conn) {
		tournamentClients.add(conn);

		const tournament = fastify.tournaments.get("default");
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

		conn.send(JSON.stringify({ type: "update", data: initialData }));

		conn.on("close", () => {
			tournamentClients.delete(conn);
		});
		conn.on("error", () => {
			tournamentClients.delete(conn);
		});
	}

	// handle game clients (dashboard/tournament matches)
	function handleGameConnection(conn) {
		let joinedRoom = null;
		let playerNumber = 0;

		conn.on("message", (message) => {
			let msg;
			try {
				msg = JSON.parse(message.toString());
			} catch {
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
					break;
			}
		});

		// join room handler
		function handleJoinRoom(msg) {
			const { roomId } = msg;
			joinedRoom = roomId || fastify.createRoom?.();

			if (!gameRoomConnections.has(joinedRoom)) {
				gameRoomConnections.set(joinedRoom, new Set());
			}

			const roomConnections = gameRoomConnections.get(joinedRoom);
			playerNumber = roomConnections.size + 1;
			if (playerNumber > 2) {
				conn.send(JSON.stringify({ type: "error", message: "Room full" }));
				return;
			}

			roomConnections.add(conn);
			conn.roomId = joinedRoom;
			conn.playerNumber = playerNumber;

			// assign player
			conn.send(JSON.stringify({ type: "assign", player: playerNumber, roomId: joinedRoom }));

			// notify when 2 players ready
			if (playerNumber === 2) {
				broadcastToGameRoom(joinedRoom, {
					type: "gameReady",
					message: "Players ready, game starting...",
					// players: 
					playersCount: 2,
					maxPlayers: 2,
				});
			}
		}

		// update scores
		function handleScoreUpdate(msg) {
			const { roomId, scoreP1, scoreP2 } = msg;
			updateMatchScore(roomId, scoreP1, scoreP2).then((updated) => {
				if (updated) {
					broadcastToGameRoom(roomId, {
						type: "scoreUpdate",
						scoreP1: parseInt(scoreP1) || 0,
						scoreP2: parseInt(scoreP2) || 0,
					});
				}
			});
		}

		// end game
		function handleGameEnd(msg) {
			const { roomId, winner, scoreP1, scoreP2 } = msg;
			if (!winner || !roomId) return;

			updateMatchScore(roomId, scoreP1, scoreP2, winner).then((updated) => {
				if (updated) {
					broadcastToGameRoom(roomId, {
						type: "gameEnd",
						winner,
						scoreP1: parseInt(scoreP1) || 0,
						scoreP2: parseInt(scoreP2) || 0,
					});

					// cleanup room after delay
					setTimeout(() => {
						const connections = gameRoomConnections.get(roomId);
						if (connections) {
							for (const conn of connections) {
								if (conn.readyState === 1) conn.close();
							}
							gameRoomConnections.delete(roomId);
						}
					}, 3000);
				}
			});
		}

		// relay player inputs to game server
		function handleInput(msg) {
			const effectivePlayerNumber = msg.playerNumber || conn.playerNumber || playerNumber;
			if (fastify.handleGameInput && joinedRoom && effectivePlayerNumber) {
				fastify.handleGameInput(joinedRoom, effectivePlayerNumber, msg);
			}
		}

		conn.on("close", () => handleDisconnection());
		conn.on("error", () => handleDisconnection());

		// cleanup on disconnect
		function handleDisconnection() {
			if (conn.roomId && conn.playerNumber && fastify.handlePlayerDisconnection) {
				fastify.handlePlayerDisconnection(conn.roomId, conn.playerNumber);
			}
			for (const [roomId, connections] of gameRoomConnections.entries()) {
				if (connections.has(conn)) {
					connections.delete(conn);
					if (connections.size === 0) gameRoomConnections.delete(roomId);
				}
			}
		}
	}

	// expose helpers
	fastify.decorate("updateMatchScore", updateMatchScore);
	fastify.decorate("broadcastToGameRoom", broadcastToGameRoom);
	fastify.decorate("broadcastTournamentUpdate", broadcastTournamentUpdate);
}

export default fastifyPlugin(websocketHandler, { name: "websocket-handler" });
