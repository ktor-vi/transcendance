// 🏆 SERVEUR DE TOURNOI CORRIGÉ - FIX RESET JOUEURS
export default async function tournamentRoutes(fastify) {
  // 🔧 FONCTION POUR CRÉER UN TOURNOI PROPRE
  function createFreshTournament() {
    return {
      players: [], // ⚠️ IMPORTANT: Nouveau tableau à chaque fois
      state: "waiting",
      round: 0,
      matches: [], // ⚠️ IMPORTANT: Nouveau tableau à chaque fois
      qualified: [], // ⚠️ IMPORTANT: Nouveau tableau à chaque fois
      winner: null,
    };
  }

  // Initialiser les tournois si ce n'est pas déjà fait
  if (!fastify.tournaments) {
    fastify.decorate("tournaments", new Map());
  }

  // ===== ROUTES API =====

  fastify.post("/api/tournament/join", async (req, reply) => {
    try {
      const user = req.session?.get("user");
      if (!user) {
        return reply.code(401).send({ error: "Non authentifié" });
      }

      const tournamentId = "default";
      console.log("🔍 État avant inscription:", {
        tournamentsExists: !!fastify.tournaments,
        tournamentCount: fastify.tournaments ? fastify.tournaments.size : "N/A",
        broadcastAvailable: !!fastify.broadcastTournamentUpdate,
      });

      // 🔧 FIX: Créer le tournoi avec une fonction qui retourne de nouveaux objets
      if (!fastify.tournaments.has(tournamentId)) {
        const newTournament = createFreshTournament();
        fastify.tournaments.set(tournamentId, newTournament);
        console.log(
          "🏗️ Nouveau tournoi 'default' créé avec des tableaux frais"
        );
      }

      const tournament = fastify.tournaments.get(tournamentId);
      console.log("🔍 Tournoi récupéré:", {
        found: !!tournament,
        playersCount: tournament?.players?.length || 0,
        currentPlayers: tournament?.players?.map((p) => p.name) || [],
      });

      // Éviter les doublons
      const playerName =
        user.name || user.email || `Player${user.id.slice(0, 4)}`;
      const existingPlayer = tournament.players.find(
        (p) => p.id === user.id || p.name === playerName
      );

      if (!existingPlayer) {
        const playerData = {
          id: user.id,
          name: playerName,
        };
        tournament.players.push(playerData);

        console.log(
          `✅ NOUVEAU JOUEUR AJOUTÉ: ${playerData.name} (ID: ${playerData.id})`
        );
        console.log(`📊 Total joueurs: ${tournament.players.length}`);
        console.log(
          "🗂️ Liste complète:",
          tournament.players.map((p) => p.name)
        );

        // Diffuser la mise à jour
        if (fastify.broadcastTournamentUpdate) {
          try {
            fastify.broadcastTournamentUpdate();
            console.log("✅ Diffusion réussie");
          } catch (error) {
            console.error("❌ Erreur lors de la diffusion:", error);
          }
        } else {
          console.error("❌ broadcastTournamentUpdate non disponible!");
        }
      } else {
        console.log(`ℹ️ Joueur déjà inscrit: ${existingPlayer.name}`);
      }

      return reply.send({
        success: true,
        player: {
          id: user.id,
          name: playerName,
        },
        tournament: {
          playersCount: tournament.players.length,
          state: tournament.state,
          players: tournament.players,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription:", error);
      return reply
        .code(500)
        .send({ error: "Erreur serveur lors de l'inscription" });
    }
  });

  fastify.post("/api/tournament/start", async (req, reply) => {
    try {
      const tournament = fastify.tournaments.get("default");

      if (!tournament) {
        return reply.code(404).send({ error: "Aucun tournoi trouvé" });
      }

      if (tournament.players.length < 2) {
        return reply
          .code(400)
          .send({ error: "Minimum 2 joueurs requis pour démarrer" });
      }

      if (tournament.state !== "waiting") {
        return reply
          .code(400)
          .send({ error: `Tournoi déjà en cours (état: ${tournament.state})` });
      }

      console.log(
        `🚀 Démarrage du tournoi avec ${tournament.players.length} joueurs`
      );

      // Initialiser le tournoi
      tournament.state = "running";
      tournament.round = 1;
      tournament.matches = []; // 🔧 FIX: Nouveau tableau
      tournament.qualified = []; // 🔧 FIX: Nouveau tableau
      tournament.winner = null;

      // Mélanger les joueurs pour un appariement aléatoire
      const shuffledPlayers = [...tournament.players].sort(
        () => Math.random() - 0.5
      );

      // Créer les matchs du premier round
      for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];

        if (!player2) {
          // Joueur impair, qualifié automatiquement
          tournament.qualified.push(player1);
          console.log(
            `⭐ ${player1.name} qualifié automatiquement (nombre impair)`
          );
          continue;
        }

        // Créer une room de jeu
        const roomId = fastify.createRoom
          ? fastify.createRoom()
          : `room-${Date.now()}-${i}`;

        const match = {
          roomId,
          player1: player1.name,
          player2: player2.name,
          winner: null,
          scoreP1: 0,
          scoreP2: 0,
          status: "playing",
        };

        tournament.matches.push(match);
        console.log(
          `🎮 Match créé: ${player1.name} vs ${player2.name} (Room: ${roomId})`
        );
      }

      // Diffuser la mise à jour
      if (fastify.broadcastTournamentUpdate) {
        fastify.broadcastTournamentUpdate();
      }

      return reply.send({
        success: true,
        started: true,
        round: tournament.round,
        matchesCount: tournament.matches.length,
        qualifiedCount: tournament.qualified.length,
      });
    } catch (error) {
      console.error("Erreur lors du démarrage du tournoi:", error);
      return reply
        .code(500)
        .send({ error: "Erreur serveur lors du démarrage" });
    }
  });

  fastify.post("/api/tournament/next", async (req, reply) => {
    try {
      const tournament = fastify.tournaments.get("default");

      if (!tournament) {
        return reply.code(404).send({ error: "Aucun tournoi actif" });
      }

      // 🔧 FIX: Permettre à tout joueur de lancer le round suivant
      // Vérifier si tous les matchs sont terminés plutôt que l'état exact
      const allMatchesFinished =
        tournament.matches && tournament.matches.length > 0
          ? tournament.matches.every(
              (match) => match.status === "finished" && match.winner
            )
          : false;

      if (tournament.state === "running" && !allMatchesFinished) {
        return reply.code(400).send({
          error: `Des matchs sont encore en cours. Attendez que tous les matchs soient terminés.`,
          finishedMatches: tournament.matches.filter(
            (m) => m.status === "finished"
          ).length,
          totalMatches: tournament.matches.length,
        });
      }

      if (
        tournament.state !== "completed_round" &&
        tournament.state !== "running"
      ) {
        return reply.code(400).send({
          error: `Impossible de passer au round suivant (état actuel: ${tournament.state})`,
        });
      }

      // 🔧 AUTO-COMPLETION: Si tous les matchs sont finis mais état pas mis à jour
      if (tournament.state === "running" && allMatchesFinished) {
        tournament.state = "completed_round";
        console.log(
          "🔄 État automatiquement mis à jour vers 'completed_round'"
        );
      }

      console.log(
        `🔄 Passage au round suivant (round ${tournament.round + 1})`
      );

      // Collecter tous les gagnants du round précédent
      const roundWinners = tournament.matches
        .filter((match) => match.winner)
        .map((match) =>
          tournament.players.find((player) => player.name === match.winner)
        )
        .filter(Boolean);

      // Ajouter les joueurs automatiquement qualifiés
      const allQualified = [...roundWinners, ...(tournament.qualified || [])];

      console.log(
        `Joueurs qualifiés:`,
        allQualified.map((p) => p.name)
      );

      // Vérifier les conditions de fin
      if (allQualified.length === 0) {
        return reply.code(400).send({ error: "Aucun joueur qualifié trouvé" });
      }

      if (allQualified.length === 1) {
        // Tournoi terminé - nous avons un gagnant !
        tournament.state = "completed";
        tournament.winner = allQualified[0];

        console.log(`🏆 TOURNOI TERMINÉ! Gagnant: ${tournament.winner.name}`);

        if (fastify.broadcastTournamentUpdate) {
          fastify.broadcastTournamentUpdate();
        }

        return reply.send({
          success: true,
          finished: true,
          winner: tournament.winner,
        });
      }

      // Préparer le round suivant
      tournament.round += 1;
      tournament.matches = []; // 🔧 FIX: Nouveau tableau
      tournament.qualified = []; // 🔧 FIX: Nouveau tableau
      tournament.state = "running";

      // Créer les matchs pour le nouveau round
      const shuffledQualified = [...allQualified].sort(
        () => Math.random() - 0.5
      );

      for (let i = 0; i < shuffledQualified.length; i += 2) {
        const player1 = shuffledQualified[i];
        const player2 = shuffledQualified[i + 1];

        if (!player2) {
          // Joueur impair, qualifié pour le round suivant
          tournament.qualified.push(player1);
          console.log(
            `⭐ ${player1.name} qualifié automatiquement pour le round ${
              tournament.round + 1
            }`
          );
          continue;
        }

        // Créer une nouvelle room
        const roomId = fastify.createRoom
          ? fastify.createRoom()
          : `room-${Date.now()}-${i}`;

        tournament.matches.push({
          roomId,
          player1: player1.name,
          player2: player2.name,
          winner: null,
          scoreP1: 0,
          scoreP2: 0,
          status: "playing",
        });

        console.log(
          `🎮 Nouveau match R${tournament.round}: ${player1.name} vs ${player2.name} (${roomId})`
        );
      }

      // Diffuser la mise à jour
      if (fastify.broadcastTournamentUpdate) {
        fastify.broadcastTournamentUpdate();
      }

      return reply.send({
        success: true,
        started: true,
        round: tournament.round,
        matchesCount: tournament.matches.length,
        qualifiedCount: tournament.qualified.length,
      });
    } catch (error) {
      console.error("Erreur lors du passage au round suivant:", error);
      return reply
        .code(500)
        .send({ error: "Erreur serveur lors du passage au round suivant" });
    }
  });

  // 🔧 ROUTE NEW CORRIGÉE - RESET COMPLET AVEC NOUVEAUX TABLEAUX
  fastify.post("/api/tournament/new", async (req, reply) => {
    try {
      console.log("🆕 Réinitialisation complète du tournoi");

      // Fermer les WebSockets connectées
      if (fastify.connectedClients) {
        for (const [id, ws] of fastify.connectedClients.entries()) {
          try {
            ws.close(4000, "Réinitialisation du tournoi");
          } catch (e) {
            console.error(`❌ Erreur fermeture WS ${id}:`, e);
          }
        }
        fastify.connectedClients.clear();
      }

      // Réinitialiser les rooms / matchs
      if (fastify.rooms) fastify.rooms.clear();
      if (fastify.playerMap) fastify.playerMap.clear();
      if (fastify.matchStates) fastify.matchStates.clear();

      // 🔧 FIX CRITIQUE: Créer un tournoi complètement frais avec de nouveaux tableaux
      const freshTournament = createFreshTournament();
      fastify.tournaments.set("default", freshTournament);

      console.log("✅ Nouveau tournoi créé:", {
        players: freshTournament.players.length,
        state: freshTournament.state,
        matches: freshTournament.matches.length,
        isNewPlayersArray: Array.isArray(freshTournament.players),
      });

      // Diffuser la mise à jour
      if (fastify.broadcastTournamentUpdate) {
        fastify.broadcastTournamentUpdate();
        console.log("📡 Mise à jour diffusée après reset");
      }

      return reply.send({
        success: true,
        message: "Tournoi réinitialisé avec succès",
        tournament: {
          players: freshTournament.players,
          state: freshTournament.state,
          round: freshTournament.round,
        },
      });
    } catch (error) {
      console.error("❌ Erreur reset tournoi:", error);
      return reply.code(500).send({
        error: "Erreur serveur lors de la réinitialisation du tournoi",
      });
    }
  });

  // Route pour obtenir l'état du tournoi
  fastify.get("/api/tournament/status", async (req, reply) => {
    try {
      const tournament = fastify.tournaments.get("default");

      if (!tournament) {
        return reply.send({
          exists: false,
          message: "Aucun tournoi actif",
        });
      }

      return reply.send({
        exists: true,
        state: tournament.state,
        round: tournament.round,
        playersCount: tournament.players.length,
        matchesCount: tournament.matches.length,
        qualifiedCount: tournament.qualified ? tournament.qualified.length : 0,
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
    } catch (error) {
      console.error("Erreur lors de la récupération du statut:", error);
      return reply.code(500).send({ error: "Erreur serveur" });
    }
  });

  // Route pour forcer la mise à jour du statut (debug)
  fastify.post("/api/tournament/refresh", async (req, reply) => {
    try {
      if (fastify.broadcastTournamentUpdate) {
        fastify.broadcastTournamentUpdate();
        return reply.send({ success: true, message: "Mise à jour diffusée" });
      } else {
        return reply
          .code(500)
          .send({ error: "Service de diffusion non disponible" });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      return reply
        .code(500)
        .send({ error: "Erreur serveur lors de la mise à jour" });
    }
  });

  console.log("🏆 Routes de tournoi initialisées avec succès");
}
