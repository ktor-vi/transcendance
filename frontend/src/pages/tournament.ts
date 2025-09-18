import { createBabylonScene } from "../components/BabylonScene";

interface Player {
  id: string;
  name: string;
}

interface Match {
  roomId: string;
  player1: string;
  player2: string;
  winner?: string;
  loser?: string;
  scoreP1: number;
  scoreP2: number;
  status: "playing" | "finished";
}

interface TournamentData {
  exists: boolean;
  state: "waiting" | "running" | "completed_round" | "completed";
  round: number;
  players: Player[];
  matches: Match[];
  qualified?: Player[];
  winner?: Player;
}

interface User {
  id: string;
  name: string;
}

export function renderTournamentPage(): string {
  setTimeout(() => {
    // 🔧 TOUTES LES VARIABLES AU MÊME NIVEAU
    let currentUserProfile = null;
    let profileReady = false;
  fetch("api/session", { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error("Utilisateur non connecté");
      return res.json();
    })
    .then((user) => {
      currentUserProfile = user;
      profileReady = true;

      console.log("👤 Profil utilisateur chargé:", {
        name: user.name,
        email: user.email,
        id: user.id,
      });

      const welcomeEl = document.getElementById("welcome");
      if (welcomeEl)
        welcomeEl.innerText = `Bienvenue ${
          user.name || user.email || "utilisateur"
        } !`;
    })
    .catch(() => {
      profileReady = true;
      window.location.href = "/";
    });
  const container = document.getElementById("app");
  if (!container) return "";

  container.innerHTML = `
  <script>0</script>

<section class="flex flex-col items-center text-center min-h-screen pt-4 pb-16 relative">
    <div class="w-full my-4 flex flex-row justify-between items-center px-4">
      <h1 class="text-2xl font-bold">Tournoi Pong 3D</h1>
      <a href="/dashboard" data-nav class="text-blue-500 hover:underline">⬅ Retour</a>
    </div>
    <div class="px-4">
      <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p id="userDebugInfo" class="text-sm text-blue-700"></p>
      </div>
      <p id="tournamentState" class="mb-2 text-lg font-semibold text-gray-700">Connexion au tournoi...</p>
    <div class="flex flex-row space-y-3 items-baseline w-80vw mb-8 ">
        <button id="joinTournamentBtn" class="mx-4 button bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
          Rejoindre le tournoi
        </button>
        <button id="newTournamentBtn" class="mx-4 button bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Nouveau tournoi
        </button>
        <button id="debugUserBtn" class="mx-4 button bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
          🔧 Debug Utilisateur
        </button>
        <button id="forceConnectBtn" class="mx-4 button bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
          🎮 Force Connexion
        </button>
      </div>
      <div id="tournamentContent">
        <ul id="playerList" class="space-y-2"></ul>
        <div id="gameSceneContainer" class="mt-4"></div>
      </div>
    </div>
    </section>

  `;

  const stateText = document.getElementById(
    "tournamentState"
  ) as HTMLParagraphElement;
  const playerList = document.getElementById("playerList") as HTMLUListElement;
  const userDebugInfo = document.getElementById(
    "userDebugInfo"
  ) as HTMLParagraphElement;
  const gameSceneContainer = document.getElementById(
    "gameSceneContainer"
  ) as HTMLDivElement;

  const scenes = new Map<string, any>();
  const finishedMatches = new Map();
  const gameConnections = new Map<string, WebSocket>();
  const sceneContainers = new Map<string, HTMLDivElement>();

  let currentUser: User | null = null;
  let tournamentWebSocket: WebSocket | null = null;
  let pendingMatchConnections: Array<{
    roomId: string;
    player1: string;
    player2: string;
  }> = [];
  let lastTournamentData: any = null;
  let isRenderingInProgress = false;

  function updateUserDebugInfo(): void {
    if (!userDebugInfo) return;

    const info = currentUser
      ? `👤 Utilisateur: ${currentUser.name} (ID: ${currentUser.id})`
      : "❌ Pas d'utilisateur connecté";

    const matchInfo =
      lastTournamentData?.matches?.length > 0
        ? ` | 🎮 Match: ${lastTournamentData.matches[0].player1} vs ${lastTournamentData.matches[0].player2}`
        : " | 🎮 Pas de match actif";

    userDebugInfo.textContent = info + matchInfo;
  }

  async function getCurrentTournamentUser(): Promise<User | null> {
    try {
      console.log("🔍 Récupération de l'utilisateur du tournoi...");

      const profileResponse = await fetch("/api/profile", {
        credentials: "include",
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.user) {
          console.log(
            "✅ Utilisateur trouvé via API profile:",
            profileData.user
          );
          return {
            id: String(profileData.user.id),
            name:
              profileData.user.name ||
              profileData.user.email ||
              `Player${String(profileData.user.id).slice(0, 4)}`,
          };
        }
      }

      const tournamentResponse = await fetch("/api/tournament/status", {
        credentials: "include",
      });
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        console.log(
          "📊 Données tournoi pour récupération utilisateur:",
          tournamentData
        );

        if (tournamentData.exists && tournamentData.players?.length > 0) {
          console.log(
            "🎯 Joueurs disponibles dans le tournoi:",
            tournamentData.players
          );

          if (tournamentData.matches?.length > 0) {
            const firstMatch = tournamentData.matches[0];
            console.log(
              `🎮 Premier match: ${firstMatch.player1} vs ${firstMatch.player2}`
            );

            const firstPlayer = tournamentData.players.find(
              (p) =>
                p.name === firstMatch.player1 || p.name === firstMatch.player2
            );

            if (firstPlayer) {
              console.log("🎯 Utilisation du joueur du match:", firstPlayer);
              return {
                id: String(firstPlayer.id),
                name: firstPlayer.name,
              };
            }
          }

          const firstPlayer = tournamentData.players[0];
          console.log("🎯 Utilisation du premier joueur inscrit:", firstPlayer);
          return {
            id: String(firstPlayer.id),
            name: firstPlayer.name,
          };
        }
      }

      console.warn("⚠️ Aucun utilisateur trouvé");
      return null;
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur tournoi:", error);
      return null;
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    console.log("🔍 Récupération utilisateur avec matching...");

    const user = await getCurrentTournamentUser();
    if (user) {
      currentUser = user;
      console.log("✅ UTILISATEUR RÉCUPÉRÉ:", currentUser);
      updateUserDebugInfo();
      processPendingMatchConnections();
    } else {
      console.warn("⚠️ Impossible de récupérer un utilisateur valide");
      currentUser = {
        id: String(Date.now()),
        name: `TempUser${Date.now().toString().slice(-4)}`,
      };
      console.log("🆘 Utilisateur temporaire créé:", currentUser);
      updateUserDebugInfo();
    }
  }

  async function debugUser(): Promise<void> {
    console.log("🔧 DEBUG UTILISATEUR DEMANDÉ");

    try {
      console.log("📊 État actuel:", {
        currentUser,
        pendingConnections: pendingMatchConnections.length,
        gameConnections: gameConnections.size,
        lastTournamentData: lastTournamentData?.state,
      });

      const response = await fetch("/api/tournament/status", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("🏆 Données complètes du tournoi:", data);

        if (data.exists && data.matches?.length > 0) {
          const match = data.matches[0];
          console.log(`🎮 Match actuel: ${match.player1} vs ${match.player2}`);
          console.log(`🔍 Utilisateur actuel: ${currentUser?.name}`);

          const choice = prompt(
            `Choisissez votre joueur:\n1. ${match.player1}\n2. ${match.player2}\n\nTapez 1 ou 2:`
          );

          if (choice === "1" || choice === "2") {
            const selectedName = choice === "1" ? match.player1 : match.player2;
            currentUser = {
              id: String(Date.now()),
              name: selectedName,
            };

            console.log("🎯 UTILISATEUR CHANGÉ:", currentUser);
            updateUserDebugInfo();
            localStorage.setItem("debugUser", JSON.stringify(currentUser));
            processPendingMatchConnections();
            alert(`✅ Vous jouez maintenant comme ${currentUser.name}`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Erreur debug utilisateur:", error);
      alert("Erreur lors du debug utilisateur");
    }
  }

  function forceConnect(): void {
    if (!currentUser) {
      alert("❌ Aucun utilisateur connecté");
      return;
    }

    if (!lastTournamentData?.matches?.length) {
      alert("❌ Aucun match actif");
      return;
    }

    const match = lastTournamentData.matches[0];
    console.log(
      `🚀 FORCE CONNEXION au match ${match.roomId} pour ${currentUser.name}`
    );

    setTimeout(() => {
      connectToMatch(match.roomId, currentUser!.name);
    }, 200);

    alert(`🎮 Connexion forcée au match ${match.roomId}`);
  }

  function processPendingMatchConnections(): void {
    if (!currentUser) {
      console.log(
        "⚠️ processPendingMatchConnections appelé mais currentUser est null"
      );
      return;
    }

    if (pendingMatchConnections.length === 0) {
      console.log("ℹ️ Aucune connexion de match en attente");
      return;
    }

    console.log(
      `🔄 Traitement de ${pendingMatchConnections.length} connexions en attente pour ${currentUser.name}`
    );

    // Vérifier si le joueur est qualifié automatiquement
    if (lastTournamentData?.qualified) {
      const isAutoQualified = lastTournamentData.qualified.some(
        (player) =>
          player.name === currentUser.name || player.id === currentUser.id
      );

      if (isAutoQualified) {
        console.log(
          `⭐ ${currentUser.name} est qualifié automatiquement - pas de connexion WebSocket nécessaire`
        );
        pendingMatchConnections = [];
        return;
      }
    }

    const uniqueMatches = new Map<
      string,
      { roomId: string; player1: string; player2: string }
    >();

    for (const match of pendingMatchConnections) {
      if (!uniqueMatches.has(match.roomId)) {
        uniqueMatches.set(match.roomId, match);
      }
    }

    console.log(`🧹 Après déduplication: ${uniqueMatches.size} matchs uniques`);

    for (const match of uniqueMatches.values()) {
      const isInMatch =
        match.player1 === currentUser.name ||
        match.player2 === currentUser.name ||
        match.player1 === currentUser.id ||
        match.player2 === currentUser.id;

      console.log(`🔍 Vérification match ${match.roomId}:`, {
        player1: match.player1,
        player2: match.player2,
        currentUserName: currentUser.name,
        currentUserId: currentUser.id,
        isInMatch,
      });

      if (isInMatch) {
        console.log(
          `✅ Connexion au match ${match.roomId} pour ${currentUser.name}`
        );

        if (!gameConnections.has(match.roomId)) {
          setTimeout(() => {
            connectToMatch(match.roomId, currentUser!.name);
          }, 200);
        } else {
          console.log(`⚠️ Déjà connecté au match ${match.roomId}, skip`);
        }
      } else {
        console.log(
          `ℹ️ Match ${match.roomId} ne concerne pas ${currentUser.name} (${match.player1} vs ${match.player2})`
        );
      }
    }

    pendingMatchConnections = [];
    console.log("✅ Queue de connexions vidée");
  }

  fetchCurrentUser().then(() => {
    console.log("✅ CurrentUser prêt, initialisation des WebSockets");
    connectTournamentWebSocket();
  });

  // 🔧 FONCTION CRITIQUE MANQUANTE - Créer un conteneur persistant pour chaque match
  function createOrGetMatchContainer(match): HTMLDivElement {
    const existingContainer = sceneContainers.get(match.roomId);
    if (existingContainer) {
      console.log(`♻️ Réutilisation conteneur existant pour ${match.roomId}`);

      const scoreElement = existingContainer.querySelector(
        `#score-${match.roomId}`
      );
      if (scoreElement) {
        scoreElement.textContent = `${match.scoreP1 || 0} - ${
          match.scoreP2 || 0
        }`;
      }
      return existingContainer;
    }

    console.log(`🎮 Création nouveau conteneur pour match ${match.roomId}`);

    const container = document.createElement("div");
    container.className =
      "mb-8 border-2 border-gray-200 rounded-lg overflow-hidden";
    container.setAttribute("data-match-id", match.roomId);

    const header = document.createElement("div");
    header.className = "bg-gray-100 px-4 py-3 border-b";

    const matchTitle = document.createElement("h4");
    matchTitle.className = "font-semibold text-lg";
    matchTitle.textContent = `${match.player1} vs ${match.player2}`;

    const scoreDisplay = document.createElement("div");
    scoreDisplay.className =
      "text-center font-bold text-2xl mt-2 text-blue-600";
    scoreDisplay.id = `score-${match.roomId}`;
    scoreDisplay.textContent = `${match.scoreP1 || 0} - ${match.scoreP2 || 0}`;

    header.appendChild(matchTitle);
    header.appendChild(scoreDisplay);

    const gameArea = document.createElement("div");
    gameArea.className = "p-4 bg-white";

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 500;
    canvas.className = "w-full border border-gray-300 rounded";
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
    canvas.setAttribute("data-room-id", match.roomId);

    gameArea.appendChild(canvas);
    container.appendChild(header);
    container.appendChild(gameArea);

    sceneContainers.set(match.roomId, container);

    // Créer la scène seulement si elle n'existe pas
    if (!scenes.has(match.roomId)) {
      try {
        console.log(`🎮 Création scène Babylon pour match ${match.roomId}`);
        const scene = createBabylonScene(canvas);
        scenes.set(match.roomId, scene);
        scene._preventAutoDispose = true;
      } catch (error) {
        console.error(`❌ Erreur création scène ${match.roomId}:`, error);
      }
    } else {
      console.log(`♻️ Réutilisation scène existante pour ${match.roomId}`);
    }

    return container;
  }

  function formatMatchScore(match: Match): string {
    const score = `${match.scoreP1 || 0}-${match.scoreP2 || 0}`;

    if (match.status === "finished" && match.winner) {
      return `✅ ${match.player1} vs ${match.player2} → ${match.winner} gagne (${score})`;
    } else if (match.status === "playing") {
      return `🎮 ${match.player1} vs ${match.player2} (${score})`;
    } else {
      return `⏳ ${match.player1} vs ${match.player2} (en attente)`;
    }
  }

  function updateScoreDisplay(
    roomId: string,
    scoreP1: number,
    scoreP2: number,
    isFinished: boolean = false
  ): void {
    const scoreElement = document.getElementById(`score-${roomId}`);
    if (scoreElement) {
      if (isFinished) {
        scoreElement.textContent = `TERMINÉ: ${scoreP1} - ${scoreP2}`;
        scoreElement.className = scoreElement.className.replace(
          "text-blue-600",
          "text-green-600"
        );
      } else {
        scoreElement.textContent = `${scoreP1} - ${scoreP2}`;
      }
    }
  }

  // 🔧 FONCTION DE RENDU PRINCIPALE
  function renderTournament(data) {
    if (isRenderingInProgress) {
      console.log("⚠️ Rerender ignoré - rendu en cours");
      return;
    }

    isRenderingInProgress = true;

    console.log("🔄 renderTournament appelé avec:", {
      exists: data.exists,
      state: data.state,
      round: data.round,
      matches: data.matches?.length || 0,
      players: data.players?.length || 0,
      currentUser: currentUser?.name || "null",
    });

    lastTournamentData = data;
    updateUserDebugInfo();

    if (!data.exists) {
      console.log("❌ Aucun tournoi actif");
      if (stateText) stateText.innerText = "Aucun tournoi actif.";
      if (playerList) playerList.innerHTML = "";
      if (gameSceneContainer) gameSceneContainer.innerHTML = "";
      isRenderingInProgress = false;
      return;
    }

    if (stateText) {
      stateText.innerText = `État: ${data.state} | Round: ${data.round}`;
    }

    removeExistingButtons();

    switch (data.state) {
      case "waiting":
        renderWaitingState(data);
        break;
      case "running":
        renderRunningState(data);
        break;
      case "completed_round":
        renderCompletedRoundState(data);
        break;
      case "completed":
        renderCompletedState(data);
        break;
    }

    isRenderingInProgress = false;
  }

  function removeExistingButtons(): void {
    const existingButtons = ["startTournamentBtn", "nextRoundBtn"];
    existingButtons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      if (button) button.remove();
    });
  }

  function renderWaitingState(data) {
    if (!playerList) {
      console.error("❌ playerList element not found!");
      return;
    }

    // Nettoyer les conteneurs
    if (gameSceneContainer) gameSceneContainer.innerHTML = "";
    playerList.innerHTML = "";

    console.log("🔄 Rendu état waiting:", data);

    const title = document.createElement("h3");
    title.className = "text-lg font-semibold mb-2";
    title.textContent = `Joueurs inscrits (${data.players?.length || 0})`;
    playerList.appendChild(title);

    if (
      data.players &&
      Array.isArray(data.players) &&
      data.players.length > 0
    ) {
      data.players.forEach((player) => {
        const playerId =
          player.id !== null && player.id !== undefined
            ? String(player.id)
            : "";
        const playerIdDisplay =
          playerId.length > 8 ? playerId.slice(0, 8) + "..." : playerId;

        const li = document.createElement("li");
        li.className =
          "flex items-center space-x-2 p-2 bg-gray-100 rounded mb-1";
        li.innerHTML = `
          <span class="w-3 h-3 bg-green-500 rounded-full"></span>
          <span class="font-medium">${
            player.name || playerId || "Joueur anonyme"
          }</span>
          <span class="text-sm text-gray-500">(${
            playerIdDisplay || "ID inconnu"
          })</span>
        `;
        playerList.appendChild(li);
      });
    } else {
      const emptyMsg = document.createElement("p");
      emptyMsg.className = "text-gray-500 italic mb-4";
      emptyMsg.textContent = "Aucun joueur inscrit pour le moment";
      playerList.appendChild(emptyMsg);
    }

    if (
      data.players &&
      Array.isArray(data.players) &&
      data.players.length >= 2
    ) {
      const startBtn = document.createElement("button");
      startBtn.id = "startTournamentBtn";
      startBtn.textContent = "Démarrer le tournoi";
      startBtn.className =
        "bg-green-600 text-white px-6 py-3 rounded mt-4 hover:bg-green-700 font-semibold block w-full";
      startBtn.addEventListener("click", startTournament);
      playerList.appendChild(startBtn);
    } else {
      const warning = document.createElement("p");
      warning.className =
        "text-amber-600 font-medium mt-4 p-3 bg-amber-50 rounded border-l-4 border-amber-400";
      warning.textContent = `⚠️ Minimum 2 joueurs requis pour démarrer (actuellement: ${
        data.players?.length || 0
      })`;
      playerList.appendChild(warning);
    }
  }

  function renderRunningState(data) {
    if (!data.matches) return;
    if (!playerList) return;

    console.log("🎮 renderRunningState - currentUser:", currentUser);

    playerList.innerHTML = "";

    const roundTitle = document.createElement("h3");
    roundTitle.className = "text-xl font-bold mb-4 text-center";
    roundTitle.textContent = `🏆 ROUND ${data.round}`;
    playerList.appendChild(roundTitle);

    // Vérifier si le joueur actuel est qualifié automatiquement
    const currentUserName = currentUser?.name;
    const isCurrentUserAutoQualified =
      data.qualified &&
      data.qualified.some(
        (player) =>
          player.name === currentUserName || player.id === currentUser?.id
      );

    // 🔧 NOUVEAU: Vérifier si le joueur actuel participe à un match de ce round
    const currentUserMatch = data.matches.find(
      (match) =>
        match.player1 === currentUserName ||
        match.player2 === currentUserName ||
        match.player1 === currentUser?.id ||
        match.player2 === currentUser?.id
    );

    // 🔧 NOUVEAU: Vérifier si le joueur actuel a été éliminé (pas dans les matchs ET pas qualifié)
    const isCurrentUserEliminated =
      currentUser &&
      !currentUserMatch &&
      !isCurrentUserAutoQualified &&
      data.state === "running" &&
      data.round > 1; // Seulement après le premier round

    // Afficher un message pour le joueur qualifié automatiquement
    if (isCurrentUserAutoQualified && currentUserName) {
      const qualifiedMessage = document.createElement("div");
      qualifiedMessage.className =
        "mb-6 p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg text-center";
      qualifiedMessage.innerHTML = `
        <div class="text-6xl mb-4">🏆</div>
        <h3 class="text-2xl font-bold text-yellow-800 mb-2">Qualifié Automatiquement!</h3>
        <p class="text-yellow-700 text-lg mb-3">
          <strong>${currentUserName}</strong>, vous passez directement au round suivant!
        </p>
        <p class="text-yellow-600 text-sm">
          (Nombre impair de joueurs - vous n'avez pas besoin de jouer ce round)
        </p>
        <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p class="text-sm text-yellow-800">
            🍿 Regardez les autres matchs en attendant le round suivant
          </p>
        </div>
      `;
      playerList.appendChild(qualifiedMessage);
      console.log(`⭐ ${currentUserName} est qualifié automatiquement`);
    }

    // 🔧 NOUVEAU: Afficher un message pour le joueur éliminé
    if (isCurrentUserEliminated) {
      const eliminatedMessage = document.createElement("div");
      eliminatedMessage.className =
        "mb-6 p-6 bg-gradient-to-r from-red-100 to-red-200 border-2 border-red-400 rounded-lg text-center";
      eliminatedMessage.innerHTML = `
        <div class="text-6xl mb-4">😔</div>
        <h3 class="text-2xl font-bold text-red-800 mb-2">Éliminé du Tournoi</h3>
        <p class="text-red-700 text-lg mb-3">
          <strong>${currentUserName}</strong>, vous avez été éliminé au round précédent.
        </p>
        <p class="text-red-600 text-sm mb-3">
          Merci d'avoir participé ! Vous pouvez encore regarder les matchs en cours.
        </p>
        <div class="mt-4 p-3 bg-red-50 rounded-lg">
          <p class="text-sm text-red-800">
            👀 Regardez les autres matchs pour voir qui remportera le tournoi
          </p>
        </div>
      `;
      playerList.appendChild(eliminatedMessage);
      console.log(`💀 ${currentUserName} a été éliminé du tournoi`);
    }

    // Vérifier si tous les matchs sont terminés
    const allMatchesFinished = data.matches.every(
      (match) => match.status === "finished" && match.winner
    );

    // Afficher le statut des matchs en cours
    if (data.matches.length > 0) {
      const statusDiv = document.createElement("div");
      statusDiv.className =
        "mb-4 p-3 bg-blue-50 border border-blue-200 rounded";

      const finishedCount = data.matches.filter(
        (m) => m.status === "finished"
      ).length;
      const totalCount = data.matches.length;

      statusDiv.innerHTML = `
        <p class="text-sm text-blue-700">
          📊 Progression: ${finishedCount}/${totalCount} matchs terminés
        </p>
        ${
          allMatchesFinished
            ? '<p class="text-green-600 font-semibold mt-1">✅ Tous les matchs sont terminés!</p>'
            : '<p class="text-orange-600 mt-1">⏳ Matchs en cours...</p>'
        }
      `;
      playerList.appendChild(statusDiv);
    }

    data.matches.forEach((match) => {
      // Vérifier si le match est déjà terminé
      if (match.status === "finished" && match.winner) {
        console.log(
          `⏭️ Match ${match.roomId} déjà terminé (${match.winner} gagne)`
        );
        finishedMatches.set(match.roomId, {
          winner: match.winner,
          loser: match.player1 === match.winner ? match.player2 : match.player1,
          scoreP1: match.scoreP1,
          scoreP2: match.scoreP2,
          timestamp: Date.now(),
        });
        showFinishedMatchSummary(match);
        return;
      }

      // 🔧 CORRECTION: Vérifier si le joueur actuel participe à ce match
      const isCurrentUserInThisMatch =
        currentUser &&
        (match.player1 === currentUser.name ||
          match.player2 === currentUser.name ||
          match.player1 === currentUser.id ||
          match.player2 === currentUser.id);

      // 🔧 LOGIQUE AMÉLIORÉE: Créer la scène selon plusieurs conditions
      const shouldCreateScene =
        // Si le joueur participe à ce match spécifique
        isCurrentUserInThisMatch ||
        // Si le joueur n'est ni qualifié auto, ni éliminé, ni participant (spectateur général)
        (!isCurrentUserAutoQualified &&
          !isCurrentUserEliminated &&
          !currentUserMatch);

      if (shouldCreateScene) {
        // Créer la scène de jeu pour ce match
        let existingMatchDiv = gameSceneContainer.querySelector(
          `[data-match-id="${match.roomId}"]`
        );

        if (!existingMatchDiv) {
          console.log(
            `🆕 Ajout nouveau match ${match.roomId} dans le conteneur persistant`
          );
          const matchContainer = createOrGetMatchContainer(match);
          gameSceneContainer.appendChild(matchContainer);
        } else {
          console.log(
            `♻️ Match ${match.roomId} déjà présent dans le conteneur`
          );
          const scoreElement = existingMatchDiv.querySelector(
            `#score-${match.roomId}`
          );
          if (scoreElement) {
            scoreElement.textContent = `${match.scoreP1 || 0} - ${
              match.scoreP2 || 0
            }`;
          }
        }
      } else {
        console.log(
          `⭐ Pas de scène créée pour ${match.roomId} - joueur ${currentUser?.name} non concerné`
        );
        // Afficher juste un résumé spectateur pour ce match
        showMatchSpectatorView(match);
      }

      // 🔧 CONNEXION WEBSOCKET: Seulement pour les participants actifs de ce match
      if (
        isCurrentUserInThisMatch &&
        currentUser &&
        match.status !== "finished"
      ) {
        if (!gameConnections.has(match.roomId)) {
          console.log(
            `🔗 Planification connexion ${match.roomId} pour ${currentUser.name}`
          );
          setTimeout(() => {
            if (!gameConnections.has(match.roomId)) {
              connectToMatch(match.roomId, currentUser.name);
            }
          }, 200);
        }
      }
    });

    // Afficher le bouton "Round Suivant" si tous les matchs sont finis
    if (allMatchesFinished && data.matches.length > 0) {
      showNextRoundButton();
    }

    checkAllMatchesCompleted();
  }

  // Fonction pour afficher le bouton Round Suivant
  function showNextRoundButton() {
    const existingButton = document.getElementById("nextRoundBtn");
    if (existingButton) return;
    if (!playerList) return;

    const nextRoundSection = document.createElement("div");
    nextRoundSection.className =
      "mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center";

    const readyMessage = document.createElement("p");
    readyMessage.className = "text-green-800 font-semibold mb-4";
    readyMessage.textContent =
      "🎉 Tous les matchs sont terminés! Prêt pour le round suivant?";

    const nextBtn = document.createElement("button");
    nextBtn.id = "nextRoundBtn";
    nextBtn.textContent = "🚀 Lancer le Round Suivant";
    nextBtn.className =
      "bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold text-lg shadow-lg transform hover:scale-105 transition-all";

    nextBtn.addEventListener("click", nextRound);

    nextRoundSection.appendChild(readyMessage);
    nextRoundSection.appendChild(nextBtn);
    playerList.appendChild(nextRoundSection);
  }

  // 🔧 FONCTION MANQUANTE: Vue spectateur pour les matchs des autres joueurs
  function showMatchSpectatorView(match) {
    // Éviter les doublons
    const existingSpectatorView = document.querySelector(
      `[data-spectator-match-id="${match.roomId}"]`
    );
    if (existingSpectatorView) {
      // Mettre à jour le score
      const scoreElement =
        existingSpectatorView.querySelector(".spectator-score");
      if (scoreElement) {
        scoreElement.textContent = `${match.scoreP1 || 0} - ${
          match.scoreP2 || 0
        }`;
      }
      return;
    }

    const spectatorDiv = document.createElement("div");
    spectatorDiv.className =
      "mb-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg";
    spectatorDiv.setAttribute("data-spectator-match-id", match.roomId);

    const statusColor =
      match.status === "finished" ? "text-green-600" : "text-blue-600";
    const statusIcon = match.status === "finished" ? "🏁" : "⚡";
    const statusText = match.status === "finished" ? "TERMINÉ" : "EN COURS";

    spectatorDiv.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex-1">
          <h4 class="font-semibold text-lg mb-1">
            ${match.player1} <span class="text-gray-500">vs</span> ${
      match.player2
    }
          </h4>
          <p class="text-sm text-gray-600">👀 Vue spectateur</p>
          ${
            match.status === "finished" && match.winner
              ? `<p class="text-sm text-green-600 font-medium mt-1">🏆 Gagnant: ${match.winner}</p>`
              : ""
          }
        </div>
        <div class="text-right">
          <div class="text-2xl font-mono font-bold spectator-score">
            ${match.scoreP1 || 0} - ${match.scoreP2 || 0}
          </div>
          <div class="text-sm ${statusColor} font-medium">
            ${statusIcon} ${statusText}
          </div>
        </div>
      </div>
    `;

    if (playerList) {
      playerList.appendChild(spectatorDiv);
    }
  }

  function showFinishedMatchSummary(match) {
    const summaryDiv = document.createElement("div");
    summaryDiv.className =
      "mb-4 p-4 bg-gray-100 rounded-lg border-2 border-gray-300";
    summaryDiv.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <span class="text-green-600 font-bold">${match.winner} 🏆</span>
          <span class="text-gray-500">a battu</span>
          <span class="text-gray-400 line-through">${
            match.player1 === match.winner ? match.player2 : match.player1
          }</span>
        </div>
        <div class="text-2xl font-mono font-bold">
          ${match.scoreP1} - ${match.scoreP2}
        </div>
      </div>
    `;

    if (playerList) {
      playerList.appendChild(summaryDiv);
    }
  }

  function renderCompletedRoundState(data: TournamentData): void {
    if (!playerList || !data.matches) return;

    playerList.innerHTML = "";

    const completedTitle = document.createElement("h3");
    completedTitle.className =
      "text-xl font-bold mb-4 text-green-600 text-center";
    completedTitle.textContent = `✅ ROUND ${data.round} TERMINÉ`;
    playerList.appendChild(completedTitle);

    const resultsSection = document.createElement("div");
    resultsSection.className = "space-y-3 mb-6";

    data.matches.forEach((match) => {
      const result = document.createElement("div");
      result.className = "p-3 bg-green-50 border-l-4 border-green-500 rounded";
      result.textContent = formatMatchScore(match);
      resultsSection.appendChild(result);
    });

    playerList.appendChild(resultsSection);

    const winners = data.matches
      .filter((m) => m.winner)
      .map((m) => data.players.find((p) => p.name === m.winner))
      .filter(Boolean);
    const qualified = data.qualified || [];
    const allQualified = [...winners, ...qualified];

    if (allQualified.length > 0) {
      const qualifiedSection = document.createElement("div");
      qualifiedSection.className = "mb-6";

      const qualifiedTitle = document.createElement("h4");
      qualifiedTitle.className = "text-lg font-semibold mb-3";
      qualifiedTitle.textContent = "🌟 Qualifiés pour le prochain round";
      qualifiedSection.appendChild(qualifiedTitle);

      const qualifiedGrid = document.createElement("div");
      qualifiedGrid.className = "grid grid-cols-2 md:grid-cols-3 gap-2";

      allQualified.forEach((player) => {
        const playerCard = document.createElement("div");
        playerCard.className =
          "p-2 bg-blue-100 border border-blue-300 rounded text-center font-medium";
        playerCard.textContent = player?.name || "Unknown";
        qualifiedGrid.appendChild(playerCard);
      });

      qualifiedSection.appendChild(qualifiedGrid);
      playerList.appendChild(qualifiedSection);
    }

    const nextRoundInfo = document.createElement("div");
    nextRoundInfo.className =
      "mb-4 p-3 bg-blue-50 border border-blue-300 rounded";
    nextRoundInfo.innerHTML = `
      <p class="text-blue-700 text-center font-medium">
        👥 N'importe quel joueur peut lancer le round suivant!
      </p>
    `;
    playerList.appendChild(nextRoundInfo);

    showNextRoundButton();
  }

  function renderCompletedState(data: TournamentData): void {
    if (!playerList) return;

    playerList.innerHTML = "";

    const finalTitle = document.createElement("h2");
    finalTitle.className =
      "text-3xl font-bold mb-6 text-center text-yellow-600";
    finalTitle.textContent = "🏆 TOURNOI TERMINÉ 🏆";
    playerList.appendChild(finalTitle);

    if (data.winner) {
      const winnerCard = document.createElement("div");
      winnerCard.className =
        "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-8 rounded-lg mb-8 text-center shadow-lg";

      const crownIcon = document.createElement("div");
      crownIcon.className = "text-6xl mb-4";
      crownIcon.textContent = "👑";

      const winnerTitle = document.createElement("h3");
      winnerTitle.className = "text-2xl font-bold mb-2";
      winnerTitle.textContent = "CHAMPION";

      const winnerName = document.createElement("p");
      winnerName.className = "text-3xl font-bold";
      winnerName.textContent = data.winner.name || data.winner.id;

      winnerCard.appendChild(crownIcon);
      winnerCard.appendChild(winnerTitle);
      winnerCard.appendChild(winnerName);
      playerList.appendChild(winnerCard);
    }

    if (data.matches && data.matches.length > 0) {
      const historySection = document.createElement("div");
      historySection.className = "mt-8";

      const historyTitle = document.createElement("h4");
      historyTitle.className = "text-xl font-bold mb-4";
      historyTitle.textContent = "📊 Historique des matchs finaux";
      historySection.appendChild(historyTitle);

      data.matches.forEach((match) => {
        const matchResult = document.createElement("div");
        matchResult.className =
          "p-3 mb-2 bg-gray-50 border border-gray-200 rounded";
        matchResult.textContent = formatMatchScore(match);
        historySection.appendChild(matchResult);
      });

      playerList.appendChild(historySection);
    }
  }

  function handleMatchEnd(roomId, winner, loser, scoreP1, scoreP2) {
    console.log(`🏁 Traitement fin de match ${roomId}`);

    finishedMatches.set(roomId, {
      winner,
      loser,
      scoreP1,
      scoreP2,
      timestamp: Date.now(),
    });

    showMatchResult(roomId, winner, loser, scoreP1, scoreP2);

    setTimeout(() => {
      const ws = gameConnections.get(roomId);
      if (ws) {
        ws.close();
        gameConnections.delete(roomId);
      }

      const scene = scenes.get(roomId);
      if (scene && scene.cleanup) {
        scene.cleanup();
        scenes.delete(roomId);
      }

      fadeOutMatchContainer(roomId);
    }, 3000);
  }

  function showMatchResult(roomId, winner, loser, scoreP1, scoreP2) {
    const container = document.querySelector(`[data-match-id="${roomId}"]`);
    if (!container) return;

    const resultOverlay = document.createElement("div");
    resultOverlay.className = "match-result-overlay";
    resultOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.5s ease-in;
    `;

    resultOverlay.innerHTML = `
      <div class="text-center text-white p-8 animate-pulse">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-4xl font-bold mb-4">Match Terminé!</h2>
        <div class="text-2xl mb-2">
          <span class="text-yellow-400 font-bold">${winner}</span> 
          <span class="text-gray-300">remporte la victoire!</span>
        </div>
        <div class="text-3xl font-mono mt-4 mb-4">
          ${scoreP1} - ${scoreP2}
        </div>
        <div class="text-gray-400 text-lg">
          ${loser} a bien combattu
        </div>
        <div class="mt-6 text-sm text-gray-500">
          Fermeture dans 3 secondes...
        </div>
      </div>
    `;

    if (!document.getElementById("match-animations")) {
      const style = document.createElement("style");
      style.id = "match-animations";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .match-container-closing {
          animation: fadeOut 0.5s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }

    container.style.position = "relative";
    container.appendChild(resultOverlay);

    const header = container.querySelector("h4");
    if (header) {
      header.innerHTML = `
        <span class="line-through text-gray-500">${loser}</span> 
        vs 
        <span class="text-green-600 font-bold">${winner} 🏆</span>
      `;
    }

    const scoreDisplay = container.querySelector(`#score-${roomId}`);
    if (scoreDisplay) {
      scoreDisplay.className =
        "text-center font-bold text-2xl mt-2 text-green-600";
      scoreDisplay.textContent = `TERMINÉ: ${scoreP1} - ${scoreP2}`;
    }
  }

  function fadeOutMatchContainer(roomId) {
    const container = document.querySelector(`[data-match-id="${roomId}"]`);
    if (!container) return;

    container.classList.add("match-container-closing");

    setTimeout(() => {
      container.remove();
      sceneContainers.delete(roomId);
      checkAllMatchesCompleted();
    }, 500);
  }

  function checkAllMatchesCompleted() {
    if (!lastTournamentData || !lastTournamentData.matches) return;

    const allMatchesFinished = lastTournamentData.matches.every(
      (match) =>
        finishedMatches.has(match.roomId) || match.status === "finished"
    );

    if (
      allMatchesFinished &&
      lastTournamentData.state === "running" &&
      lastTournamentData.matches.length > 0
    ) {
      console.log("✅ Tous les matchs du round sont terminés!");
      showRoundSummary();
      setTimeout(() => {
        showNextRoundButton();
      }, 2000);
    }
  }

  function showRoundSummary() {
    if (gameSceneContainer) {
      gameSceneContainer.innerHTML = "";
    }

    const summary = document.createElement("div");
    summary.className =
      "round-summary p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg";
    summary.style.cssText = "animation: slideUp 0.5s ease-out;";

    const winners = [];
    const results = [];

    for (const [roomId, matchData] of finishedMatches) {
      winners.push(matchData.winner);
      results.push({
        winner: matchData.winner,
        loser: matchData.loser,
        score: `${matchData.scoreP1}-${matchData.scoreP2}`,
      });
    }

    summary.innerHTML = `
      <h3 class="text-2xl font-bold text-center mb-4 text-green-600">
        🎉 Round ${lastTournamentData.round} Terminé! 🎉
      </h3>
      
      <div class="space-y-3 mb-6">
        <h4 class="text-lg font-semibold text-gray-700">Résultats des matchs:</h4>
        ${results
          .map(
            (r) => `
          <div class="flex justify-between items-center p-3 bg-white rounded-lg shadow">
            <span class="font-medium">
              <span class="text-green-600">✓ ${r.winner}</span> 
              <span class="text-gray-400">bat</span> 
              <span class="text-red-500">${r.loser}</span>
            </span>
            <span class="font-mono text-lg font-bold">${r.score}</span>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div class="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
        <h4 class="text-lg font-bold text-yellow-800 mb-2">🏆 Qualifiés pour le prochain round:</h4>
        <div class="flex flex-wrap gap-2">
          ${winners
            .map(
              (w) => `
            <span class="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full font-medium">
              ${w}
            </span>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    if (playerList) {
      playerList.appendChild(summary);
    }

    finishedMatches.clear();
  }

  function connectToMatch(roomId: string, playerName: string) {
    if (gameConnections.has(roomId)) {
      console.log(`⚠️ Déjà connecté à ${roomId}`);
      return;
    }

    console.log(`🔗 Connexion match ${roomId} pour ${playerName}`);

    const scene = scenes.get(roomId);
    if (!scene) {
      console.error(`❌ Scène non trouvée pour ${roomId}`);
      return;
    }

    const gameWs = new WebSocket(`wss://${window.location.hostname}:5173/ws`);
    gameConnections.set(roomId, gameWs);

    gameWs.onopen = () => {
      console.log(`✅ WebSocket connecté ${roomId}`);

      if (scene?.setWebSocket) {
        scene.setWebSocket(gameWs);
      }

      gameWs.send(
        JSON.stringify({
          type: "joinRoom",
          connectionId: playerName,
          playerName: playerName,
        })
      );
    };

    gameWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log(`📨 [${roomId}] Message:`, msg.type);

        switch (msg.type) {
          case "assign":
            if (scene?.setPlayerNumber && msg.player) {
              scene.setPlayerNumber(msg.player);
            }
            break;

          case "state":
            if (scene?.updateGameState && msg.gameState) {
              scene.updateGameState(msg.gameState);
              updateScoreDisplay(
                roomId,
                msg.gameState.scoreP1,
                msg.gameState.scoreP2
              );
            }
            break;

          case "scoreUpdate":
            updateScoreDisplay(roomId, msg.scoreP1, msg.scoreP2);
            break;

          case "gameEnd":
            console.log(
              `🏁 Fin de match ${roomId}: ${msg.winner} gagne ${msg.scoreP1}-${msg.scoreP2}`
            );
            handleMatchEnd(
              roomId,
              msg.winner,
              msg.loser,
              msg.scoreP1,
              msg.scoreP2
            );
            break;
        }
      } catch (e) {
        console.error("Erreur parsing:", e);
      }
    };

    gameWs.onclose = () => {
      console.log(`🔌 WebSocket fermé ${roomId}`);
      gameConnections.delete(roomId);
    };

    gameWs.onerror = (error) => {
      console.error(`❌ Erreur WebSocket ${roomId}:`, error);
    };
  }

  async function startTournament(): Promise<void> {
    try {
      const response = await fetch("/api/tournament/start", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🚀 Tournoi démarré:", result);
        alert("Tournoi démarré !");
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Échec du démarrage"}`);
      }
    } catch (error) {
      console.error("Erreur démarrage tournoi:", error);
      alert("Erreur de connexion");
    }
  }

  async function nextRound(): Promise<void> {
    try {
      const response = await fetch("/api/tournament/next", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        console.log("➡️ Round suivant:", result);

        if (result.finished) {
          alert(
            `Tournoi terminé ! Gagnant: ${result.winner?.name || "Inconnu"}`
          );
        } else {
          alert(`Round ${result.round} lancé !`);
        }
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Échec du passage au round suivant"}`);
      }
    } catch (error) {
      console.error("Erreur round suivant:", error);
      alert("Erreur de connexion");
    }
  }

  function connectTournamentWebSocket(): void {
    if (tournamentWebSocket) {
      tournamentWebSocket.close();
    }

    tournamentWebSocket = new WebSocket(
      `wss://${window.location.hostname}:5173/ws?type=tournament`
    );

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 1000;

    tournamentWebSocket.onopen = () => {
      console.log("📡 WebSocket tournoi connecté");
    };

    tournamentWebSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const now = Date.now();

        if (now - lastUpdateTime < UPDATE_THROTTLE) {
          console.log("🚫 Update throttlé, trop rapide");
          return;
        }

        console.log("📨 Message WebSocket reçu:", {
          type: msg.type,
          exists: msg.data?.exists,
          state: msg.data?.state,
          playersCount: msg.data?.players?.length || 0,
        });

        if (msg.type === "update" && msg.data) {
          lastUpdateTime = now;
          renderTournament(msg.data);
        }
      } catch (e) {
        console.error("❌ Erreur parsing message WebSocket:", e);
      }
    };

    tournamentWebSocket.onclose = () => {
      console.warn("📡 WebSocket tournoi fermé - tentative de reconnexion...");
      setTimeout(connectTournamentWebSocket, 2000);
    };

    tournamentWebSocket.onerror = (error) => {
      console.error("❌ Erreur WebSocket tournoi:", error);
    };
  }

  // Event listeners pour les boutons
  const joinBtn = document.getElementById("joinTournamentBtn");
  joinBtn?.addEventListener("click", async () => {
    try {
      console.log("🔄 Tentative d'inscription au tournoi");

      const response = await fetch("/api/tournament/join", {
        method: "POST",
        credentials: "include",
      });

      console.log("📡 Réponse inscription:", {
        ok: response.ok,
        status: response.status,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Réponse inscription:", result);

        if (result.player) {
          currentUser = {
            id: String(result.player.id),
            name: result.player.name,
          };
          console.log("✅ Utilisateur inscrit:", currentUser);
          updateUserDebugInfo();
          alert("Inscription réussie !");

          processPendingMatchConnections();

          try {
            localStorage.setItem("debugUser", JSON.stringify(currentUser));
            console.log(
              "💾 Utilisateur sauvegardé dans localStorage pour debug"
            );
          } catch (e) {
            console.warn("⚠️ Impossible de sauvegarder dans localStorage");
          }
        }
      } else {
        const error = await response.json();
        console.error("❌ Erreur inscription:", error);
        alert(`Erreur: ${error.error || "Échec de l'inscription"}`);
      }
    } catch (error) {
      console.error("❌ Erreur inscription:", error);
      alert("Erreur de connexion");
    }
  });

  const resetBtn = document.getElementById("newTournamentBtn");
  resetBtn?.addEventListener("click", async () => {
    if (!confirm("Êtes-vous sûr de vouloir créer un nouveau tournoi ?")) return;

    // Nettoyage propre
    for (const [roomId, ws] of gameConnections.entries()) {
      ws.close();
    }
    gameConnections.clear();

    for (const [roomId, scene] of scenes.entries()) {
      try {
        if (scene && scene.cleanup) {
          scene.cleanup();
        }
      } catch (error) {
        console.error(`❌ Erreur cleanup scène ${roomId}:`, error);
      }
    }
    scenes.clear();

    sceneContainers.clear();
    if (gameSceneContainer) gameSceneContainer.innerHTML = "";
    pendingMatchConnections = [];

    try {
      const response = await fetch("/api/tournament/new", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        alert("✅ Nouveau tournoi créé !");
      } else {
        alert("❌ Erreur lors de la création du tournoi");
      }
    } catch (error) {
      console.error("Erreur création tournoi:", error);
      alert("Erreur de connexion");
    }
  });

  const debugUserBtn = document.getElementById("debugUserBtn");
  debugUserBtn?.addEventListener("click", debugUser);

  const forceConnectBtn = document.getElementById("forceConnectBtn");
  forceConnectBtn?.addEventListener("click", forceConnect);

  window.addEventListener("beforeunload", () => {
    if (tournamentWebSocket) {
      tournamentWebSocket.close();
    }

    for (const ws of gameConnections.values()) {
      ws.close();
    }

    for (const [roomId, scene] of scenes.entries()) {
      try {
        if (scene && scene.cleanup) {
          console.log(`🧹 Cleanup scène ${roomId}`);
          scene.cleanup();
        }
      } catch (error) {
        console.error(`❌ Erreur cleanup scène ${roomId}:`, error);
      }
    }
  });
}, 300);
  return "";
}
