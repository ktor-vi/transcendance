import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";

import { sendMove } from "../socket";
import { GameState } from "../types/GameTypes";
let currentScene: Scene | null = null;
let currentEngine: Engine | null = null;

export function createBabylonScene(canvas: HTMLCanvasElement) {
  // Nettoyer l'ancienne scène si elle existe
  if (currentScene) {
    currentScene.dispose();
  }
  if (currentEngine) {
    currentEngine.dispose();
  }

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  currentEngine = engine;
  currentScene = scene;

  let playerNum = 0;
  const inputState = { left: false, right: false };

  // Création de la scène
  const camera = new FreeCamera("cam", new Vector3(0, 10, -8), scene);
  camera.setTarget(Vector3.Zero());
  camera.attachControl(canvas, true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Terrain de jeu avec les bonnes dimensions
  const ground = MeshBuilder.CreateBox(
    "ground",
    { width: 13.5, height: 0.1, depth: 7.5 }, // Utiliser les mêmes dimensions que le serveur
    scene
  );
  ground.position.y = -0.5;

  // Palettes
  const paddleOne = MeshBuilder.CreateBox(
    "p1",
    { width: 2, height: 0.75, depth: 0.25 },
    scene
  );
  paddleOne.position.set(0, 0, -3.75); // Position joueur 1

  const paddleTwo = MeshBuilder.CreateBox(
    "p2",
    { width: 2, height: 0.75, depth: 0.25 },
    scene
  );
  paddleTwo.position.set(0, 0, 3.75); // Position joueur 2

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);
  ball.position.set(0, 0, 0);

  // Gestion du clavier
  scene.onKeyboardObservable.add((kb) => {
    const key = kb.event.key.toLowerCase();
    const isDown = kb.type === KeyboardEventTypes.KEYDOWN;

    // Touches pour joueur 1 et 2
    if (key === "arrowleft" || key === "a") {
      inputState.left = isDown;
    }
    if (key === "arrowright" || key === "d") {
      inputState.right = isDown;
    }
  });

  // Fonction pour mettre à jour la caméra selon le joueur
  function updateCamera(player: number) {
    if (player === 1) {
      // Joueur 1 : vue depuis le bas du terrain
      camera.position.set(0, 8, -10);
      camera.setTarget(new Vector3(0, 0, 0));
    } else if (player === 2) {
      // Joueur 2 : vue depuis le haut du terrain
      camera.position.set(0, 8, 10);
      camera.setTarget(new Vector3(0, 0, 0));
    }
    camera.attachControl(canvas, true);
  }

  // Fonction pour mettre à jour l'état du jeu
  function updateGameState(gameState: GameState) {
    if (gameState.paddleOne) {
      paddleOne.position.x = gameState.paddleOne.x;
    }
    if (gameState.paddleTwo) {
      paddleTwo.position.x = gameState.paddleTwo.x;
    }
    if (gameState.ball) {
      ball.position.x = gameState.ball.x;
      ball.position.z = gameState.ball.z;
    }
  }

  // Fonction pour définir le numéro du joueur
  function setPlayerNumber(player: number) {
    playerNum = player;
    updateCamera(player);
    console.log(`🎮 Joueur ${player} assigné, caméra mise à jour`);
  }

  // Boucle de rendu
  engine.runRenderLoop(() => {
    if (playerNum > 0 && (inputState.left || inputState.right)) {
      sendMove({
        type: "input",
        left: inputState.left,
        right: inputState.right,
      });
    }
    scene.render();
  });

  // Redimensionnement
  window.addEventListener("resize", () => engine.resize());

  // Nettoyage
  const cleanup = () => {
    if (currentScene === scene) {
      currentScene = null;
    }
    if (currentEngine === engine) {
      currentEngine = null;
    }
    scene.dispose();
    engine.dispose();
  };

  window.addEventListener("beforeunload", cleanup);

  // Retourner les fonctions pour l'usage externe
  return {
    setPlayerNumber,
    updateGameState,
    cleanup,
  };
}
