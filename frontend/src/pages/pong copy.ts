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

interface Room {
  id: string;
  numberPlayersInRoom?: number;
  hostPlayer?: string;
  guestPlayer?: string;
  // j'en sais rien, peut-etre c'est ok peut-etre c'est mauvais
  host?: Player;
  guest?: Player;
}

interface Player {
  profile: UserProfile;
  socket: WebSocket;
}

// est-ce que tous ces states sont necessaire, probablement pas, a check
enum UserState {
  joining,
  connected,
  playing,
  leaving,
  disconnected
}

async function getPicture(): Promise<string> {
  const res = await fetch("/api/profile", { method: "GET" });
  const userData = await res.json();
  return userData.picture;
}

export function renderPong() {
  setTimeout(() => {
    let userProfile: UserProfile | null = null;
    let userState: UserState = UserState.disconnected;
    let wsConnection: WebSocket | null = null;
    let gameInstance: GameInstance | null = null;
    let room: Room | null = null;

    // .then permet de passer d'une fonction en mode asynchrone (force par fetch)
    // à une fonction synchrone (ici renderPong)
    getUser()
      .then(userProfile)
      .catch((error) => {
        console.error("Error loading user session: ", error);
        window.location.href = "/";
        return;
      });

    // je ne comprends pas ce que ca fait la
    checkChatMatch(userState, wsConnection);

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    canvas.style.visibility = "hidden";
    documentListeners(userProfile, userState, wsConnection, gameInstance, room, canvas);

    window.addEventListener("beforeunload", () => {
      console.log("🧹 Nettoyage avant fermeture de page");
      resetDashboard(userState, wsConnection, gameInstance, room, canvas);
    });

    window.addEventListener("popstate", () => {
      console.log("🧹 Nettoyage lors du changement de route");
      resetDashboard(userState, wsConnection, gameInstance, room, canvas);
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
    <button id="liveChatBtn" class="mx-4 button bg-fuchsia-400 hover:bg-fuchsia-500">Chat</button>
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

/**
 * asynchronous function that fetch api/session
 * @returns the user profile
 */
async function getUser() : Promise<UserProfile> {
  const session = await fetch("api/session", { credentials: "include" });
  if (!session.ok)
    throw new Error("Utilisateur non connecté");
  const userProfile: UserProfile = await session.json();

  // retour log du chargement de session
  console.log("👤 Profil utilisateur chargé:", {
    name: userProfile.name,
    email: userProfile.email,
    id: userProfile.id,
  });

  // message de bienvenue
  const welcomeEl = document.getElementById("welcome");
  if (welcomeEl)
    welcomeEl.innerText = `Bienvenue ${
      userProfile.name || userProfile.email || "utilisateur"
    } !`;

  return userProfile;
}

// ici, pourquoi on ne redirigerait pas vers un nouvelle page qu'on appelle /roomPong?idRoom, un truc comme ça
// document = obj global = page html chargee dans le browser -> DOM = Document Obj Model
// getElmtById = method de DOM qui selectionne un element HTML par son ID
// eventListener = surveillance de l'evenement clique rattache au bouton
function documentListeners(
  userProfile: UserProfile | null = null,
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) {

  document
    .getElementById("joinRoomBtn")
    ?.addEventListener("click", () => {
      if (userState === UserState.joining) {
        console.warn("⚠️ Connexion en cours, veuillez patienter");
        return;
      }
      const input = (
        document.getElementById("roomIdInput") as HTMLInputElement
      ).value.trim();
      joinRoom(userProfile, userState, wsConnection, gameInstance, room, canvas);
    });

  document
    .getElementById("matchmakeBtn")
    ?.addEventListener("click", () => {
      if (userState) {
        console.warn("⚠️ Connexion en cours, veuillez patienter");
        return;
      }
      console.log("🎲 Matchmaking automatique demandé");
      joinRoom("auto");
    });

  document
    .getElementById("keyboardPlayBtn")
    ?.addEventListener("click", () => {
      page("/keyboard-play");
    });

  document
    .getElementById("goToTournamentBtn")
    ?.addEventListener("click", () => {
      page("/tournament");
    });

  document
    .getElementById("liveChatBtn")
    ?.addEventListener("click", () => {
      page("/chat");
    });
}

function checkChatMatch(userState: UserState, wsConnection: WebSocket | null = null) {
  const chatMatchRoomId = sessionStorage.getItem("chatMatchRoomId");
  if (chatMatchRoomId) {
    console.log(`🎮 Match depuis chat détecté: ${chatMatchRoomId}`);
    // Nettoyer le sessionStorage
    sessionStorage.removeItem("chatMatchRoomId");
    // Afficher un message à l'utilisateur
    const scoreEl = document.getElementById("score");
    if (scoreEl) {
      scoreEl.innerText = `🎮 Connexion à la partie ${chatMatchRoomId}...`;
      scoreEl.className = "text-xl font-bold mt-2 text-blue-600";
    }
    // Joindre la room automatiquement
    setTimeout(() => {
      joinRoom(chatMatchRoomId);
    }, 1000);
  }
}

function joinRoom(
  userProfile: UserProfile | null = null,
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) {
  if (userState === UserState.joining) {
    console.warn("⚠️ Connexion déjà en cours...");
    return;
  }
  userState = UserState.joining;
  // Nettoyer les anciennes connexions
  resetDashboard(userState, wsConnection, gameInstance, room, canvas);
  try {
    // Créer la nouvelle connexion WebSocket
    wsConnection = createWebSocketConnection(userProfile, userState, gameInstance, room, canvas);
    console.log("✅ Nouvelle connexion WebSocket créée");
  } catch (error) {
    console.error("❌ Erreur création WebSocket:", error);
    userState = UserState.leaving;
    alert("Erreur de connexion au serveur");
  }
}

function resetDashboard(
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) {
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

  //pour l'instant, je mimic l'ancien code. a venir, supprimer la room quand elle ne sert plus
  userState = UserState.disconnected;
  if (!room) return;
  room.numberPlayersInRoom = 0;
  room.id = "";
  room.hostPlayer = "";
  room.guestPlayer = "";
}

// 🔧 FONCTION : Créer une connexion WebSocket
function createWebSocketConnection(
  userProfile: UserProfile | null = null,
  userState: UserState,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement): WebSocket {
  const ws = new WebSocket(`wss://${window.location.hostname}:5173/ws`);
  ws.onopen = () => handleWebSocketOpen(userProfile, ws, room);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data, userProfile, userState, ws, gameInstance, room, canvas);
    } catch (e) {
      console.error("❌ Erreur parsing message dashboard:", e);
    }
  };
  ws.onclose = () => {
    console.log("🔌 WebSocket dashboard fermé");
    userState = UserState.disconnected;
  };
  ws.onerror = (error) => {
    console.error("❌ Erreur WebSocket dashboard:", error);
    userState = UserState.disconnected;
  };
  return ws;
}

function handleWebSocketOpen(
  userProfile: UserProfile | null = null,
  wsConnection: WebSocket,
  room: Room | null = null) {
  if (!room) return;
  console.log("🔗 WebSocket dashboard connecté");
  // 🔧 DEBUG: Vérifier le profil utilisateur
  console.log("🔍 Profil utilisateur disponible:", {
    userProfile: userProfile,
    name: userProfile?.name,
    email: userProfile?.email,
  });
  // 🔧 IMPORTANT: Utiliser le nom d'utilisateur réel
  const userName =
    userProfile?.name ||
    userProfile?.email ||
    `User${Date.now().toString().slice(-4)}`;
  console.log("🏷️ Nom utilisateur sélectionné:", userName);
  const joinMessage = {
    type: "joinRoom",
    connectionId: `dashboard-${Date.now()}`,
    playerName: userName,
    roomId: room.id || undefined,
  };
  console.log("📤 Envoi message de connexion:", joinMessage);
  wsConnection.send(JSON.stringify(joinMessage));
}

function handleWebSocketMessage(
  data: any,
  userProfile: UserProfile | null = null,
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) {
  if (!wsConnection || !gameInstance)
    handleError(data);
  switch (data.type) {
    case "assign":
      handlePlayerAssignment(data, userProfile, wsConnection, gameInstance, room, canvas);
      userState = UserState.connected;
      break;
    case "waiting":
      handleWaitingForPlayer(data, gameInstance, room);
      break;
    case "gameReady":
      handleGameReady(data, gameInstance, room);
      break;
    case "playerJoined":
      handlePlayerJoined(data, room);
      break;
    case "state":
      handleGameStateUpdate(data, userProfile, wsConnection, gameInstance, room, canvas);
      break;
    case "scoreUpdate":
      handleScoreUpdate(data, userProfile, room);
      break;
    case "gameEnd":
      handleGameEnd(data, userState, wsConnection, gameInstance, room, canvas);
      break;
    case "error":
      handleError(data);
      userState = UserState.disconnected;
      break;
    case "chatMatch":
      handleChatMatch(data, userProfile, userState, wsConnection, gameInstance, room, canvas);
      break;
    default:
      console.log("🔍 Type de message non géré:", data.type);
  }
}

function handlePlayerAssignment(
      data: any, 
      userProfile: UserProfile | null = null,
      wsConnection: WebSocket | null = null,
      gameInstance: GameInstance | null = null,
      room: Room | null = null,
      canvas: HTMLCanvasElement) : void {
  if (!room || !gameInstance) return;
  console.log("🎮 Assignation joueur:", data);
  room.numberPlayersInRoom = data.player;
  room.id = data.roomId || "";
  room.hostPlayer =
    data.playerName ||
    userProfile?.name ||
    userProfile?.email ||
    `Joueur${room.numberPlayersInRoom}`;
  console.log("🏷️ Nom joueur assigné:", room.hostPlayer);
  const info = document.getElementById("roomInfo");
  if (info) {
    info.innerText = `Room: ${room.id} | ${room.hostPlayer} (Joueur ${room.numberPlayersInRoom})`;
  }
  // Préparer l'interface pour le jeu
  canvas.style.visibility = "visible";
  try {
    gameInstance = createBabylonScene(canvas);
    console.log("🎮 Scène Babylon créée:", !!gameInstance);
    if (gameInstance) {
      if (gameInstance.setPlayerNumber && room.numberPlayersInRoom) {
        gameInstance.setPlayerNumber(room.numberPlayersInRoom);
        console.log("✅ Numéro de joueur assigné:", room.numberPlayersInRoom);
      }
      if (gameInstance.setWebSocket && wsConnection) {
        gameInstance.setWebSocket(wsConnection);
        console.log("✅ WebSocket assigné à la scène");
      }
    }
  } catch (error) {
    console.error("❌ Erreur création scène Babylon:", error);
  }
  console.log(
    `✅ ${room.hostPlayer} rejoint room ${room.id} (Joueur ${room.numberPlayersInRoom})`
  );
}

function handlePlayerJoined(data: any, room: Room | null = null) : void {
  if (!room) return;
  if (data.playerName && data.playerName !== room.hostPlayer) {
    room.guestPlayer = data.playerName;
    const info = document.getElementById("roomInfo");
    if (info) {
      info.innerText = `Room: ${room.id} | ${room.hostPlayer} vs ${room.guestPlayer}`;
    }
  }
}

function handleWaitingForPlayer(data: any, gameInstance: GameInstance | null = null, room: Room | null = null) : void {
  if (!room || !gameInstance) return;
  const scoreEl = document.getElementById("score");
  if (scoreEl) {
    scoreEl.innerText = `⏳ ${room.hostPlayer}, attendez un adversaire... (${data.playersCount}/${data.maxPlayers})`;
    scoreEl.className = "text-xl font-bold mt-2 text-orange-600";
  }
  if (gameInstance.setGameActive) {
    gameInstance.setGameActive(false);
  }
}

function handleGameReady(data: any, gameInstance: GameInstance | null = null, room: Room | null = null) : void {
  if (!room || !gameInstance) return;
  if (data.players && typeof data.players === "object") {
    const playerNames = Object.values(data.players);
    console.log("👥 Noms des joueurs trouvés:", playerNames);
    // Trouver l'adversaire (celui qui n'est pas le joueur actuel)
    room.guestPlayer =
      playerNames.find((name) => name !== room.hostPlayer) ||
      "Adversaire";
  } else {
    console.warn("⚠️ Pas de données players dans gameReady");
    room.guestPlayer = `Joueur${room.numberPlayersInRoom === 1 ? 2 : 1}`;
  }
  const scoreEl = document.getElementById("score");
  if (scoreEl) {
    scoreEl.innerText = `🚀 ${room.hostPlayer} vs ${room.guestPlayer} - La partie commence!`;
    scoreEl.className = "text-xl font-bold mt-2 text-green-600";
    // Réinitialiser avec les vrais noms après 2 secondes
    setTimeout(() => {
      if (scoreEl) {
        scoreEl.innerText = `${room.hostPlayer}: 0 - ${room.guestPlayer}: 0`;
        scoreEl.className = "text-xl font-bold mt-2";
      }
    }, 2000);
  }
  // Mettre à jour l'info de la room
  const info = document.getElementById("roomInfo");
  if (info) {
    info.innerText = `Room: ${room.id} | ${room.hostPlayer} vs ${room.guestPlayer}`;
  }
  if (gameInstance && gameInstance.setGameActive) {
    gameInstance.setGameActive(true);
  }
}

function handleGameStateUpdate(
  data: any,
  userProfile: UserProfile | null = null,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) : void{
  if (gameInstance && gameInstance.updateGameState && data.gameState) {
    gameInstance.updateGameState(data.gameState);
    // Mettre à jour le score
    handleScoreUpdate(data, userProfile, room);
  }
}

function handleScoreUpdate(data: any, userProfile: UserProfile | null = null, room: Room | null = null) : void{
  if (!room) return;
  const scoreEl = document.getElementById("score");
  if (scoreEl) {
    let player1Name =
      room.numberPlayersInRoom === 1
        ? room.hostPlayer ||
          userProfile?.name ||
          userProfile?.email ||
          "Vous"
        : room.guestPlayer || "Adversaire";
    let player2Name =
      room.numberPlayersInRoom === 1
        ? room.guestPlayer || "Adversaire"
        : room.hostPlayer ||
          userProfile?.name ||
          userProfile?.email ||
          "Vous";
    if (data.gameState.scoreP1 < 11 && data.gameState.scoreP2 < 11) {
      scoreEl.innerText = `${player1Name}: ${data.gameState.scoreP1} - ${player2Name}: ${data.gameState.scoreP2}`;
    } else {
      const winner = data.gameState.scoreP1 >= 11 ? player1Name : player2Name;
      scoreEl.innerText = `🏆 ${winner} gagne!`;
    }
  }
}

function handleGameEnd(
  data: any,
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) : void{
  const scoreEl = document.getElementById("score");
  if (scoreEl) {
    const winnerName = data.winner || "Joueur";
    scoreEl.innerText = `🏆 ${winnerName} remporte la victoire ${data.scoreP1}-${data.scoreP2}!`;
    scoreEl.className = "text-xl font-bold mt-2 text-green-600";
  }
  // Nettoyer après un délai
  setTimeout(() => {
  resetDashboard(userState, wsConnection, gameInstance, room, canvas);
  }, 5000);
}

function handleError(data: any) : void{
  console.error("❌ Erreur reçue:", data.message);
  alert(`Erreur: ${data.message}`);
}

function handleChatMatch(
  data: any,
  userProfile: UserProfile | null = null,
  userState: UserState,
  wsConnection: WebSocket | null = null,
  gameInstance: GameInstance | null = null,
  room: Room | null = null,
  canvas: HTMLCanvasElement) : void{
  console.log("🎮 Chat match reçu:", data.roomId);
  joinRoom(userProfile, userState, wsConnection, gameInstance, room, canvas);
}
