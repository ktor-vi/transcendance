// BabylonScene.ts
import {
  Engine,
  Scene,
  Vector3,
  UniversalCamera,
} from "@babylonjs/core";

import { PongModel } from "./PongModel";
import { PongView } from "./PongView";

export function createBabylonScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  const pong = new PongModel(engine, scene, 2, false);
  const view = new PongView(engine, scene, false);

  let webSocket: WebSocket | null = null;
  let playerNumber = 0;

  let gameState = {
    ball: { x: 0, z: 0 },
    paddleOne: { x: 0 },
    paddleTwo: { x: 0 },
    scoreP1: 0,
    scoreP2: 0,
    gameEnded: false,
  };

  const inputState = {
    left: false,
    right: false,
  };

  const camera = new UniversalCamera("camera", new Vector3(0, 12, -15), scene);
  camera.setTarget(Vector3.Zero());

  pong.paddles[0].hitbox.position.z = -3.5;
  pong.paddles[0].hitbox.position.y = 0.25;

  pong.paddles[1].hitbox.position.z = 3.5;
  pong.paddles[1].hitbox.position.y = 0.25;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      !webSocket ||
      webSocket.readyState !== WebSocket.OPEN ||
      gameState.gameEnded
    )
      return;

    let changed = false;

    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      if (!inputState.left) {
        inputState.left = true;
        changed = true;
      }
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      if (!inputState.right) {
        inputState.right = true;
        changed = true;
      }
    }

    if (changed) {
      webSocket.send(
        JSON.stringify({
          type: "input",
          left: inputState.left,
          right: inputState.right,
          playerNumber,
        })
      );
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (
      !webSocket ||
      webSocket.readyState !== WebSocket.OPEN ||
      gameState.gameEnded
    )
      return;

    let changed = false;

    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      if (inputState.left) {
        inputState.left = false;
        changed = true;
      }
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      if (inputState.right) {
        inputState.right = false;
        changed = true;
      }
    }

    if (changed) {
      webSocket.send(
        JSON.stringify({
          type: "input",
          left: inputState.left,
          right: inputState.right,
          playerNumber,
        })
      );
    }
  };

  canvas.addEventListener("keydown", handleKeyDown);
  canvas.addEventListener("keyup", handleKeyUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  canvas.tabIndex = 1;
  canvas.addEventListener("click", () => {
    canvas.focus();
  });


  
  const inputInterval = setInterval(() => {
    if (
      webSocket &&
      webSocket.readyState === WebSocket.OPEN &&
      playerNumber > 0
    ) {
      if (inputState.left || inputState.right) {
        if(playerNumber == 1){
          webSocket.send(
            JSON.stringify({
              type: "input",
              left: inputState.left,
              right: inputState.right,
              playerNumber,
            })
          );
        }
        if (playerNumber == 2) {
          webSocket.send(
            JSON.stringify({
              type: "input",
              left: inputState.right,
              right: inputState.left,
              playerNumber,
            })
          );
        }
      }
    }
  }, 50);

  function updateGameState(newState: typeof gameState) {
    gameState = { ...gameState, ...newState };

    if (pong.ball.hitbox && newState.ball) {
      pong.ball.hitbox.position.x = newState.ball.x;
      pong.ball.hitbox.position.z = newState.ball.z;
    }

    if (pong.paddles[0].hitbox && newState.paddleOne) {
      pong.paddles[0].hitbox.position.x = newState.paddleOne.x;
    }

    if (pong.paddles[1].hitbox && newState.paddleTwo) {
      pong.paddles[1].hitbox.position.x = newState.paddleTwo.x;
    }
  }

  function setWebSocket(ws: WebSocket) {
    webSocket = ws;
  }

  function setPlayerNumber(num: number) {
    playerNumber = num;

    if (playerNumber === 1) {
      console.log("player 1");
      camera.position = new Vector3(0, 12, -15);
    } else if (playerNumber === 2) {
      console.log("player 2");
      camera.position = new Vector3(0, 12, 15);
      camera.rotation.y = Math.PI;
    }
  }
  scene.registerBeforeRender(() => {
    if (pong.collision())
      view.shiny(pong.ball.hitbox.position);
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  function cleanup() {
    canvas.removeEventListener("keydown", handleKeyDown);
    canvas.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);

    if (inputInterval) {
      clearInterval(inputInterval);
    }

    scene.dispose();
    engine.dispose();
  }

  return {
    scene,
    engine,
    updateGameState,
    setWebSocket,
    setPlayerNumber,
    cleanup,
    getPlayerNumber: () => playerNumber,
    getGameState: () => gameState,
  };
}
