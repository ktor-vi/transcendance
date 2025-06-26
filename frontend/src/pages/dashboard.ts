import { createBabylonScene } from "../components/BabylonScene";
import { connectWebSocket } from "../socket";
// Fonction principale qui affiche le tableau de bord (dashboard) utilisateur
export function renderDashboard() {
  // Utilise un petit délai (300ms) pour laisser le temps au DOM de se stabiliser ou aux animations de s'exécuter
  setTimeout(() => {
    // Requête HTTP vers l'API "/me" pour vérifier si l'utilisateur est connecté
    fetch("/me", { credentials: "include" }) // "credentials: include" permet d'envoyer les cookies de session
      .then((res) => {
        // Si la réponse n'est pas OK (ex: 401), on déclenche une erreur
        if (!res.ok) throw new Error("Utilisateur non connecté");
        return res.json(); // Sinon, on récupère les données JSON de l'utilisateur
      })
      .then((user) => {
        // Met à jour le DOM pour afficher un message de bienvenue
        const welcomeEl = document.getElementById("welcome");
        if (welcomeEl) welcomeEl.innerText = `Bienvenue ${user.name || user.email || "utilisateur"} !`;
      })
      .catch(() => window.location.href = "/"); // En cas d'erreur (ex: non connecté), redirection vers la page d'accueil

    // Référence au <canvas> HTML où sera affichée la scène Babylon.js
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    // Gestion du clic sur le bouton "Rejoindre / Créer"
    document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
      // Récupère la valeur entrée dans le champ texte pour l'ID de la room
      const input = (document.getElementById("roomIdInput") as HTMLInputElement).value.trim();
      // Si l'entrée est vide, on passe null pour créer une nouvelle room
      joinRoom(input || null);
    });

    // Gestion du clic sur le bouton "Matchmaking"
    document.getElementById("matchmakeBtn")?.addEventListener("click", () => {
      // Envoie une demande de matchmaking automatique (roomId = "auto")
      joinRoom("auto");
    });

    // Fonction qui gère la connexion à une room via WebSocket
    function joinRoom(roomId: string | null) {
      connectWebSocket(
        // Callback de réception des messages WebSocket
        (data) => {
          // Si le serveur nous assigne à une room
          if (data.type === "assign") {
            const info = document.getElementById("roomInfo");
            if (info) {
              info.innerText = `Room ID : ${data.roomId} | Joueur ${data.player}`;
            }
            // On initialise la scène 3D avec Babylon.js
            createBabylonScene(canvas);
          }

          // Si le serveur retourne une erreur (ex: room inexistante)
          if (data.type === "error") {
            alert(data.message); // Affiche un message d'erreur
          }
        },
        // Payload initial envoyé lors de la connexion WebSocket
        () => ({ type: "joinRoom", roomId })
      );
    }
  }, 300); // Fin du setTimeout

  // HTML retourné par la fonction pour être injecté dans la page
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
