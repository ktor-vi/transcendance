import page from "page";
import { createBabylonScene } from "../components/BabylonScene";
import { GameInstance } from "../types/GameTypes";

export function renderDashboard() {
	setTimeout(() => {
		// -----------------------------
		// VARIABLES
		// -----------------------------
		let currentUserProfile: any = null;
		let profileReady = false;
		let wsConnection: WebSocket | null = null;
		let isJoining = false;
		let gameInstance: GameInstance | null = null;
		let currentPlayerNumber = 0;
		let currentRoomId = "";
		let currentPlayerName = "";
		let opponentPlayerName = "";

		// -----------------------------
		// FETCH USER PROFILE
		// -----------------------------
		fetch("api/session", { credentials: "include" })
			.then((res) => {
				if (!res.ok) throw new Error("User not logged in");
				return res.json();
			})
			.then((user) => {
				currentUserProfile = user;
				profileReady = true;

				console.log(`👤 User loaded: ${user.name || user.email}`);

				const welcomeEl = document.getElementById("welcome");
				if (welcomeEl)
					welcomeEl.innerText = `Welcome ${user.name || user.email || "User"}!`;

				checkChatMatch();
			})
			.catch(() => {
				profileReady = true;
				window.location.href = "/";
			});

		// -----------------------------
		// CHECK FOR CHAT MATCH INVITATION
		// -----------------------------
		function checkChatMatch() {
			const chatMatchRoomId = sessionStorage.getItem("chatMatchRoomId");
			if (chatMatchRoomId) {
				console.log(`🎮 Chat match detected: ${chatMatchRoomId}`);
				sessionStorage.removeItem("chatMatchRoomId");

				const scoreEl = document.getElementById("score");
				if (scoreEl) {
					scoreEl.innerText = `🎮 Connecting to match ${chatMatchRoomId}...`;
					scoreEl.className = "text-xl font-bold mt-2 text-blue-600";
				}

				setTimeout(() => joinRoom(chatMatchRoomId), 1000);
			}
		}

		// -----------------------------
		// CREATE WEBSOCKET CONNECTION
		// -----------------------------
		function createWebSocketConnection(roomId: string | null): WebSocket {
			const ws = new WebSocket(`wss://${window.location.hostname}:3000/ws`);

			ws.onopen = () => {
				console.log("🔗 WebSocket dashboard connected");

				const userName =
					currentUserProfile?.name ||
					currentUserProfile?.email ||
					`User${Date.now().toString().slice(-4)}`;

				ws.send(
					JSON.stringify({
						type: "joinRoom",
						connectionId: `dashboard-${Date.now()}`,
						playerName: userName,
						roomId: roomId || undefined,
					})
				);
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					switch (data.type) {
						case "assign": handlePlayerAssignment(data); break;
						case "waiting": handleWaitingForPlayer(data); break;
						case "gameReady": handleGameReady(data); break;
						case "playerJoined": handlePlayerJoined(data); break;
						case "state": handleGameStateUpdate(data); break;
						case "scoreUpdate": handleScoreUpdate(data); break;
						case "gameEnd": handleGameEnd(data); break;
						case "error": handleError(data); break;
						case "chatMatch": handleChatMatch(data); break;
					}
				} catch {}
			};

			ws.onclose = () => { isJoining = false; };
			ws.onerror = () => { isJoining = false; };

			return ws;
		}

		// -----------------------------
		// EVENT HANDLERS
		// -----------------------------
		function handleChatMatch(data: any) {
			joinRoom(data.roomId);
		}

		function handlePlayerAssignment(data: any) {
			currentPlayerNumber = data.player;
			currentRoomId = data.roomId || "";
			currentPlayerName = data.playerName || currentUserProfile?.name || currentUserProfile?.email || `Player${currentPlayerNumber}`;

			const info = document.getElementById("roomInfo");
			if (info) info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} (Player ${currentPlayerNumber})`;

			const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
			const launch = document.getElementById("launch") as HTMLTitleElement;
			launch.style.visibility = "hidden";
			canvas.style.visibility = "visible";

			gameInstance = createBabylonScene(canvas);
			if (gameInstance && gameInstance.setPlayerNumber) {
				gameInstance.setPlayerNumber(currentPlayerNumber);
			}

			isJoining = false;
		}

		function handlePlayerJoined(data: any) {
			if (data.playerName && data.playerName !== currentPlayerName) {
				opponentPlayerName = data.playerName;
				const info = document.getElementById("roomInfo");
				if (info) info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} vs ${opponentPlayerName}`;
			}
		}

		function handleWaitingForPlayer(data: any) {
			const scoreEl = document.getElementById("score");
			if (scoreEl) {
				scoreEl.innerText = `⏳ ${currentPlayerName}, waiting for opponent... (${data.playersCount}/${data.maxPlayers})`;
				scoreEl.className = "text-xl font-bold mt-2 text-orange-600";
			}
			if (gameInstance && gameInstance.setGameActive) gameInstance.setGameActive(false);
		}

		function handleGameReady(data: any) {
			if (data.players) {
				const playerNames = Object.values(data.players);
				opponentPlayerName = playerNames.find((n) => n !== currentPlayerName) || "Opponent";
			} else opponentPlayerName = `Player${currentPlayerNumber === 1 ? 2 : 1}`;

			const scoreEl = document.getElementById("score");
			if (scoreEl) {
				scoreEl.innerText = `🚀 ${currentPlayerName} vs ${opponentPlayerName} - Game starting!`;
				scoreEl.className = "text-xl font-bold mt-2 text-green-600";
				setTimeout(() => {
					scoreEl.innerText = `${currentPlayerName}: 0 - ${opponentPlayerName}: 0`;
					scoreEl.className = "text-xl font-bold mt-2";
				}, 2000);
			}
			const info = document.getElementById("roomInfo");
			if (info) info.innerText = `Room: ${currentRoomId} | ${currentPlayerName} vs ${opponentPlayerName}`;
			if (gameInstance && gameInstance.setGameActive) gameInstance.setGameActive(true);
		}

		function handleGameStateUpdate(data: any) {
			if (gameInstance && gameInstance.updateGameState && data.gameState) {
				gameInstance.updateGameState(data.gameState);
				updateScoreDisplay(data.gameState.scoreP1, data.gameState.scoreP2);
			}
		}

		function handleScoreUpdate(data: any) {
			updateScoreDisplay(data.scoreP1, data.scoreP2);
		}

		function handleGameEnd(data: any) {
			const scoreEl = document.getElementById("score");
			if (scoreEl) {
				const winnerName = data.winner || "Player";
				scoreEl.innerText = `🏆 ${winnerName} wins ${data.scoreP1}-${data.scoreP2}!`;
				scoreEl.className = "text-xl font-bold mt-2 text-green-600";
			}
			setTimeout(() => resetDashboard(), 5000);
		}

		function handleError(data: any) {
			alert(`Error: ${data.message}`);
			isJoining = false;
		}

		function updateScoreDisplay(scoreP1: number, scoreP2: number) {
			const scoreEl = document.getElementById("score");
			if (!scoreEl) return;
			const player1Name = currentPlayerNumber === 1 ? currentPlayerName : opponentPlayerName;
			const player2Name = currentPlayerNumber === 1 ? opponentPlayerName : currentPlayerName;

			if (scoreP1 < 11 && scoreP2 < 11) {
				scoreEl.innerText = `${player1Name}: ${scoreP1} - ${player2Name}: ${scoreP2}`;
			} else {
				const winner = scoreP1 >= 11 ? player1Name : player2Name;
				scoreEl.innerText = `🏆 ${winner} wins!`;
			}
		}

		// -----------------------------
		// RESET DASHBOARD
		// -----------------------------
		function resetDashboard() {
			if (wsConnection) wsConnection.close();
			if (gameInstance && gameInstance.cleanup) gameInstance.cleanup();

			const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
			const launch = document.getElementById("launch") as HTMLTitleElement;
			launch.style.visibility = "visible";
			canvas.style.visibility = "hidden";

			const info = document.getElementById("roomInfo");
			if (info) info.innerText = "No game in progress";

			const scoreEl = document.getElementById("score");
			if (scoreEl) { scoreEl.innerText = ""; scoreEl.className = "text-xl font-bold mt-2"; }

			currentPlayerNumber = 0;
			currentRoomId = "";
			currentPlayerName = "";
			opponentPlayerName = "";
			isJoining = false;
		}

		// -----------------------------
		// JOIN ROOM
		// -----------------------------
		function joinRoom(roomId: string | null) {
			if (isJoining) return;
			isJoining = true;
			resetDashboard();
			wsConnection = createWebSocketConnection(roomId);
		}

		// -----------------------------
		// BUTTON EVENT LISTENERS
		// -----------------------------
		document.getElementById("joinRoomBtn")?.addEventListener("click", () => {
			const input = (document.getElementById("roomIdInput") as HTMLInputElement).value.trim();
			joinRoom(input || null);
		});
		document.getElementById("matchmakeBtn")?.addEventListener("click", () => joinRoom("auto"));
		document.getElementById("liveChatBtn")?.addEventListener("click", () => page("/chat"));
		document.getElementById("goToTournamentBtn")?.addEventListener("click", () => page("/tournament"));
		document.getElementById("keyboardPlayBtn")?.addEventListener("click", () => page("/keyboard-play"));

		// -----------------------------
		// CLEANUP ON PAGE EXIT
		// -----------------------------
		window.addEventListener("beforeunload", resetDashboard);
		window.addEventListener("popstate", resetDashboard);
	}, 300);
	
	return `
	<div class="w-full my-4 flex flex-row justify-between items-center px-4">
		<h1>Transcendance</h1>
		<div class="absolute left-1/2 transform -translate-x-1/2 flex flex-row items-center gap-8">
			<a href="/profile" data-nav class="px-4 py-2">Profil</a>
			<a href="/users-list" data-nav class="px-4 py-2">Utilisateurs</a>
			<a href="/friends" data-nav class="px-4 py-2">Amitiés</a>
		</div>
		<button id="logout" class="bg-red-500 text-white px-4 py-2 rounded relative -top-2">Déconnexion</button>
	</div>
	<div class="px-4">
		<h2 id="welcome" class="text-xl mb-4 font-semibold"></h2>
		<div class="mb-4 flex flex-col md:flex-row gap-2 items-start md:items-center">
			<input id="roomIdInput" placeholder="ID de la room (laisser vide pour créer)" class="border px-3 py-2 rounded w-full md:w-64" />
			<button id="joinRoomBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
				🎮 Rejoindre Room
			</button>
			<button id="matchmakeBtn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
				🎲 Matchmaking
			</button>
			<button id="goToTournamentBtn" class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
				🏆 Tournoi
			</button>
			<button id="keyboardPlayBtn" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
				⌨️ Clavier
			</button>
			<button id="liveChatBtn" class="bg-fuchsia-400 text-white px-4 py-2 rounded">
				Chat
			</button>
		</div>

		<div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
			<div id="roomInfo" class="text-sm text-gray-600 italic">Aucune partie en cours</div>
			<h2 id="score" class="text-xl font-bold mt-2"></h2>
		</div>

		<div class="game-container">
			<h1 id="launch" class="text-5xl text-center text-gray-400 my-8">🚀 Lancez une partie !</h1>
			<canvas id="renderCanvas" class="border w-full h-[70vh] rounded shadow-lg"></canvas>
		</div>
	</div>
`;
}
