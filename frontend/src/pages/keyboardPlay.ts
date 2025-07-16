import page from "page";
import { createBabylonKeyboardPlay } from "../components/BabylonKeyboardPlay";

export type KeyboardInstance = {
  start: () => void;
  reset: () => void;
  // Ajoute un moyen d'enregistrer un callback pour le score
  onScoreUpdate: (
    callback: (score: { p1: number; p2: number }) => void
  ) => void;
};
export function renderKeyboardPlay() {
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
      });
      document
        .getElementById("dashboardBtn")
        ?.addEventListener("click", () => {
          // Navigue vers /keyboard-play en utilisant page.js
          page("/dashboard");
        });
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    let gameInstance: KeyboardInstance | null = null;

    // Créer la scène Babylon
    gameInstance = createBabylonKeyboardPlay(canvas);

    const scoreEl = document.getElementById("score");
    if (gameInstance && scoreEl) {
      gameInstance.onScoreUpdate((score) => {
        if (score.p1 < 11 && score.p2 < 11)
          scoreEl.innerText = `Player 1 : ${score.p1} - Player 2 : ${score.p2}`;
        else if (score.p1 >= 11) scoreEl.innerText = `Bravo player 1 !`;
        else if (score.p2 >= 11) scoreEl.innerText = `Bravo player 2 !`;
      });
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
        <button id="dashboardBtn" class="bg-purple-600 text-white px-4 py-2 rounded">Dashboard</button>
      </div>
      <h2 id="score" class="text-2xl font-bold"></h2>
      <canvas id="renderCanvas" class="border w-full h-[80vh]"></canvas>
    </div>
  `;
}
