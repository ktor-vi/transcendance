// BabylonScene.ts
import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  UniversalCamera,
} from "@babylonjs/core";

// 🔧 Gestionnaire global simple
let globalEngines = new Map<HTMLCanvasElement, Engine>(); // canvas -> engine
let activeScenes = new Map<string, any>(); // roomId -> sceneData

export function createBabylonScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

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

  scene.clearColor = new Color4(0.1, 0.1, 0.2);

  const camera = new UniversalCamera("camera", new Vector3(0, 12, -15), scene);
  camera.setTarget(Vector3.Zero());

  const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  light1.intensity = 0.7;

  const light2 = new DirectionalLight("light2", new Vector3(0, -1, 1), scene);
  light2.intensity = 0.3;

  const ground = MeshBuilder.CreateBox(
    "ground",
    {
      width: 13.5,
      height: 0.2,
      depth: 7.5,
    },
    scene
  );
  ground.position.y = -0.1;

  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new Color3(0.2, 0.3, 0.4);
  groundMat.emissiveColor = new Color3(0.05, 0.05, 0.1);
  ground.material = groundMat;

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);
  ball.position.y = 0.25;

  const ballMat = new StandardMaterial("ballMat", scene);
  ballMat.diffuseColor = new Color3(1, 1, 1);
  ballMat.emissiveColor = new Color3(0.2, 0.2, 0.2);
  ball.material = ballMat;

  const paddleOne = MeshBuilder.CreateBox(
    "paddleOne",
    {
      width: 2,
      height: 0.5,
      depth: 0.3,
    },
    scene
  );
  paddleOne.position.z = -3.5;
  paddleOne.position.y = 0.25;

  const paddle1Mat = new StandardMaterial("paddle1Mat", scene);
  paddle1Mat.diffuseColor = new Color3(0, 0.5, 1);
  paddle1Mat.emissiveColor = new Color3(0, 0.1, 0.2);
  paddleOne.material = paddle1Mat;

  const paddleTwo = MeshBuilder.CreateBox(
    "paddleTwo",
    {
      width: 2,
      height: 0.5,
      depth: 0.3,
    },
    scene
  );
  paddleTwo.position.z = 3.5;
  paddleTwo.position.y = 0.25;

  const paddle2Mat = new StandardMaterial("paddle2Mat", scene);
  paddle2Mat.diffuseColor = new Color3(1, 0.5, 0);
  paddle2Mat.emissiveColor = new Color3(0.2, 0.1, 0);
  paddleTwo.material = paddle2Mat;

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

    if (ball && newState.ball) {
      ball.position.x = newState.ball.x;
      ball.position.z = newState.ball.z;
    }

    if (paddleOne && newState.paddleOne) {
      paddleOne.position.x = newState.paddleOne.x;
    }

    if (paddleTwo && newState.paddleTwo) {
      paddleTwo.position.x = newState.paddleTwo.x;
    }

    if (playerNumber === 1) {
      paddle1Mat.emissiveColor = new Color3(0, 0.3, 0.6);
    } else if (playerNumber === 2) {
      paddle2Mat.emissiveColor = new Color3(0.6, 0.3, 0);
    }
  }

  function setWebSocket(ws: WebSocket) {
    webSocket = ws;
  }

  function setPlayerNumber(num: number) {
    playerNumber = num;

    if (playerNumber === 1) {
      camera.position = new Vector3(0, 12, -15);
    } else if (playerNumber === 2) {
      camera.position = new Vector3(0, 12, 15);
      camera.rotation.y = Math.PI;
    }
  }

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
