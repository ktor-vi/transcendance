import {
  KeyboardEventTypes,
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

import {Paddle, Ball, Wall, PongModel} from "./PongModel";
import {PaddleView, BallView, WallView, GroundView, shiny, PongView} from "./PongView";

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {

  const pong = new PongModel(canvas, 2);
  const view = new PongView(pong.engine, pong.scene);

  scene.registerBeforeRender(() => {
    if (ball.hitbox.intersectsMesh(paddleOne.hitbox))
      shiny(scene, ball.hitbox.position, SHINY_IMAGE);
    if (ball.hitbox.intersectsMesh(paddleTwo.hitbox))
      shiny(scene, ball.hitbox.position, SHINY_IMAGE);
    ball.keepOnTrack();
  });

  //Score 
  let score = { p1: 0, p2: 0 };
  let scoreCallback: ((score: { p1: number; p2: number }) => void) | null =
    null;

  function onScoreUpdate(cb: (score: { p1: number; p2: number }) => void) {
    scoreCallback = cb;
  }

  // Clavier
  const keysTwo = { left: false, right: false };
  const keysOne = { left: false, right: false };

  let gameStarted = false;

  // Création de l'interface utilisateur
  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
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
    ball.reset();
    ball.launch();
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
      if(score.p1 >= 10 || score.p2 >= 10){
        ball.reset();
        gameStarted = false;
      }
      // Reset si la balle sort du terrain
      if (ball.hitbox.position.z <= -FIELD_DEPTH) {
        // Player 2 marque
        score.p2++;
        if (scoreCallback) scoreCallback(score);
        ball.reset();
        ball.launch();
        gameStarted = true;
      }

      if (ball.hitbox.position.z >= FIELD_DEPTH) {
        // Player 1 marque
        score.p1++;
        if (scoreCallback) scoreCallback(score);
        ball.reset();
        ball.launch();
        gameStarted = true;
      }

      // Déplacement des palettes
      if (keysOne.left) paddleOne.hitbox.position.x -= PADDLE_SPEED;
      if (keysOne.right) paddleOne.hitbox.position.x += PADDLE_SPEED;
      if (keysTwo.left) paddleTwo.hitbox.position.x -= PADDLE_SPEED;
      if (keysTwo.right) paddleTwo.hitbox.position.x += PADDLE_SPEED;
    }

    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
  return {
    start: () => {
      ball.reset();
      gameStarted = true;
    },
    reset: () => {
      score = { p1: 0, p2: 0 };
      if (scoreCallback) scoreCallback(score);
      ball.reset();
      gameStarted = true;
    },
    onScoreUpdate,
  };
}
