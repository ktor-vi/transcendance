import page from "page";
import { createBabylonScene } from "../components/BabylonScene";
import { connectWebSocket } from "../socket";
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
		// Navigue vers /keyboard-play en utilisant page.js
		page("/keyboard-play");
		});
	const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
	const launch = document.getElementById("launch") as HTMLTitleElement;
	canvas.style.visibility = "hidden";
	let wsConnection: any = null;
	let isJoining = false;
	let gameInstance: GameInstance | null = null;

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
			launch.style.visibility = "hidden";
			canvas.style.visibility = "visible";
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
				const scoreEl = document.getElementById("score");
				if (scoreEl) {
				if (
					data.gameState.score.p1 < 11 &&
					data.gameState.score.p2 < 11
				)
					scoreEl.innerText = `Player 1 : ${data.gameState.score.p1} - Player 2 : ${data.gameState.score.p2}`;
				if (data.gameState.score.p1 >= 11)
					scoreEl.innerText = `Bravo player 1 ! `;
				if (data.gameState.score.p2 >= 11)
					scoreEl.innerText = `Bravo player 2 ! `;
				}
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
		wsConnection.onclose = () => {
		console.log("[Dashboard] Socket fermée, partie terminée.");
		};
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
	});

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
		<h1 class>Transcendance</h1>
		<div class="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-8">
			<a href="/profile" data-nav class="px-4 py-2">Profil</a>
			<a href="/users-list" data-nav class="px-4 py-2">Utilisateurs</a>
			<a href="/friends" data-nav class="px-4 py-2">Amitiés</a>
		</div>
		<button id="logout" class="bg-red-500 text-white px-4 py-2 rounded relative -top-2">Déconnexion</button>
	</div>
	<div class="px-4">
	<h2 id="welcome" class="text-xl mb-4 font-semibold"></h2>
	
	<section id="friendsList">
	<ul id="userList" style="background: none;"></ul>
	</section>


	<h1 id="launch" class="text-5xl">Lancez une partie !</h1>
		<div class="mb-4 flex flex-col md:flex-row gap-0 items-start md:items-center">
		<input id="roomIdInput" placeholder="ID de la room (laisser vide pour créer)" class="border px-3 py-2 rounded w-full md:w-64" />
		<button id="joinRoomBtn" class="relative w-60 h-60 bg-transparent">
			<img src="images/cloud2.svg" class="w-full h-full scale-110" />
				<span class="absolute inset-0 flex items-center justify-center text-primary font-bold mt-6">
					Créer / Rejoindre
				</span>
		</button>

		<button id="matchmakeBtn" class="relative w-60 h-60 bg-transparent">
			<img src="images/cloud3.svg" class="w-full h-full scale-110" />
					<span class="absolute inset-0 flex items-center justify-center text-primary font-bold mt-6">
					Matchmaking
				</span>
		</button>

		<button id="keyboardPlayBtn" class="relative w-60 h-60 bg-transparent">
				<img src="images/cloud4.svg" class="w-full h-full scale-110" />
				<span class="absolute inset-0 flex items-center justify-center text-primary font-bold mt-6">
					Keyboard
				</span>
		</button>
		</div>
		<div id="roomInfo" class="text-sm text-gray-600 mb-2 italic"></div>
		<h2 id="score" class="text-2xl font-bold"></h2>
		<canvas id="renderCanvas" class="border w-full h-[80vh]"></canvas>
	</div>
	`;
}