import page from "page";
import { createBabylonKeyboardPlay } from "../components/PongController";
import { backButtonArrow, setupBackButton } from '../components/backButton.js';

export type KeyboardInstance = {
  start: () => void;
  reset: () => void;
  onScoreUpdate: (
    callback: (score: { p1: number; p2: number }) => void
  ) => void;
};

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

export function renderKeyboardPlay() {
  setTimeout(() => {
    // Fetch user profile
    let currentUserProfile: UserProfile | null = null;
    let profileReady = false;
    fetch("api/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Utilisateur non connecté");
        return res.json();
      })
      .then((user: UserProfile) => {
        currentUserProfile = user;
        profileReady = true;
      })
      .catch(() => {
        profileReady = true;
        window.location.href = "/";
      });
    fetch("api/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("User not authenticated");
	        return res.json();
      });

    // Navigation button to dashboard
    document.getElementById("returnBtn")?.addEventListener("click", () => {
      page("/pong");
    });

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    let gameInstance: KeyboardInstance | null = null;

    // Create BabylonJS keyboard play instance
    gameInstance = createBabylonKeyboardPlay(canvas);

    const scoreEl = document.getElementById("score");

    // Attach score update callback
    if (gameInstance && scoreEl) {
      gameInstance.onScoreUpdate((score) => {
        if (score.p1 < 11 && score.p2 < 11) {
          scoreEl.innerText = `Joueur 1: ${score.p1} - Joueur 2: ${score.p2}`;
        } else if (score.p1 >= 11) {
          scoreEl.innerText = `Le jouer 1 a gagné!`;
        } else if (score.p2 >= 11) {
          scoreEl.innerText = `Le jouer 2 a gagné!`;
        }
      });
    }
  }, 300);
setupBackButton();


  return `
		<script>0</script>
		<section class="flex flex-col items-center text-center">
		<button id="returnBtn" class="button bg-pink-400 hover:bg-pink-500 fixed top-16 left-16">Retour</button>
		<div class="px-4">
		<p class="text-xl mt-12">Joueur 1 (haut): J/L</p>
		<p class="text-xl mb-4">Joueur 2 (bas): A/D</p>
			<p id="score" class="text-2xl"></p>
			<canvas id="renderCanvas" class="border w-[130vh] h-[70vh]"></canvas>
			</div>
		</section>
	`;
}
