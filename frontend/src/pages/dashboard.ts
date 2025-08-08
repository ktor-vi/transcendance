import page from "page";
import { createBabylonScene } from "../components/BabylonScene";
import { GameInstance } from "../types/GameTypes";

export function renderDashboard() {
  setTimeout(() => {
    fetch("api/profile", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Utilisateur non connecté");
        return res.json();
      })
      .then((user) => {
        const welcomeEl = document.getElementById("welcome");
        if (welcomeEl)
          welcomeEl.innerText = `Bienvenue ${
            user.name || user.email || "utilisateur"
          } !`;
      })
      .catch(() => (window.location.href = "/"));

    document
      .getElementById("keyboardPlayBtn")
      ?.addEventListener("click", () => {
        page("/keyboard-play");
      });

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const launch = document.getElementById("launch") as HTMLTitleElement;
    canvas.style.visibility = "hidden";

    let wsConnection: WebSocket | null = null;
    let isJoining = false;
    let gameInstance: GameInstance | null = null;
    let currentPlayerNumber = 0;
    let currentRoomId = "";

    // 🔧 NOUVELLE FONCTION : Créer une connexion WebSocket compatible avec le nouveau système
    function createWebSocketConnection(roomId: string | null): WebSocket {
      const ws = new WebSocket(`wss://${window.location.hostname}:3000/ws`);

      ws.onopen = () => {
        console.log("🔗 WebSocket dashboard connecté");

        // 🔧 IMPORTANT: Utiliser le nouveau format de message
        const joinMessage = {
          type: "joinRoom",
          connectionId: `dashboard-${Date.now()}`, // ID unique pour le dashboard
          playerName: `Player${Date.now().toString().slice(-4)}`, // Nom temporaire
          roomId: roomId || undefined, // Room spécifique ou auto-assignment
        };

        console.log("📤 Envoi message de connexion:", joinMessage);
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 Message reçu dashboard:", data.type, data);

          switch (data.type) {
            case "assign":
              handlePlayerAssignment(data);
              break;

            case "state":
              handleGameStateUpdate(data);
              break;

            case "scoreUpdate":
              handleScoreUpdate(data);
              break;

            case "gameEnd":
              handleGameEnd(data);
              break;

            case "error":
              handleError(data);
              break;

            default:
              console.log("🔍 Type de message non géré:", data.type);
          }
        } catch (e) {
          console.error("❌ Erreur parsing message dashboard:", e);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket dashboard fermé");
        isJoining = false;
      };

      ws.onerror = (error) => {
        console.error("❌ Erreur WebSocket dashboard:", error);
        isJoining = false;
      };

      return ws;
    }

    // 🔧 FONCTION : Gérer l'assignation du joueur
    function handlePlayerAssignment(data) {
      console.log("🎮 Assignation joueur:", data);

      currentPlayerNumber = data.player;
      currentRoomId = data.roomId || "";

      const info = document.getElementById("roomInfo");
      if (info) {
        info.innerText = `Room ID: ${currentRoomId} | Joueur ${currentPlayerNumber}`;
      }

      // Créer la scène Babylon
      launch.style.visibility = "hidden";
      canvas.style.visibility = "visible";

      try {
        gameInstance = createBabylonScene(canvas);
        console.log("🎮 Scène Babylon créée:", !!gameInstance);

        // Assigner le numéro du joueur et la connexion WebSocket
        if (gameInstance) {
          if (gameInstance.setPlayerNumber) {
            gameInstance.setPlayerNumber(currentPlayerNumber);
            console.log("✅ Numéro de joueur assigné:", currentPlayerNumber);
          }

          if (gameInstance.setWebSocket && wsConnection) {
            gameInstance.setWebSocket(wsConnection);
            console.log("✅ WebSocket assigné à la scène");
          }
        }
      } catch (error) {
        console.error("❌ Erreur création scène Babylon:", error);
      }

      isJoining = false;
      console.log(
        `✅ Rejoint room ${currentRoomId}, joueur ${currentPlayerNumber}`
      );
    }

    // 🔧 FONCTION : Gérer les mises à jour d'état du jeu
    function handleGameStateUpdate(data) {
      if (gameInstance && gameInstance.updateGameState && data.gameState) {
        gameInstance.updateGameState(data.gameState);

        // Mettre à jour le score
        updateScoreDisplay(data.gameState.scoreP1, data.gameState.scoreP2);
      }
    }

    // 🔧 FONCTION : Gérer les mises à jour de score
    function handleScoreUpdate(data) {
      updateScoreDisplay(data.scoreP1, data.scoreP2);
    }

    // 🔧 FONCTION : Gérer la fin de partie
    function handleGameEnd(data) {
      console.log("🏁 Fin de partie:", data);

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = `🏆 ${data.winner} gagne ${data.scoreP1}-${data.scoreP2}!`;
      }

      // Nettoyer après un délai
      setTimeout(() => {
        resetDashboard();
      }, 5000);
    }

    // 🔧 FONCTION : Gérer les erreurs
    function handleError(data) {
      console.error("❌ Erreur reçue:", data.message);
      alert(`Erreur: ${data.message}`);
      isJoining = false;
    }

    // 🔧 FONCTION : Mettre à jour l'affichage du score
    function updateScoreDisplay(scoreP1: number, scoreP2: number) {
      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        if (scoreP1 < 5 && scoreP2 < 5) {
          // Score max ajusté à 5 pour les matchs 1v1
          scoreEl.innerText = `Player 1: ${scoreP1} - Player 2: ${scoreP2}`;
        } else {
          const winner = scoreP1 >= 5 ? "Player 1" : "Player 2";
          scoreEl.innerText = `🏆 ${winner} gagne!`;
        }
      }
    }

    // 🔧 FONCTION : Réinitialiser le dashboard
    function resetDashboard() {
      // Nettoyer la connexion WebSocket
      if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
      }

      // Nettoyer l'instance de jeu
      if (gameInstance && gameInstance.cleanup) {
        gameInstance.cleanup();
        gameInstance = null;
      }

      // Réinitialiser l'interface
      launch.style.visibility = "visible";
      canvas.style.visibility = "hidden";

      const info = document.getElementById("roomInfo");
      if (info) info.innerText = "";

      const scoreEl = document.getElementById("score");
      if (scoreEl) scoreEl.innerText = "";

      currentPlayerNumber = 0;
      currentRoomId = "";
      isJoining = false;

      console.log("🧹 Dashboard réinitialisé");
    }

    // 🔧 FONCTION PRINCIPALE : Rejoindre une room
    function joinRoom(roomId: string | null) {
      if (isJoining) {
        console.warn("⚠️ Connexion déjà en cours...");
        return;
      }

      console.log("🚀 Tentative de connexion à la room:", roomId || "auto");
      isJoining = true;

      // Nettoyer les anciennes connexions
      resetDashboard();

      try {
        // Créer la nouvelle connexion WebSocket
        wsConnection = createWebSocketConnection(roomId);
        console.log("✅ Nouvelle connexion WebSocket créée");
      } catch (error) {
        console.error("❌ Erreur création WebSocket:", error);
        isJoining = false;
        alert("Erreur de connexion au serveur");
      }
    }

    // 🔧 EVENT LISTENERS pour les boutons
    document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
      if (isJoining) {
        console.warn("⚠️ Connexion en cours, veuillez patienter");
        return;
      }

      const input = (
        document.getElementById("roomIdInput") as HTMLInputElement
      ).value.trim();
      console.log(
        "🎯 Tentative de rejoindre room spécifique:",
        input || "auto"
      );
      joinRoom(input || null);
    });

    document.getElementById("matchmakeBtn")?.addEventListener("click", () => {
      if (isJoining) {
        console.warn("⚠️ Connexion en cours, veuillez patienter");
        return;
      }

      console.log("🎲 Matchmaking automatique demandé");
      joinRoom("auto"); // Le serveur assignera automatiquement une room
    });

    document
      .getElementById("goToTournamentBtn")
      ?.addEventListener("click", () => {
        page("/tournament");
      });

    // 🔧 NETTOYAGE à la fermeture de la page
    window.addEventListener("beforeunload", () => {
      console.log("🧹 Nettoyage avant fermeture de page");
      resetDashboard();
    });

    // 🔧 NETTOYAGE lors du changement de route
    window.addEventListener("popstate", () => {
      console.log("🧹 Nettoyage lors du changement de route");
      resetDashboard();
    });
  }, 300);

  return `
    <div class="w-full my-4 flex flex-row justify-between items-center px-4">
      <h1 class="text-2xl font-bold">Transcendance</h1>
      <a href="/profile" data-nav>Profil</a>
      <button id="logout" class="bg-red-500 text-white px-4 py-2 rounded">Déconnexion</button>
    </div>
    <div class="px-4">
      <h2 id="welcome" class="text-xl mb-4 font-semibold"></h2>
      <div class="mb-4 flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input id="roomIdInput" placeholder="ID de la room (laisser vide pour auto)" class="border px-3 py-2 rounded w-full md:w-64" />
        <button id="joinRoomBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          🎮 Rejoindre Room
        </button>
        <button id="matchmakeBtn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
          🎲 Matchmaking
        </button>
        <button id="goToTournamentBtn" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
          🏆 Tournoi
        </button>
        <button id="keyboardPlayBtn" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
          ⌨️ Clavier
        </button>
      </div>
      
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div id="roomInfo" class="text-sm text-gray-600 italic">Aucune partie en cours</div>
        <h2 id="score" class="text-xl font-bold mt-2"></h2>
      </div>
      
      <div class="game-container">
        <h1 id="launch" class="text-5xl text-center text-gray-400 my-8">🚀 Lancez une partie !</h1>
        <canvas id="renderCanvas" class="border w-full h-[70vh] rounded shadow-lg"></canvas>
      </div>
    </div>
  `;
}
