import page from "page";
import { createBabylonKeyboardPlay } from "../components/PongController";

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

        console.log("👤 Profil utilisateur chargé:", {
          name: user.name,
          email: user.email,
          id: user.id,
        });
      })
      .catch(() => {
        profileReady = true;
        window.location.href = "/";
      });
    fetch("api/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("User not authenticated");
        return res.json();
      })
      .then((user) => {
        const welcomeEl = document.getElementById("welcome");
        if (welcomeEl)
          welcomeEl.innerText = `Welcome ${user.name || user.email || "User"}!`;
      });

    // Navigation button to dashboard
    document.getElementById("dashboardBtn")?.addEventListener("click", () => {
      page("/dashboard");
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
          scoreEl.innerText = `Player 1: ${score.p1} - Player 2: ${score.p2}`;
        } else if (score.p1 >= 11) {
          scoreEl.innerText = `Player 1 wins!`;
        } else if (score.p2 >= 11) {
          scoreEl.innerText = `Player 2 wins!`;
        }
      });
    }
  }, 300);

  return `
		<script>0</script>
		<div class="w-full my-4 flex flex-row justify-between items-center px-4">
			<h1 class="text-2xl font-bold">Transcendance</h1>
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
