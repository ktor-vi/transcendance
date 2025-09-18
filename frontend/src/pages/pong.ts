import page from "page";
import { createBabylonScene } from "../components/BabylonScene";
import { GameInstance } from "../types/GameTypes";

async function getPicture() {
  const res = await fetch("/api/profile", { method: "GET" });
  const userData = await res.json();

  return userData.picture;
}

export function renderPong() {
  setTimeout(() => {
    // 🔧 TOUTES LES VARIABLES AU MÊME NIVEAU
    let currentUserProfile = null;
    let profileReady = false;
    let wsConnection: WebSocket | null = null;
    let isJoining = false;
    let gameInstance: GameInstance | null = null;
    let currentPlayerNumber = 0;
    let currentRoomId = "";
    let currentPlayerName = "";
    let opponentPlayerName = "";

    // 🔧 CHARGEMENT DU PROFIL
    fetch("api/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Utilisateur non connecté");
        return res.json();
      })
      .then((user) => {
        currentUserProfile = user;
        profileReady = true;

        console.log("👤 Profil utilisateur chargé:", {
          name: user.name,
          email: user.email,
          id: user.id,
        });

        const welcomeEl = document.getElementById("welcome");
        if (welcomeEl)
          welcomeEl.innerText = `Bienvenue ${
            user.name || user.email || "utilisateur"
          } !`;
      })
      .catch(() => {
        profileReady = true;
        window.location.href = "/";
      });

    document
      .getElementById("keyboardPlayBtn")
      ?.addEventListener("click", () => {
        page("/keyboard-play");
      });

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const launch = document.getElementById("launch") as HTMLTitleElement;
    canvas.style.visibility = "hidden";

    // 🔧 FONCTION : Créer une connexion WebSocket
    function createWebSocketConnection(roomId: string | null): WebSocket {
      const ws = new WebSocket(`wss://${window.location.hostname}:5173/ws`);

      ws.onopen = () => {
        console.log("🔗 WebSocket dashboard connecté");

        // 🔧 DEBUG: Vérifier le profil utilisateur
        console.log("🔍 Profil utilisateur disponible:", {
          currentUserProfile: currentUserProfile,
          name: currentUserProfile?.name,
          email: currentUserProfile?.email,
        });

        // 🔧 IMPORTANT: Utiliser le nom d'utilisateur réel
        const userName =
          currentUserProfile?.name ||
          currentUserProfile?.email ||
          `User${Date.now().toString().slice(-4)}`;

        console.log("🏷️ Nom utilisateur sélectionné:", userName);

        const joinMessage = {
          type: "joinRoom",
          connectionId: `dashboard-${Date.now()}`,
          playerName: userName,
          roomId: roomId || undefined,
        };

        console.log("📤 Envoi message de connexion:", joinMessage);
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "assign":
              handlePlayerAssignment(data);
              break;

            case "waiting":
              handleWaitingForPlayer(data);
              break;

            case "gameReady":
              handleGameReady(data);
              break;

            case "playerJoined":
              handlePlayerJoined(data);
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

      // 🔧 DEBUG: Vérifier ce qui arrive dans les données
      console.log("🔍 Données reçues dans assign:", {
        player: data.player,
        roomId: data.roomId,
        playerName: data.playerName,
        currentUserProfile: currentUserProfile,
      });

      // 🔧 CORRECTION: Utiliser les données reçues ou le profil utilisateur
      currentPlayerName =
        data.playerName ||
        currentUserProfile?.name ||
        currentUserProfile?.email ||
        `Joueur${currentPlayerNumber}`;

      console.log("🏷️ Nom joueur assigné:", currentPlayerName);

      const info = document.getElementById("roomInfo");
      if (info) {
        info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} (Joueur ${currentPlayerNumber})`;
      }

      // Préparer l'interface pour le jeu
      launch.style.visibility = "hidden";
      canvas.style.visibility = "visible";

      try {
        gameInstance = createBabylonScene(canvas);
        console.log("🎮 Scène Babylon créée:", !!gameInstance);

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
        `✅ ${currentPlayerName} rejoint room ${currentRoomId} (Joueur ${currentPlayerNumber})`
      );
    }

    // 🔧 FONCTION : Gérer l'arrivée d'un autre joueur
    function handlePlayerJoined(data) {
      console.log("👋 Nouveau joueur rejoint:", data);

      if (data.playerName && data.playerName !== currentPlayerName) {
        opponentPlayerName = data.playerName;

        const info = document.getElementById("roomInfo");
        if (info) {
          info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} vs ${opponentPlayerName}`;
        }
      }
    }

    // 🔧 FONCTION : Gérer l'attente du second joueur
    function handleWaitingForPlayer(data) {
      console.log("⏳ En attente d'autres joueurs:", data);

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = `⏳ ${currentPlayerName}, attendez un adversaire... (${data.playersCount}/${data.maxPlayers})`;
        scoreEl.className = "text-xl font-bold mt-2 text-orange-600";
      }

      if (gameInstance && gameInstance.setGameActive) {
        gameInstance.setGameActive(false);
      }

      console.log("⏳ Jeu en pause - en attente du second joueur");
    }

    // 🔧 FONCTION : Gérer le début de partie
    function handleGameReady(data) {
      console.log("🚀 Partie prête à démarrer:", data);

      // 🔧 DEBUG: Voir ce qui arrive dans gameReady
      console.log("🔍 Données gameReady:", {
        message: data.message,
        players: data.players,
        playersCount: data.playersCount,
      });

      // 🔧 CORRECTION: Récupérer les noms des joueurs depuis les données
      if (data.players && typeof data.players === "object") {
        const playerNames = Object.values(data.players);
        console.log("👥 Noms des joueurs trouvés:", playerNames);

        // Trouver l'adversaire (celui qui n'est pas le joueur actuel)
        opponentPlayerName =
          playerNames.find((name) => name !== currentPlayerName) ||
          "Adversaire";
        console.log("🥊 Adversaire identifié:", opponentPlayerName);
      } else {
        console.warn("⚠️ Pas de données players dans gameReady");
        opponentPlayerName = `Joueur${currentPlayerNumber === 1 ? 2 : 1}`;
      }

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = `🚀 ${currentPlayerName} vs ${opponentPlayerName} - La partie commence!`;
        scoreEl.className = "text-xl font-bold mt-2 text-green-600";

        // Réinitialiser avec les vrais noms après 2 secondes
        setTimeout(() => {
          if (scoreEl) {
            scoreEl.innerText = `${currentPlayerName}: 0 - ${opponentPlayerName}: 0`;
            scoreEl.className = "text-xl font-bold mt-2";
          }
        }, 2000);
      }

      // Mettre à jour l'info de la room
      const info = document.getElementById("roomInfo");
      if (info) {
        info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} vs ${opponentPlayerName}`;
      }

      if (gameInstance && gameInstance.setGameActive) {
        gameInstance.setGameActive(true);
      }

      console.log(
        `🎮 Jeu activé - ${currentPlayerName} vs ${opponentPlayerName}`
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

    // 🔧 FONCTION : Gérer la fin de partie avec les noms
    function handleGameEnd(data) {
      console.log("🏁 Fin de partie:", data);

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        // 🔧 MODIFIÉ: Utiliser le vrai nom du gagnant
        const winnerName = data.winner || "Joueur";
        scoreEl.innerText = `🏆 ${winnerName} remporte la victoire ${data.scoreP1}-${data.scoreP2}!`;
        scoreEl.className = "text-xl font-bold mt-2 text-green-600";
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

    // 🔧 FONCTION : Mettre à jour l'affichage du score avec les noms
    function updateScoreDisplay(scoreP1: number, scoreP2: number) {
      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        // 🔧 DEBUG: Forcer des noms pour tester
        let player1Name =
          currentPlayerNumber === 1
            ? currentPlayerName ||
              currentUserProfile?.name ||
              currentUserProfile?.email ||
              "Vous"
            : opponentPlayerName || "Adversaire";

        let player2Name =
          currentPlayerNumber === 1
            ? opponentPlayerName || "Adversaire"
            : currentPlayerName ||
              currentUserProfile?.name ||
              currentUserProfile?.email ||
              "Vous";

        console.log("🏷️ DEBUG - Noms utilisés pour le score:", {
          player1Name,
          player2Name,
          currentPlayerName,
          opponentPlayerName,
          currentPlayerNumber,
        });

        if (scoreP1 < 11 && scoreP2 < 11) {
          scoreEl.innerText = `${player1Name}: ${scoreP1} - ${player2Name}: ${scoreP2}`;
        } else {
          const winner = scoreP1 >= 11 ? player1Name : player2Name;
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
      if (info) info.innerText = "Aucune partie en cours";

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = "";
        scoreEl.className = "text-xl font-bold mt-2";
      }

      // 🔧 NOUVEAU: Réinitialiser les noms
      currentPlayerNumber = 0;
      currentRoomId = "";
      currentPlayerName = "";
      opponentPlayerName = "";
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
      console.log("👤 Profil disponible:", currentUserProfile);
      console.log("🏷️ Profile ready:", profileReady);

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
      joinRoom("auto");
    });

    // document = obj global = page html chargee dans le browser -> DOM = Document Obj Model
    // getElmtById = method de DOM qui selectionne un element HTML par son ID
    // eventListener = surveillance de l'evenement clique rattache au bouton
    document.getElementById("liveChatBtn")?.addEventListener("click", () => {
      page("/chat");
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

  getPicture().then((userPicture) => {
    const profileImg = document.querySelector<HTMLImageElement>(
      'a[href="/profile"] img'
    );
    if (profileImg) {
      profileImg.src = userPicture;
    }
  });

  const html = `
<script>0</script>

<section class="flex flex-col items-center text-center min-h-screen pt-4 pb-16 relative">
    <div class="dashboard-buttons w-full flex items-center justify-between px-8 mb-8">
        <h1 class="ml-8 text-4xl -mt-4 font-bold text-pink-600">TRANSCENDENCE</h1>

        <img src="/images/hellokittycomputer.png"
             alt="Hello Kitty Computer"
             class="hellokitty-computer h-20">

        <div class="flex items-center space-x-6">
            <div class="flex space-x-6 mr-4">
                <a href="/users-list"
                   data-nav
                   class="button bg-rose-300 hover:bg-rose-400 h-8 px-4 py-1 rounded transition-colors">
                    Utilisateurs
                </a>
                <a href="/friends"
                   data-nav
                   class="button bg-orange-300 hover:bg-orange-400 h-8 px-4 py-1 rounded transition-colors">
                    Amitiés
                </a>
            </div>

            <a href="/profile" data-nav class="block">
                <img src="/images/default-profile.png"
                     alt="Profil"
                     class="w-14 h-14 -mt-2 rounded-full object-cover shadow-lg hover:shadow-xl transition-shadow">
            </a>
        </div>
    </div>

    <div class="flex flex-row space-y-3 items-baseline w-80vw mb-8 ">
        <input id="roomIdInput"
               placeholder="ID de la room"
               class="border px-3 h-12 rounded w-[150px] h-10 focus:outline-none focus:ring-2 focus:ring-blue-300">


            <button id="joinRoomBtn"
                    class="mx-4 button bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors flex items-center justify-center">
                🎮 Rejoindre Room
            </button>

            <button id="matchmakeBtn"
                    class="mx-4 button bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors flex items-center justify-center">
                🎲 Matchmaking
            </button>

            <button id="goToTournamentBtn"
                    class="mx-4 button bg-orange-500 hover:bg-orange-600 text-white py-2 rounded transition-colors flex items-center justify-center">
                🏆 Tournoi
            </button>

            <button id="keyboardPlayBtn"
                    class="mx-4 button bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors flex items-center justify-center">
                ⌨️ Local
            </button>


        <button id="liveChatBtn"
                class="mx-4 button bg-fuchsia-400 hover:bg-fuchsia-500 text-white px-4 py-2 rounded transition-colors">
            Chat
        </button>
    </div>

    <div class="game-container w-full max-w-4xl mx-auto">
        <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <div id="roomInfo" class="text-sm text-gray-600 italic mb-1">Aucune partie en cours</div>
            <h2 id="score" class="text-xl font-bold mt-2 min-h-[2rem]"></h2>
        </div>

        <h1 id="launch" class="text-5xl text-center text-gray-400 my-8 select-none">🚀 Lancez une partie !</h1>

        <canvas id="renderCanvas"
                class="border border-gray-300 w-full h-[70vh] rounded-lg shadow-lg bg-gray-800">
        </canvas>
    </div>

    <button id="logout"
            class="button bg-red-400 hover:bg-red-500 w-12 h-12 fixed bottom-6 left-6 rounded-full shadow-md transition-colors"
            aria-label="Déconnexion">
        <img src="/images/logout.svg"
             alt="Déconnexion"
             class="w-8 h-8 mx-auto -scale-x-100">
    </button>
</section>

    `;
  document.getElementById("app")!.innerHTML = html;
}
