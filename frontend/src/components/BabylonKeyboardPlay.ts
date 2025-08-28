import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

import {Paddle, Ball, Wall} from "./PongAssets";

function setupVisuals(scene: any, canvas: any, FIELD_DEPTH: number, FIELD_WIDTH: number) {
  const camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.x = Math.PI / 2;//changer ca, ca tourne tout le reste
  camera.attachControl(canvas, true);
  camera.setTarget(Vector3.Zero());
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
}

// Reset de la partie
function resetGame(ball: any) {
  ball.hitbox.position.set(0, 0, 0);
  ball.speed.set(
    0.05 * (Math.random() > 0.5 ? 1 : -1),
    0,
    0.1 * (Math.random() > 0.5 ? 1 : -1)
  );
}

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  // Paramètres du terrain
  const FIELD_WIDTH = 13.5;
  const FIELD_DEPTH = 7.5;
  const PADDLE_WIDTH = 2;
  const PADDLE_HEIGHT = 0.75;
  const PADDLE_DEPTH = 0.25;
  const BALL_SIZE = 0.5;

  // Construit la scène
  const ground = new Wall(scene, FIELD_WIDTH, 0.1, FIELD_DEPTH);
  ground.hitbox.position.set(0, -0.5, 0);
  const paddleOne = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, Math.PI);
  const paddleTwo = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, 0);
  const ball = new Ball(scene, BALL_SIZE);
  setupVisuals(scene, canvas, FIELD_DEPTH, FIELD_WIDTH);
  
  let gameStarted = false;

  //Score 
  let score = { p1: 0, p2: 0 };
  let scoreCallback: ((score: { p1: number; p2: number }) => void) | null =
    null;

  function onScoreUpdate(cb: (score: { p1: number; p2: number }) => void) {
    scoreCallback = cb;
  }

  // Direction de la balle
  ball.speed.set(0.05, 0, 0.1);

  // Clavier
  const keysTwo = { left: false, right: false };
  const keysOne = { left: false, right: false };
  const PDL_SPD = 0.25;

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
    resetGame(ball); // Réinitialise la partie
    gameStarted = true;
  });

  // Ajoute le bouton à l'UI

  advancedTexture.addControl(button);

  // Gestion des touches pour déplacer les palettes

  scene.onKeyboardObservable.add((kbInfo: any) => {
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
            ball.hitbox.position.addInPlace(ball.speed);

      // Rebond sur les murs gauche/droit

      if (
        ball.hitbox.position.x <= -FIELD_WIDTH / 2 ||
        ball.hitbox.position.x >= FIELD_WIDTH / 2
      ) {
        ball.speed.x *= -1;
      }

      // Rebond sur les palettes

      // Paddle 1 collision
      if (
        ball.hitbox.position.z <= -FIELD_DEPTH / 2 + 0.5 &&
        ball.hitbox.position.z >= -FIELD_DEPTH / 2 - 0.5 && // tolérance plus large
        Math.abs(ball.hitbox.position.x - paddleOne.hitbox.position.x) < 1.1
      ) {
        ball.hitbox.position.z = -FIELD_DEPTH / 2 + 0.5; // corriger position pour éviter le clip
        ball.speed.z *= -1;
      }

      // Paddle 2 collision
      if (
        ball.hitbox.position.z >= FIELD_DEPTH / 2 - 0.5 &&
        ball.hitbox.position.z <= FIELD_DEPTH / 2 + 0.5 && // tolérance plus large
        Math.abs(ball.hitbox.position.x - paddleTwo.hitbox.position.x) < 1.1
      ) {
        ball.hitbox.position.z = FIELD_DEPTH / 2 - 0.5; // corriger position
        ball.speed.z *= -1;
      }

      // Reset si la balle sort du terrain

      if (ball.hitbox.position.z <= -FIELD_DEPTH) {
        // Player 2 marque
        score.p2++;
        if (scoreCallback) scoreCallback(score);
        resetGame(ball);
        gameStarted = true;
      }

      if (ball.hitbox.position.z >= FIELD_DEPTH) {
        // Player 1 marque
        score.p1++;
        if (scoreCallback) scoreCallback(score);
        resetGame(ball);
        gameStarted = true;
      }

      // Déplacement des palettes

      if (keysOne.left) paddleOne.hitbox.position.x -= PDL_SPD;
      if (keysOne.right) paddleOne.hitbox.position.x += PDL_SPD;
      if (keysTwo.left) paddleTwo.hitbox.position.x -= PDL_SPD;
      if (keysTwo.right) paddleTwo.hitbox.position.x += PDL_SPD;
    }

    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
  return {
    start: () => {
      resetGame(ball);
      gameStarted = true;
    },
    reset: () => {
      score = { p1: 0, p2: 0 };
      if (scoreCallback) scoreCallback(score);
      resetGame(ball);
      gameStarted = true;
    },
    onScoreUpdate,
  };
}
