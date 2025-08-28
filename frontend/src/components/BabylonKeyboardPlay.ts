import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

function makePaddle(scene: any, size: number, radius: number, angle: number) {
  let paddle = MeshBuilder.CreateBox("paddle", { width: size, height: 0.75, depth: 0.25 }, scene);
  paddle.position.x = radius * Math.sin(angle);
  paddle.position.z = radius * Math.cos(angle);
  return paddle;
}

function buildObjects(scene: any, canvas: any, FIELD_DEPTH: number, FIELD_WIDTH: number) {
  const ground = MeshBuilder.CreateBox("ground", { width: FIELD_WIDTH, height: 0.1, depth: FIELD_DEPTH }, scene);
  ground.position.y = -0.5;

  const paddleOne = makePaddle(scene, 2, FIELD_DEPTH / 2, 0);
  const paddleTwo = makePaddle(scene, 2, FIELD_DEPTH / 2, Math.PI);

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);

  return {paddleOne, paddleTwo, ball};
}

function setupVisuals(scene: any, canvas: any, FIELD_DEPTH: number, FIELD_WIDTH: number) {
  const camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.x = Math.PI / 2;
  camera.attachControl(canvas, true);
  camera.setTarget(Vector3.Zero());
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
}

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  // Paramètres du terrain

  const FIELD_WIDTH = 13.5;
  const FIELD_DEPTH = 7.5;
  let gameStarted = false;

  const {paddleOne, paddleTwo, ball} = buildObjects(scene, canvas, FIELD_DEPTH, FIELD_WIDTH);
  setupVisuals(scene, canvas, FIELD_DEPTH, FIELD_WIDTH);

  //Score 
  let score = { p1: 0, p2: 0 };
  let scoreCallback: ((score: { p1: number; p2: number }) => void) | null =
    null;

  function onScoreUpdate(cb: (score: { p1: number; p2: number }) => void) {
    scoreCallback = cb;
  }

  // Direction de la balle

  let ballDirection = new Vector3(0.05, 0, 0.1);


  // Clavier

  const keysTwo = { left: false, right: false };

  const keysOne = { left: false, right: false };

  const PDL_SPD = 0.25;

  // Reset de la partie

  function resetGame() {
    ball.position.set(0, 0, 0);

    ballDirection = new Vector3(
      0.05 * (Math.random() > 0.5 ? 1 : -1),
      0,
      0.1 * (Math.random() > 0.5 ? 1 : -1)
    );

    gameStarted = true;
  }

  // Création de l'interface utilisateur

  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(
    "UI",
    true,
    scene
  );

  const button = Button.CreateSimpleButton("startButton", "Start / Restart");

  button.width = "150px";

  button.height = "40px";

  button.color = "white";

  button.background = "green";

  button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

  button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

  button.top = "20px";

  // Écouteur de clic sur le bouton

  button.onPointerUpObservable.add(() => {
    score.p1 = 0;
    score.p2 = 0;
    if (scoreCallback) scoreCallback(score);
    resetGame(); // Réinitialise la partie
  });

  // Ajoute le bouton à l'UI

  advancedTexture.addControl(button);

  // Gestion des touches pour déplacer les palettes

  scene.onKeyboardObservable.add((kbInfo) => {
    const key = kbInfo.event.key.toLowerCase();

    switch (kbInfo.type) {
      case KeyboardEventTypes.KEYDOWN:
        if (key === "a") keysOne.left = true;
        if (key === "d") keysOne.right = true;
        if (key === "j") keysTwo.left = true;
        if (key === "l") keysTwo.right = true;
        break;

      case KeyboardEventTypes.KEYUP:
        if (key === "a") keysOne.left = false;
        if (key === "d") keysOne.right = false;
        if (key === "j") keysTwo.left = false;
        if (key === "l") keysTwo.right = false;

        break;
    }
  });

  // Boucle de rendu

  engine.runRenderLoop(() => {
    // Déplacement de la balle

    if (gameStarted) {
      if(score.p1 < 11 && score.p2 < 11)
            ball.position.addInPlace(ballDirection);

      // Rebond sur les murs gauche/droit

      if (
        ball.position.x <= -FIELD_WIDTH / 2 ||
        ball.position.x >= FIELD_WIDTH / 2
      ) {
        ballDirection.x *= -1;
      }

      // Rebond sur les palettes

      // Paddle 1 collision
      if (
        ball.position.z <= -FIELD_DEPTH / 2 + 0.5 &&
        ball.position.z >= -FIELD_DEPTH / 2 - 0.5 && // tolérance plus large
        Math.abs(ball.position.x - paddleOne.position.x) < 1.1
      ) {
        ball.position.z = -FIELD_DEPTH / 2 + 0.5; // corriger position pour éviter le clip
        ballDirection.z *= -1;
      }

      // Paddle 2 collision
      if (
        ball.position.z >= FIELD_DEPTH / 2 - 0.5 &&
        ball.position.z <= FIELD_DEPTH / 2 + 0.5 && // tolérance plus large
        Math.abs(ball.position.x - paddleTwo.position.x) < 1.1
      ) {
        ball.position.z = FIELD_DEPTH / 2 - 0.5; // corriger position
        ballDirection.z *= -1;
      }

      // Reset si la balle sort du terrain

      if (ball.position.z <= -FIELD_DEPTH) {
        // Player 2 marque
        score.p2++;
        if (scoreCallback) scoreCallback(score);
        resetGame();
      }

      if (ball.position.z >= FIELD_DEPTH) {
        // Player 1 marque
        score.p1++;
        if (scoreCallback) scoreCallback(score);
        resetGame();
      }

      // Déplacement des palettes

      if (keysOne.left) paddleOne.position.x -= PDL_SPD;
      if (keysOne.right) paddleOne.position.x += PDL_SPD;
      if (keysTwo.left) paddleTwo.position.x -= PDL_SPD;
      if (keysTwo.right) paddleTwo.position.x += PDL_SPD;
    }

    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
  return {
    start: () => resetGame(),
    reset: () => {
      score = { p1: 0, p2: 0 };
      if (scoreCallback) scoreCallback(score);
      resetGame();
    },
    onScoreUpdate,
  };
}
