import { createBabylonScene } from "../components/BabylonScene";
import { connectWebSocket } from "../socket";

export function renderDashboard() {
  setTimeout(() => {
    fetch("/me", { credentials: "include" })
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

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    let wsConnection: any = null;
    let isJoining = false;
    let gameInstance = null;

    function joinRoom(roomId: string | null) {
      if (isJoining) {
        console.warn("Connexion déjà en cours...");
        return;
      }

      isJoining = true;

      // Nettoyer l'ancienne connexion
      if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
      }

      // Nettoyer l'ancienne instance de jeu
      if (gameInstance && gameInstance.cleanup) {
        gameInstance.cleanup();
        gameInstance = null;
      }

      wsConnection = connectWebSocket(
        (data) => {
          console.log("[Dashboard] Message reçu:", data);

          if (data.type === "assign") {
            const info = document.getElementById("roomInfo");
            if (info) {
              info.innerText = `Room ID : ${data.roomId} | Joueur ${data.player}`;
            }

            // Créer la scène Babylon
            gameInstance = createBabylonScene(canvas);

            // Assigner le numéro du joueur
            if (gameInstance && gameInstance.setPlayerNumber) {
              gameInstance.setPlayerNumber(data.player);
            }

            isJoining = false;
            console.log(
              `✅ Rejoint room ${data.roomId}, joueur ${data.player}`
            );
          }

          if (data.type === "state") {
            // Mettre à jour l'état du jeu
            if (gameInstance && gameInstance.updateGameState) {
              gameInstance.updateGameState(data.gameState);
            }
          }

          if (data.type === "error") {
            console.error("[Dashboard] Erreur:", data.message);
            alert(data.message);
            isJoining = false;
          }
        },
        () => {
          console.log("[Dashboard] Demande de connexion room:", roomId);
          return { type: "joinRoom", roomId: roomId || "auto" };
        }
      );
    }

    // Gestion des boutons
    document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
      if (isJoining) return;
      const input = (
        document.getElementById("roomIdInput") as HTMLInputElement
      ).value.trim();
      joinRoom(input || null);
    });

    document.getElementById("matchmakeBtn")?.addEventListener("click", () => {
      if (isJoining) return;
      joinRoom("auto");
    })

    // Nettoyage à la fermeture
    window.addEventListener("beforeunload", () => {
      if (wsConnection) {
        wsConnection.close();
      }
      if (gameInstance && gameInstance.cleanup) {
        gameInstance.cleanup();
      }
    });
  }, 300);

  return `
    <div class="w-full my-4 flex flex-row justify-between items-center px-4">
      <h1 class="text-2xl font-bold">Transcendance</h1>
      <button id="logout" class="bg-red-500 text-white px-4 py-2 rounded">Déconnexion</button>
    </div>
    <div class="px-4">
      <h2 id="welcome" class="text-xl mb-4 font-semibold"></h2>
      <div class="mb-4 flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input id="roomIdInput" placeholder="ID de la room (laisser vide pour créer)" class="border px-3 py-2 rounded w-full md:w-64" />
        <button id="joinRoomBtn" class="bg-blue-500 text-white px-4 py-2 rounded">Rejoindre / Créer</button>
        <button id="matchmakeBtn" class="bg-green-500 text-white px-4 py-2 rounded">Matchmaking</button>
      </div>
      <div id="roomInfo" class="text-sm text-gray-600 mb-2 italic"></div>
      <canvas id="renderCanvas" class="border w-full h-[80vh]"></canvas>
    </div>
  `;
}
