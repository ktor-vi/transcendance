import page from "page";
import { createBabylonScene } from "../components/BabylonScene";
import { backButtonArrow, setupBackButton } from "../components/backButton.js";
import { GameInstance } from "../types/GameTypes";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

async function getPicture(): Promise<string> {
  const res = await fetch("/api/profile", { method: "GET" });
  const userData = await res.json();
  return userData.picture;
}

export function renderPong() {
  setTimeout(() => {
    let currentUserProfile: UserProfile | null = null;
    let profileReady = false;
    let wsConnection: WebSocket | null = null;
    let isJoining = false;
    let gameInstance: GameInstance | null = null;
    let currentPlayerNumber = 0;
    let currentRoomId = "";
    let currentPlayerName = "";
    let opponentPlayerName: any;

    fetch("api/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Utilisateur non connecté");
        return res.json();
      })
      .then((user: UserProfile) => {
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

    canvas.style.visibility = "hidden";

    function createWebSocketConnection(roomId: string | null): WebSocket {
      const ws = new WebSocket(`wss://${window.location.hostname}:5173/ws`);

      ws.onopen = () => {
        console.log("🔗 WebSocket dashboard connecté");

        const userName =
          currentUserProfile?.name ||
          currentUserProfile?.email ||
          `User${Date.now().toString().slice(-4)}`;

        const joinMessage = {
          type: "joinRoom",
          connectionId: `dashboard-${Date.now()}`,
          playerName: userName,
          roomId: roomId || undefined,
        };

        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            [key: string]: any;
          };

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

    // -----------------------
    // HANDLERS (typés en `any` pour éviter TS errors rapides)
    // -----------------------
    function handlePlayerAssignment(data: any) {
      console.log("🎮 Assignation joueur:", data);

      currentPlayerNumber = data.player;
      currentRoomId = data.roomId || "";



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
    function handlePlayerJoined(data: any) {
      if (data.playerName && data.playerName !== currentPlayerName) {
        opponentPlayerName = data.playerName;

        const info = document.getElementById("roomInfo");
        if (info) {
          info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} vs ${opponentPlayerName}`;
        }
      }
    }
    function handleWaitingForPlayer(data: any) {
      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = `⏳ ${currentPlayerName}, attendez un adversaire... (${data.playersCount}/${data.maxPlayers})`;
        scoreEl.className = "text-xl font-bold mt-2 text-orange-600";
      }

      if (gameInstance && gameInstance.setGameActive) {
        gameInstance.setGameActive(false);
      }
    }
    function handleGameReady(data: any) {
      if (data.players && typeof data.players === "object") {
        const playerNames = Object.values(data.players);
        console.log("👥 Noms des joueurs trouvés:", playerNames);

        // Trouver l'adversaire (celui qui n'est pas le joueur actuel)
        opponentPlayerName =
          playerNames.find((name) => name !== currentPlayerName) ||
          "Adversaire";
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
    }
    function handleGameStateUpdate(data: any) {
      if (gameInstance && gameInstance.updateGameState && data.gameState) {
        gameInstance.updateGameState(data.gameState);

        // Mettre à jour le score
        updateScoreDisplay(data.gameState.scoreP1, data.gameState.scoreP2);
      }
    }
    function handleScoreUpdate(data: any) {
      updateScoreDisplay(data.scoreP1, data.scoreP2);
    }
    function handleGameEnd(data: any) {
      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        const winnerName = data.winner || "Joueur";
        scoreEl.innerText = `🏆 ${winnerName} remporte la victoire ${data.scoreP1}-${data.scoreP2}!`;
        scoreEl.className = "text-xl font-bold mt-2 text-green-600";
      }

      // Nettoyer après un délai
      setTimeout(() => {
        resetDashboard();
      }, 5000);
    }
    function handleError(data: any) {
      console.error("❌ Erreur reçue:", data.message);
      alert(`Erreur: ${data.message}`);
      isJoining = false;
    }
    function updateScoreDisplay(scoreP1: number, scoreP2: number) {
      const scoreEl = document.getElementById("score");
      if (scoreEl) {
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

        if (scoreP1 < 11 && scoreP2 < 11) {
          scoreEl.innerText = `${player1Name}: ${scoreP1} - ${player2Name}: ${scoreP2}`;
        } else {
          const winner = scoreP1 >= 11 ? player1Name : player2Name;
          scoreEl.innerText = `🏆 ${winner} gagne!`;
        }
      }
    }
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
      canvas.style.visibility = "hidden";

      const info = document.getElementById("roomInfo");
      if (info) info.innerText = "Aucune partie en cours";

      const scoreEl = document.getElementById("score");
      if (scoreEl) {
        scoreEl.innerText = "";
        scoreEl.className = "text-xl font-bold mt-2";
      }

      currentPlayerNumber = 0;
      currentRoomId = "";
      currentPlayerName = "";
      opponentPlayerName = "";
      isJoining = false;
    }
    function joinRoom(roomId: string | null) {
      if (isJoining) {
        console.warn("⚠️ Connexion déjà en cours...");
        return;
      }
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

    document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
      if (isJoining) {
        console.warn("⚠️ Connexion en cours, veuillez patienter");
        return;
      }

      const input = (
        document.getElementById("roomIdInput") as HTMLInputElement
      ).value.trim();
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

    window.addEventListener("beforeunload", () => {
      console.log("🧹 Nettoyage avant fermeture de page");
      resetDashboard();
    });

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

	<section class="flex flex-col items-center text-center">
	<div class="self-start ml-16 mt-12">
		${backButtonArrow()}
	</div>
	<h1 class="absolute top-[180px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-white drop-shadow-lg w-full">
		LANCE UNE PARTIE !
	</h1>
	<div class="relative w-[350px] -z-10">
 		<img src="/images/rocket.png" alt="jolie fusée" class="-mt-36 -mb-36 h-[350px] w-full -z-10">
	</div>
	<div class="flex flex-wrap justify-center gap-4 mt-6">
		<input id="roomIdInput" placeholder="ID de la room"</input>
		<button class="button bg-purple-400 hover:bg-purple-600" id="joinRoomBtn">Rejoindre Room</button>
		<button class="button bg-purple-400 hover:bg-purple-600" id="matchmakeBtn">Matchmaking</button>
		<button class="button bg-purple-400 hover:bg-purple-600" id="keyboardPlayBtn">Local</button>
		<button class="button bg-lime-300 hover:bg-lime-400" id="goToTournamentBtn">Tournoi</button>
	</div>
	<div class="game-container w-full max-w-4xl mx-auto">
      <h3 id="score" class=""></h2>
	</div>

  <div class="my-6 mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
  <div id="roomInfo" class="text-sm text-gray-600 italic rounded">Aucune partie en cours</div>
  <h2 id="score" class="text-xl font-bold mt-2"></h2>
  </div>

<div class="game-container">
  <canvas id="renderCanvas" class="border w-full h-[70vh] rounded shadow-lg"></canvas>
</div>	</section>
	`;
  document.getElementById("app")!.innerHTML = html;
  setupBackButton();
}
