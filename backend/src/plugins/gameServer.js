// 🎮 Game server with 2-player waiting system
import crypto from "crypto";
import fp from "fastify-plugin";

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const MAX_SCORE = 11;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default fp(async function (fastify) {
	const rooms = new Map();

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	// create a new room
	function createRoom(forcedId = null) {
		const roomId = forcedId || crypto.randomUUID().slice(0, 8);

		if (rooms.has(roomId)) {
			const oldRoom = rooms.get(roomId);
			if (oldRoom.loop) clearInterval(oldRoom.loop);
			rooms.delete(roomId);
			console.log(`🧹 Old room ${roomId} cleared`);
		}

		const gameState = {
			ball: { x: 0, z: 0, dx: 0.05, dz: 0.1 },
			paddleOne: { x: 0 },
			paddleTwo: { x: 0 },
			score: { p1: 0, p2: 0 },
			gameEnded: false,
			winner: null,
			players: new Map(),
			playersReady: 0,
			gameActive: false,
		};

		const room = {
			gameState,
			roomId,
			lastUpdateTime: Date.now(),
			loop: null,
		};

		rooms.set(roomId, room);
		console.log(`✅ Room ${roomId} created, waiting for players`);

		return roomId;
	}

	// start main game loop
	function startGameLoop(roomId) {
		const room = rooms.get(roomId);
		if (!room || room.loop) return;

		room.gameState.gameActive = true;
		room.loop = setInterval(() => updateRoom(roomId), 1000 / 60);
		console.log(`🚀 Game loop started for ${roomId}`);
	}

	// stop main game loop
	function stopGameLoop(roomId) {
		const room = rooms.get(roomId);
		if (!room || !room.loop) return;

		clearInterval(room.loop);
		room.loop = null;
		room.gameState.gameActive = false;
		console.log(`⏹️ Game loop stopped for ${roomId}`);
	}

	// update game state (ball, paddles, score, broadcast)
	function updateRoom(roomId) {
		const room = rooms.get(roomId);
		if (!room) return;
		const gs = room.gameState;

		if (!gs.gameActive || gs.gameEnded || gs.playersReady < 2) return;

		gs.ball.x += gs.ball.dx;
		gs.ball.z += gs.ball.dz;

		gs.paddleOne.x = clamp(gs.paddleOne.x, -FIELD_WIDTH / 2 + 1, FIELD_WIDTH / 2 - 1);
		gs.paddleTwo.x = clamp(gs.paddleTwo.x, -FIELD_WIDTH / 2 + 1, FIELD_WIDTH / 2 - 1);

		if (gs.ball.x <= -FIELD_WIDTH / 2 || gs.ball.x >= FIELD_WIDTH / 2) gs.ball.dx *= -1;

		// collision with paddles
		if (
			gs.ball.z <= -FIELD_DEPTH / 2 + 0.5 &&
			gs.ball.z >= -FIELD_DEPTH / 2 - 0.5 &&
			Math.abs(gs.ball.x - gs.paddleOne.x) < 1.1
		) {
			gs.ball.z = -FIELD_DEPTH / 2 + 0.5;
			gs.ball.dz = Math.abs(gs.ball.dz);
		}
		if (
			gs.ball.z >= FIELD_DEPTH / 2 - 0.5 &&
			gs.ball.z <= FIELD_DEPTH / 2 + 0.5 &&
			Math.abs(gs.ball.x - gs.paddleTwo.x) < 1.1
		) {
			gs.ball.z = FIELD_DEPTH / 2 - 0.5;
			gs.ball.dz = -Math.abs(gs.ball.dz);
		}

		// scoring
		let pointScored = false;
		let scoringPlayer = null;
		if (gs.ball.z <= -FIELD_DEPTH / 2 - 0.5) {
			gs.score.p2++;
			scoringPlayer = 2;
			pointScored = true;
			console.log(`🎯 Point for P2! ${gs.score.p1}-${gs.score.p2}`);
		} else if (gs.ball.z >= FIELD_DEPTH / 2 + 0.5) {
			gs.score.p1++;
			scoringPlayer = 1;
			pointScored = true;
			console.log(`🎯 Point for P1! ${gs.score.p1}-${gs.score.p2}`);
		}

		if (pointScored) {
			gs.ball.x = 0;
			gs.ball.z = 0;
			gs.ball.dx = (Math.random() - 0.5) * 0.1;
			gs.ball.dz = scoringPlayer === 1 ? 0.1 : -0.1;

			if (fastify.updateMatchScore) {
				const player1Name = gs.players.get(1) || "Player1";
				const player2Name = gs.players.get(2) || "Player2";
				fastify.updateMatchScore(roomId, player1Name, player2Name, gs.score.p1, gs.score.p2);
			}

			if (gs.score.p1 >= MAX_SCORE || gs.score.p2 >= MAX_SCORE) {
				endGame(room, scoringPlayer);
				return;
			}
		}

		// broadcast state
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

	// end game and cleanup
	function endGame(room, winningPlayerNumber) {
		const gs = room.gameState;
		gs.gameEnded = true;
		gs.gameActive = false;
		gs.winner = winningPlayerNumber;

		const winnerName = gs.players.get(winningPlayerNumber) || `Player${winningPlayerNumber}`;
		const loserNumber = winningPlayerNumber === 1 ? 2 : 1;
		const loserName = gs.players.get(loserNumber) || `Player${loserNumber}`;

		console.log(
			`🏁 Game over ${room.roomId}: ${winnerName} beat ${loserName} ${gs.score.p1}-${gs.score.p2}`
		);

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

		stopGameLoop(room.roomId);
		setTimeout(() => {
			rooms.delete(room.roomId);
			console.log(`🗑️ Room ${room.roomId} deleted`);
		}, 5000);
	}

	// ensure a room exists and configure players
	function ensureRoom(roomId, player1Name, player2Name) {
		if (!rooms.has(roomId)) createRoom(roomId);
		const room = rooms.get(roomId);

		if (player1Name) room.gameState.players.set(1, player1Name);
		if (player2Name) room.gameState.players.set(2, player2Name);
		room.gameState.playersReady = room.gameState.players.size;

		console.log(
			`🎮 Room ${roomId}: ${player1Name || "Player1"} vs ${player2Name || "Player2"} (${room.gameState.playersReady}/2)`
		);

		if (room.gameState.playersReady >= 2 && !room.loop) startGameLoop(roomId);
		return room;
	}

	// player joins
	function handlePlayerConnection(roomId, playerNumber, playerName) {
		const room = rooms.get(roomId);
		if (!room) return false;

		room.gameState.players.set(playerNumber, playerName);
		room.gameState.playersReady = room.gameState.players.size;
		console.log(`👋 Player ${playerNumber} (${playerName}) joined ${roomId}`);

		if (room.gameState.playersReady >= 2 && !room.loop) {
			setTimeout(() => startGameLoop(roomId), 1000);
		}
		return true;
	}

	// player leaves
	function handlePlayerDisconnection(roomId, playerNumber) {
		const room = rooms.get(roomId);
		if (!room) return;

		room.gameState.players.delete(playerNumber);
		room.gameState.playersReady = room.gameState.players.size;
		console.log(`👋 Player ${playerNumber} left ${roomId}`);

		if (room.gameState.playersReady < 2) stopGameLoop(roomId);
	}

	// handle player input
	function handleGameInput(roomId, playerNumber, inputMsg) {
		const room = rooms.get(roomId);
		if (!room || !room.gameState.gameActive || room.gameState.gameEnded) return;
		if (room.gameState.playersReady < 2) return;

		const actualPlayerNumber = inputMsg.playerNumber || playerNumber;
		if (actualPlayerNumber !== 1 && actualPlayerNumber !== 2) return;

		const paddle =
			actualPlayerNumber === 1 ? room.gameState.paddleOne : room.gameState.paddleTwo;
		const SPEED = 0.3;

		if (inputMsg.left) paddle.x = Math.max(paddle.x - SPEED, -FIELD_WIDTH / 2 + 1);
		if (inputMsg.right) paddle.x = Math.min(paddle.x + SPEED, FIELD_WIDTH / 2 - 1);
	}

	// get status of all rooms
	function getAllRoomsStatus() {
		return Array.from(rooms.entries()).map(([roomId, room]) => ({
			roomId,
			score: { ...room.gameState.score },
			gameEnded: room.gameState.gameEnded,
			gameActive: room.gameState.gameActive,
			playersReady: room.gameState.playersReady,
			winner: room.gameState.winner,
			players: Object.fromEntries(room.gameState.players),
			lastUpdate: room.lastUpdateTime,
		}));
	}

	// get status of one room
	function getRoomStatus(roomId) {
		const room = rooms.get(roomId);
		if (!room) return null;

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

	// expose functions
	fastify.decorate("createRoom", createRoom);
	fastify.decorate("ensureRoom", ensureRoom);
	fastify.decorate("handleGameInput", handleGameInput);
	fastify.decorate("getRoomStatus", getRoomStatus);
	fastify.decorate("getAllRoomsStatus", getAllRoomsStatus);
	fastify.decorate("handlePlayerConnection", handlePlayerConnection);
	fastify.decorate("handlePlayerDisconnection", handlePlayerDisconnection);

	// cleanup on server shutdown
	fastify.addHook("onClose", async () => {
		console.log("🧹 Cleaning game rooms...");
		for (const [roomId, room] of rooms.entries()) {
			if (room.loop) clearInterval(room.loop);
		}
		rooms.clear();
		console.log("✅ Game server cleaned");
	});

	console.log("🎮 Game server initialized (waiting for 2 players)");
});
