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
        if (welcomeEl) welcomeEl.innerText = `Bienvenue ${user.name || user.email || "utilisateur"} !`;
      })
      .catch(() => window.location.href = "/");

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
      const input = (document.getElementById("roomIdInput") as HTMLInputElement).value.trim();
      joinRoom(input || null);
    });

    document.getElementById("matchmakeBtn")?.addEventListener("click", () => {
      joinRoom("auto");
    });

    function joinRoom(roomId: string | null) {
      connectWebSocket((data) => {
        if (data.type === "assign") {
          const info = document.getElementById("roomInfo");
          if (info) info.innerText = `Room ID : ${data.roomId} | Joueur ${data.player}`;
          createBabylonScene(canvas);
        }
        if (data.type === "error") {
          alert(data.message);
        }
      }, () => ({ type: "joinRoom", roomId }));
    }
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
