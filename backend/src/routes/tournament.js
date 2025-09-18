export default async function tournamentRoutes(fastify) {
	// Create a fresh tournament object
	function createFreshTournament() {
		return {
			players: [],
			state: "waiting",
			round: 0,
			matches: [],
			qualified: [],
			winner: null,
		};
	}

	// Initialize tournaments map if not present
	if (!fastify.tournaments) {
		fastify.decorate("tournaments", new Map());
	}

	// Join tournament
	fastify.post("/api/tournament/join", async (req, reply) => {
		try {
			const user = req.session?.get("user");
			if (!user) return reply.code(401).send({ error: "Not authenticated" });

			const tournamentId = "default";
			if (!fastify.tournaments.has(tournamentId)) {
				fastify.tournaments.set(tournamentId, createFreshTournament());
			}

			const tournament = fastify.tournaments.get(tournamentId);
			const playerName = user.name || user.email || `Player${user.id.slice(0, 4)}`;
			const existingPlayer = tournament.players.find(
				(p) => p.id === user.id || p.name === playerName
			);

			if (!existingPlayer) {
				tournament.players.push({ id: user.id, name: playerName });
				if (fastify.broadcastTournamentUpdate) fastify.broadcastTournamentUpdate();
			}

			return reply.send({
				success: true,
				player: { id: user.id, name: playerName },
				tournament: {
					playersCount: tournament.players.length,
					state: tournament.state,
					players: tournament.players,
				},
			});
		} catch (error) {
			return reply.code(500).send({ error: "Server error during join" });
		}
	});

	// Start tournament
	fastify.post("/api/tournament/start", async (req, reply) => {
		try {
			const tournament = fastify.tournaments.get("default");
			if (!tournament) return reply.code(404).send({ error: "No tournament found" });
			if (tournament.players.length < 2)
				return reply.code(400).send({ error: "Minimum 2 players required" });
			if (tournament.state !== "waiting")
				return reply.code(400).send({ error: "Tournament already running" });

			tournament.state = "running";
			tournament.round = 1;
			tournament.matches = [];
			tournament.qualified = [];
			tournament.winner = null;

			const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5);
			for (let i = 0; i < shuffledPlayers.length; i += 2) {
				const player1 = shuffledPlayers[i];
				const player2 = shuffledPlayers[i + 1];
				if (!player2) {
					tournament.qualified.push(player1);
					continue;
				}
				const roomId = fastify.createRoom ? fastify.createRoom() : `room-${Date.now()}-${i}`;
				tournament.matches.push({
					roomId,
					player1: player1.name,
					player2: player2.name,
					winner: null,
					scoreP1: 0,
					scoreP2: 0,
					status: "playing",
				});
			}

			if (fastify.broadcastTournamentUpdate) fastify.broadcastTournamentUpdate();

			return reply.send({
				success: true,
				started: true,
				round: tournament.round,
				matchesCount: tournament.matches.length,
				qualifiedCount: tournament.qualified.length,
			});
		} catch {
			return reply.code(500).send({ error: "Server error during start" });
		}
	});

	// Next round
	fastify.post("/api/tournament/next", async (req, reply) => {
		try {
			const tournament = fastify.tournaments.get("default");
			if (!tournament) return reply.code(404).send({ error: "No active tournament" });

			const allMatchesFinished = tournament.matches?.every(
				(match) => match.status === "finished" && match.winner
			);

			if (tournament.state === "running" && !allMatchesFinished)
				return reply.code(400).send({ error: "Some matches still in progress" });

			if (tournament.state === "running" && allMatchesFinished) tournament.state = "completed_round";

			const roundWinners = tournament.matches
				.filter((m) => m.winner)
				.map((m) => tournament.players.find((p) => p.name === m.winner))
				.filter(Boolean);

			const allQualified = [...roundWinners, ...(tournament.qualified || [])];

			if (allQualified.length === 0) return reply.code(400).send({ error: "No qualified players found" });
			if (allQualified.length === 1) {
				tournament.state = "completed";
				tournament.winner = allQualified[0];
				if (fastify.broadcastTournamentUpdate) fastify.broadcastTournamentUpdate();
				return reply.send({ success: true, finished: true, winner: tournament.winner });
			}

			tournament.round += 1;
			tournament.matches = [];
			tournament.qualified = [];
			tournament.state = "running";

			const shuffledQualified = [...allQualified].sort(() => Math.random() - 0.5);
			for (let i = 0; i < shuffledQualified.length; i += 2) {
				const player1 = shuffledQualified[i];
				const player2 = shuffledQualified[i + 1];
				if (!player2) {
					tournament.qualified.push(player1);
					continue;
				}
				const roomId = fastify.createRoom ? fastify.createRoom() : `room-${Date.now()}-${i}`;
				tournament.matches.push({
					roomId,
					player1: player1.name,
					player2: player2.name,
					winner: null,
					scoreP1: 0,
					scoreP2: 0,
					status: "playing",
				});
			}

			if (fastify.broadcastTournamentUpdate) fastify.broadcastTournamentUpdate();

			return reply.send({
				success: true,
				started: true,
				round: tournament.round,
				matchesCount: tournament.matches.length,
				qualifiedCount: tournament.qualified.length,
			});
		} catch {
			return reply.code(500).send({ error: "Server error during next round" });
		}
	});

	// Reset tournament
	fastify.post("/api/tournament/new", async (req, reply) => {
		try {
			if (fastify.connectedClients) {
				for (const [, ws] of fastify.connectedClients.entries()) ws.close(4000, "Tournament reset");
				fastify.connectedClients.clear();
			}
			if (fastify.rooms) fastify.rooms.clear();
			if (fastify.playerMap) fastify.playerMap.clear();
			if (fastify.matchStates) fastify.matchStates.clear();

			const freshTournament = createFreshTournament();
			fastify.tournaments.set("default", freshTournament);

			if (fastify.broadcastTournamentUpdate) fastify.broadcastTournamentUpdate();

			return reply.send({
				success: true,
				message: "Tournament reset successfully",
				tournament: {
					players: freshTournament.players,
					state: freshTournament.state,
					round: freshTournament.round,
				},
			});
		} catch {
			return reply.code(500).send({ error: "Server error during reset" });
		}
	});

	// Get tournament status
	fastify.get("/api/tournament/status", async (req, reply) => {
		try {
			const tournament = fastify.tournaments.get("default");
			if (!tournament) return reply.send({ exists: false, message: "No active tournament" });

			return reply.send({
				exists: true,
				state: tournament.state,
				round: tournament.round,
				playersCount: tournament.players.length,
				matchesCount: tournament.matches.length,
				qualifiedCount: tournament.qualified?.length || 0,
				winner: tournament.winner,
				players: tournament.players.map((p) => ({ id: p.id, name: p.name })),
				matches: tournament.matches.map((m) => ({
					roomId: m.roomId,
					player1: m.player1,
					player2: m.player2,
					winner: m.winner,
					scoreP1: m.scoreP1,
					scoreP2: m.scoreP2,
					status: m.status,
				})),
			});
		} catch {
			return reply.code(500).send({ error: "Server error" });
		}
	});

	// Force broadcast update
	fastify.post("/api/tournament/refresh", async (req, reply) => {
		try {
			if (fastify.broadcastTournamentUpdate) {
				fastify.broadcastTournamentUpdate();
				return reply.send({ success: true, message: "Update broadcasted" });
			} else return reply.code(500).send({ error: "Broadcast service unavailable" });
		} catch {
			return reply.code(500).send({ error: "Server error during refresh" });
		}
	});
}
