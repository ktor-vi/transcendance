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
  Control,
} from "@babylonjs/gui";
export function createBabylonScene(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera = new FreeCamera("camera", new Vector3(0, 10, 0), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.x = Math.PI / 2;
  camera.attachControl(canvas, true);

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Sol
  const ground = MeshBuilder.CreateBox("ground", { width: 20, height: 0.05, depth: 10 }, scene);
  ground.position.y = -0.5;

  // Palettes
  const paddleOne = MeshBuilder.CreateBox("paddleOne", { width: 2, height: 0.75, depth: 0.25 }, scene);
  paddleOne.position.x = 0;
  paddleOne.position.y = 0;
  paddleOne.position.z = -3.75;

  const paddleTwo = MeshBuilder.CreateBox("paddleTwo", { width: 2, height: 0.75, depth: 0.25 }, scene);
  paddleTwo.position.x = 0;
  paddleTwo.position.y = 0;
  paddleTwo.position.z = 3.75;

  // Balle
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);
  ball.position.y = 0;

  // Direction de la balle
  let ballDirection = new Vector3(0.05, 0, 0.1);

  // Paramètres du terrain
  const FIELD_WIDTH = 10;
  const FIELD_DEPTH = 7.5;
  let gameStarted = false;

  // Clavier
  const keysTwo = { left: false, right: false };
  const keysOne = { left: false, right: false };

  const PDL_SPD = 0.25;

  // Reset de la partie
  function resetGame() {
    ball.position.set(0, 0, 0);
    paddleOne.position.set(0, 0, -3.75);
    paddleTwo.position.set(0, 0, 3.75);
    ballDirection = new Vector3(0.05 * (Math.random() > 0.5 ? 1 : -1), 0, 0.1 * (Math.random() > 0.5 ? 1 : -1));
    gameStarted = true;
  }

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
    if (!gameStarted)
      resetGame(); // Réinitialise la partie
  });

  // Ajoute le bouton à l'UI
  advancedTexture.addControl(button);

  // Gestion des touches pour déplacer les palettes
  scene.onKeyboardObservable.add((kbInfo) => {
    const key = kbInfo.event.key.toLowerCase();
    switch (kbInfo.type) {
      case KeyboardEventTypes.KEYDOWN:
        if (key === "d") keysOne.left = true;
        if (key === "q") keysOne.right = true;
        if (key === "m") keysTwo.left = true;
        if (key === "k") keysTwo.right = true;
        break;
      case KeyboardEventTypes.KEYUP:
        if (key === "d") keysOne.left = false;
        if (key === "q") keysOne.right = false;
        if (key === "m") keysTwo.left = false;
        if (key === "k") keysTwo.right = false;
        break;
    }
  });

  // Boucle de rendu
  engine.runRenderLoop(() => {
    // Déplacement de la balle
    if (gameStarted) {

      ball.position.addInPlace(ballDirection);

      // Rebond sur les murs gauche/droit
      if (ball.position.x <= -FIELD_WIDTH / 2 || ball.position.x >= FIELD_WIDTH / 2) {
        ballDirection.x *= -1;
      }

      // Rebond sur les palettes
      if (Math.abs(ball.position.z - paddleOne.position.z) < 0.4 && Math.abs(ball.position.x - paddleOne.position.x) < 1.1) {
        ballDirection.z *= -1;
      }
      if (Math.abs(ball.position.z - paddleTwo.position.z) < 0.4 && Math.abs(ball.position.x - paddleTwo.position.x) < 1.1) {
        ballDirection.z *= -1;
      }

      // Reset si la balle sort du terrain
      if (ball.position.z <= -FIELD_DEPTH || ball.position.z >= FIELD_DEPTH) {
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
}
