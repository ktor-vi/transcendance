import {
  Engine, Scene, Vector3,
  HemisphericLight, MeshBuilder,
  FreeCamera, KeyboardEventTypes
} from "@babylonjs/core";

import { connectWebSocket, sendMove } from '../socket';

export function createBabylonScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  let roomId: string = '';
  let playerNum: number = 0;
  const inputState = { left: false, right: false };

  // Création de la scène Babylon.js
  const camera = new FreeCamera("cam", new Vector3(0, 10, 0), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.x = Math.PI / 2;
  camera.attachControl(canvas, true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  const ground = MeshBuilder.CreateBox("ground", { width: 20, height: 0.05, depth: 10 }, scene);
  ground.position.y = -0.5;

  const paddleOne = MeshBuilder.CreateBox("p1", { width: 2, height: 0.75, depth: 0.25 }, scene);
  paddleOne.position.set(0, 0, -3.75);

  const paddleTwo = MeshBuilder.CreateBox("p2", { width: 2, height: 0.75, depth: 0.25 }, scene);
  paddleTwo.position.set(0, 0, 3.75);

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);
  ball.position.y = 0;

  // Gestion du clavier
  scene.onKeyboardObservable.add((kb) => {
    const key = kb.event.key.toLowerCase();
    const isDown = kb.type === KeyboardEventTypes.KEYDOWN;

    if (key === 'd') inputState.left = isDown;
    if (key === 'q') inputState.right = isDown;
  });

  // Connexion WebSocket via module centralisé
  connectWebSocket((msg) => {
    if (msg.type === 'assign') {
      playerNum = msg.player;
      roomId = msg.roomId;
      localStorage.setItem('pongRoom', roomId);
      console.log(`✅ Rejoint room ${roomId}, joueur ${playerNum}`);
    }

    if (msg.type === 'state') {
      const gs = msg.gameState;
      paddleOne.position.x = gs.paddleOne.x;
      paddleTwo.position.x = gs.paddleTwo.x;
      ball.position.x = gs.ball.x;
      ball.position.z = gs.ball.z;
    }
  }, () => {
    // À l’ouverture de la socket : tentative de rejoindre une room existante
    const existing = localStorage.getItem('pongRoom');
    return { type: 'joinRoom', roomId: existing };
  });

  // Boucle de rendu + envoi des inputs
  engine.runRenderLoop(() => {
    if (playerNum !== null && (inputState.left || inputState.right)) {
      sendMove({
        type: 'input',
        player: playerNum,
        left: inputState.left,
        right: inputState.right
      });
    }

    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());
}
