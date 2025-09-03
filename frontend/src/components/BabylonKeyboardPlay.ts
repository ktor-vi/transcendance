import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  FreeCamera,
  KeyboardEventTypes,
  ParticleSystem,
  Color4,
  NoiseProceduralTexture,
  Texture
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

import * as CANNON from "@type/cannon";

import {Paddle, Ball, Wall} from "./PongAssets";

function setupVisuals(scene: any, canvas: any, FIELD_DEPTH: number, FIELD_WIDTH: number) {
  const camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), scene);
  camera.setTarget(Vector3.Zero());
  // camera.rotation.x = Math.PI / 2;//changer ca, ca tourne tout le reste
  camera.attachControl(canvas, true);
  camera.setTarget(Vector3.Zero());
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
}

// Reset de la partie
function resetGame(ball: any) {
  ball.resetPos();
  ball.speed.set(
    0.05 * (Math.random() > 0.5 ? 1 : -1),
    0,
    0.1 * (Math.random() > 0.5 ? 1 : -1)
  );
}

export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {

  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));

  // Paramètres du terrain
  const GRAPHIC_FOLDER = "../../public/images/";
  const FIELD_WIDTH = 13.5;
  const FIELD_HEIGHT = 0.1;
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
  // const SHINY_IMAGE = "https://t3.ftcdn.net/jpg/13/90/32/34/360_F_1390323429_fAkdVjJGjh1QfqeNLffeDueRLlUQOLsA.jpg";
  // const SHINY_IMAGE = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjdAeim6jfibyI_iaJ1juLMrtAc8R067EwjLmd5K6_VEJ1ZsjD5p2XHXVFHNtuAqHVsRU&usqp=CAU";

  // Construit la scène
  const ground = new Wall(scene, FIELD_WIDTH, FIELD_HEIGHT, FIELD_DEPTH, FIELD_IMAGE, 0, -0.5 * FIELD_HEIGHT, 0, 0.5);
  const wall1 = new Wall(scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_IMAGE, (FIELD_WIDTH - WALL_WIDTH) / 2, WALL_HEIGHT / 2, 0, 0.5);
  const wall2 = new Wall(scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_IMAGE, (WALL_WIDTH - FIELD_WIDTH) / 2, WALL_HEIGHT / 2, 0, 0.5);
  const paddleOne = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, Math.PI, PADDLE_IMAGE);
  const paddleTwo = new Paddle(scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, 0, PADDLE_IMAGE);
  const ball = new Ball(scene, BALL_SIZE, BALL_IMAGE, 0, BALL_SIZE / 2, 0);
  // const stunningEffects = new Shiny(scene, SHINY_IMAGE);
  setupVisuals(scene, canvas, FIELD_DEPTH, FIELD_WIDTH);
  
  const createStarsEffect = (position: Vector3) => {
    const stunningEffects = new ParticleSystem("stars", 1000, scene);
    stunningEffects.particleTexture = new Texture(SHINY_IMAGE, scene);
    stunningEffects.textureMask = new Color4(0, 1, 0, 0.01); //works with flare but not with stars
    stunningEffects.emitter = position;
    stunningEffects.direction1 = new Vector3(2, 2, 2);
    stunningEffects.direction2 = new Vector3(-2, 2, -2);
    // stunningEffects.minEmitBox = new Vector3(0, 0, 0);
    // stunningEffects.maxEmitBox = new Vector3(0, 0, 0);
    
    stunningEffects.emitRate = 300;
    stunningEffects.minLifeTime = 0.3;
    stunningEffects.maxLifeTime = 0.5;
    stunningEffects.minSize = 1;
    stunningEffects.maxSize = 1;
    // stunningEffects.minEmitPower = 1;
    // stunningEffects.maxEmitPower = 3;
    stunningEffects.updateSpeed = 0.01;

    // var noiseTexture = new NoiseProceduralTexture("perlin", 256, scene);
    // noiseTexture.animationSpeedFactor = 5;
    // noiseTexture.persistence = 2;
    // noiseTexture.brightness = 0.5;
    // noiseTexture.octaves = 2;

    // stunningEffects.noiseTexture = noiseTexture;
    // stunningEffects.noiseStrength = new Vector3(100, 100, 100);
    
    stunningEffects.targetStopDuration = 0.5;
    stunningEffects.disposeOnStop = true;
    // stunningEffects.manualEmitCount = 300;
    stunningEffects.start();
  };

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
        ball.updatePos();
            // ball.hitbox.position.addInPlace(ball.speed);

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
        createStarsEffect(ball.hitbox.position);
        // stunningEffects.explode(ball.hitbox.position);
      }

      // Paddle 2 collision
      if (
        ball.hitbox.position.z >= FIELD_DEPTH / 2 - 0.5 &&
        ball.hitbox.position.z <= FIELD_DEPTH / 2 + 0.5 && // tolérance plus large
        Math.abs(ball.hitbox.position.x - paddleTwo.hitbox.position.x) < 1.1
      ) {
        ball.hitbox.position.z = FIELD_DEPTH / 2 - 0.5; // corriger position
        ball.speed.z *= -1;
        createStarsEffect(ball.hitbox.position);
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
