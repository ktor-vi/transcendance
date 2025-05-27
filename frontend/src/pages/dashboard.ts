import { createBabylonScene } from "../components/BabylonScene";

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
      .catch(() => {
        window.location.href = "/";
      });

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (canvas) {
      createBabylonScene(canvas);
    }
  }, 300);

  return `
    <div class="w-full my-4 flex flex-row place-items-center justify-between">
      <h1>Transcendance</h1>
      <button id="logout">Déconnexion</button>
    </div>
    <div>
      <h1 id="welcome"></h1>
      <canvas id="renderCanvas" style="width:100%;height:90%;"></canvas>
    </div>
  `;
}
