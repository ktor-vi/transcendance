import {
  Engine,
  Scene,
  Vector3,
  Color4,
  AbstractMesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  CubeTexture,
  HemisphericLight,
  ParticleSystem,
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Control
} from "@babylonjs/gui";

// const FIELD_IMAGE = "https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg";
// const PADDLE_IMAGE = "https://www.babylonjs-playground.com/textures/amiga.jpg";
// const BALL_IMAGE = "https://us1.discourse-cdn.com/flex024/uploads/babylonjs/original/3X/7/b/7b835f51e968cd202d62ad1277dac879e19ffd9b.png";
// const WALL_IMAGE = "https://www.babylonjs-playground.com/textures/crate.png";
const GRAPHIC_FOLDER = "../../public/images/";
const SKYBOX_IMAGE = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzRT6G0cuCqmybwjD-8zWjjUIAQBvi6LMFHkTCZL5hzSEtDgYqIdfWRLWtnyG4SBGBptk&usqp=CAU";
const FIELD_IMAGE = GRAPHIC_FOLDER + "floweryground.jpg";
const PADDLE_IMAGE = GRAPHIC_FOLDER + "paddle.jpeg";
const BALL_IMAGE = GRAPHIC_FOLDER + "fluffyball.webp";
const WALL_IMAGE = GRAPHIC_FOLDER + "shinycat.jpg";
const SHINY_IMAGE = "https://playground.babylonjs.com/textures/flare.png";

export class PongView {
  engine: Engine;
  scene: Scene;
  startButton: Button;

  /**
   * construct the graphic view of the pong
   * @param engine - the same babylon engine than the model
   * @param scene - the same babylon scene than the model
   * @param button - is the start/restart button enabled
   */
  constructor(engine: Engine, scene: Scene, button: boolean) {
    this.engine = engine;
    this.scene = scene;
    if (button)
      this.createUI();
    this.createEnvironment();
    this.applyTextures();
  }

  /**
   * create a button to start/restart the game (enabled only for local play)
   */
  createUI() {
    this.startButton = Button.CreateSimpleButton("startButton", "Start / Restart");
    this.startButton.width = "150px";
    this.startButton.height = "40px";
    this.startButton.color = "white";
    this.startButton.background = "green";
    this.startButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.startButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.startButton.top = "20px";
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
    advancedTexture.addControl(this.startButton);
  }

  /**
   * Create a skybox and the light of the scene
   */
  createEnvironment() {
    //a nice background (visible if a problem occurs with the skybox + impact calcul of all colors)
    this.scene.clearColor = new Color4(1, 0, 0, 0.1);

    //surround the game with a sky texture
    const skybox = MeshBuilder.CreateBox("SkyBox", {size: 100}, this.scene);
    const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.reflectionTexture = new CubeTexture(SKYBOX_IMAGE, this.scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skybox.renderingGroupId = 0;

    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
  }

  /**
   * apply all textures depending of the object
   */
  applyTextures() {
    let toRender = this.scene.getActiveMeshCandidates().data;
    for (let i = 0; i < toRender.length; i++){
      if (toRender[i].name === "wall")
        applyTexture(toRender[i], WALL_IMAGE, 1, 9, this.scene);
      else if (toRender[i].name === "paddle")
        applyTexture(toRender[i], PADDLE_IMAGE, 1, 1, this.scene);
      else if (toRender[i].name === "ball")
        applyTexture(toRender[i], BALL_IMAGE, 1, 1, this.scene);
      else if (toRender[i].name === "ground")
        applyTexture(toRender[i], FIELD_IMAGE, 15, 10, this.scene);
    }
  }

  /**
   * launch particules at the given position for a stunning shiny effect
   * @param position - position of the effect
   */
  shiny(position: Vector3) {
    const stunningEffects = new ParticleSystem("stars", 1000, this.scene);
    stunningEffects.renderingGroupId = 1;
    stunningEffects.particleTexture = new Texture(SHINY_IMAGE, this.scene);
    stunningEffects.textureMask = new Color4(Math.random(), Math.random(), Math.random(), 0.01);
    stunningEffects.emitter = position;
    stunningEffects.direction1 = new Vector3(2, 2, 2);
    stunningEffects.direction2 = new Vector3(-2, 2, -2);
    
    stunningEffects.emitRate = 300;
    stunningEffects.minLifeTime = 0.3;
    stunningEffects.maxLifeTime = 0.5;
    stunningEffects.minSize = 0.1;
    stunningEffects.maxSize = 0.3;
    stunningEffects.updateSpeed = 0.01;
    
    stunningEffects.targetStopDuration = 0.05;
    stunningEffects.disposeOnStop = true;
    stunningEffects.start();
  }  
}

/**
 * Apply one texture
 * @param mesh - on this mesh
 * @param texturePath - from this file
 * @param uscale - multiply it if needed
 * @param vscale - multiply it on the other axis
 * @param scene - babylon scene
 */
function applyTexture(mesh: AbstractMesh, texturePath: string, uscale: number, vscale: number, scene: Scene){
  mesh.renderingGroupId = 1;
  let visual = new StandardMaterial("visual", scene);
  let texture = new Texture(texturePath, scene);
  visual.diffuseTexture = texture;
  mesh.material = visual;
  texture.uScale = uscale;
  texture.vScale = vscale;
}