import {
  Engine,
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  CubeTexture,
  HemisphericLight,
  Color4,
  FreeCamera,
  KeyboardEventTypes,
  Texture,
  CannonJSPlugin,
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

import * as CANNON from "cannon";

import {Paddle, Ball, Wall, Ground, shiny} from "./PongAssets";

function createScene(canvas: any, engine: any, FIELD_DEPTH: number, FIELD_WIDTH: number): Scene{
  const scene = new Scene(engine);
  scene.clearColor = new Color4(1, 0, 0, 0.1);

  const skybox = MeshBuilder.CreateBox("SkyBox", {size: 100}, scene);
  const skyboxMaterial = new StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;
  skybox.infiniteDistance = true;
  let texturePath = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzRT6G0cuCqmybwjD-8zWjjUIAQBvi6LMFHkTCZL5hzSEtDgYqIdfWRLWtnyG4SBGBptk&usqp=CAU";
  skyboxMaterial.reflectionTexture = new CubeTexture(texturePath, scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
  skybox.renderingGroupId = 0;

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  const camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), scene);
  camera.attachControl(canvas, true);
  camera.setTarget(Vector3.Zero());
  scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));
  return scene;
}

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {
  // Paramètres du terrain
  const GRAPHIC_FOLDER = "../../public/images/";
  const FIELD_WIDTH = 13.5;
  const FIELD_DEPTH = 7.5;
  const FIELD_IMAGE = "https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg";
  const PADDLE_WIDTH = 3; 
  const PADDLE_HEIGHT = 0.75;
  const PADDLE_DEPTH = 0.25;
  const PADDLE_SPEED = 0.25;
  const PADDLE_IMAGE = "https://www.babylonjs-playground.com/textures/amiga.jpg";
  const BALL_SIZE = 1;
  // const BALL_IMAGE = GRAPHIC_FOLDER + "HelloKitty.png";
  const BALL_IMAGE = "https://us1.discourse-cdn.com/flex024/uploads/babylonjs/original/3X/7/b/7b835f51e968cd202d62ad1277dac879e19ffd9b.png";
  const WALL_WIDTH = PADDLE_DEPTH;
  const WALL_HEIGHT = PADDLE_HEIGHT * 2;
  const WALL_DEPTH = FIELD_DEPTH;
  const WALL_IMAGE = "https://www.babylonjs-playground.com/textures/crate.png";
  const SHINY_IMAGE = "https://playground.babylonjs.com/textures/flare.png";

  const engine = new Engine(canvas, true);
  const scene = createScene(canvas, engine, FIELD_DEPTH, FIELD_WIDTH);

  // Construit la scène
  const ground = new Ground(scene, FIELD_WIDTH, FIELD_DEPTH, FIELD_IMAGE, 0.5);
  const wall1 = new Wall(scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_IMAGE, (FIELD_WIDTH - WALL_WIDTH) / 2, WALL_HEIGHT / 2, 0, 0.5);
  const wall2 = new Wall(scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_IMAGE, (WALL_WIDTH - FIELD_WIDTH) / 2, WALL_HEIGHT / 2, 0, 0.5);
  const paddleOne = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, Math.PI, PADDLE_IMAGE);
  const paddleTwo = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, 0, PADDLE_IMAGE);
  const ball = new Ball(scene, BALL_SIZE, BALL_IMAGE, 0, BALL_SIZE / 2, 0);

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
