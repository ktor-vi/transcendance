import {
  Engine,
  Scene,
  KeyboardEventTypes,
} from "@babylonjs/core";

import {PongModel} from "./PongModel";
import {PongView} from "./PongView";

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  const pong = new PongModel(engine, scene, 2, true);
  const view = new PongView(engine, scene, true);

  let score = { p1: 0, p2: 0 };
  let scoreCallback: ((score: { p1: number; p2: number }) => void) | null = null;
  function onScoreUpdate(cb: (score: { p1: number; p2: number }) => void) {
    scoreCallback = cb;
  }

  // Determine les controles
  pong.camera.attachControl(canvas, true);

  let gameStarted = false;

  // Écouteur de clic sur le bouton
  view.startButton.onPointerUpObservable.add(() => {
    score.p1 = 0;
    score.p2 = 0;
    if (scoreCallback) scoreCallback(score);
    pong.ball.reset();
    pong.ball.launch();
    gameStarted = true;
  });

  // Gestion des touches pour déplacer les palettes
  const keysTwo = { left: false, right: false };
  const keysOne = { left: false, right: false };
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

  scene.registerBeforeRender(() => {
    if (keysOne.left) pong.paddles[0].move("left");
    if (keysOne.right) pong.paddles[0].move("right");
    if (keysTwo.left) pong.paddles[1].move("left");
    if (keysTwo.right) pong.paddles[1].move("right");
    if (pong.collision())
      view.shiny(pong.ball.hitbox.position);
  });

  // Boucle de rendu
  engine.runRenderLoop(() => {

    if (gameStarted) {
      if(score.p1 > 10 || score.p2 > 10){
        pong.ball.reset();
        gameStarted = false;
      }
      // Reset si la balle sort du terrain
      if (pong.score(1)) {
        gameStarted = false;
        // Player 2 marque
        score.p2++;
        if (scoreCallback) scoreCallback(score);
        setTimeout(() => {
          pong.ball.reset();
          pong.ball.launch();
          gameStarted = true;
        }, 1000);
      }

      if (pong.score(0)) {
        gameStarted = false;
        // Player 1 marque
        score.p1++;
        if (scoreCallback) scoreCallback(score);
        setTimeout(() => {
          pong.ball.reset();
          pong.ball.launch();
          gameStarted = true;
        }, 1000);
      }
    }
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });
  return {
    start: () => {
      pong.ball.reset();
      // gameStarted = true;
    },
    reset: () => {
      score = { p1: 0, p2: 0 };
      if (scoreCallback) scoreCallback(score);
      pong.ball.reset();
      gameStarted = true;
    },
    onScoreUpdate,
  };
}
