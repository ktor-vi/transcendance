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

const GRAPHIC_FOLDER = "../../public/images/";
const SKYBOX_IMAGE = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzRT6G0cuCqmybwjD-8zWjjUIAQBvi6LMFHkTCZL5hzSEtDgYqIdfWRLWtnyG4SBGBptk&usqp=CAU";
const FIELD_IMAGE = "https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg";
const PADDLE_IMAGE = "https://www.babylonjs-playground.com/textures/amiga.jpg";
// const BALL_IMAGE = GRAPHIC_FOLDER + "HelloKitty.png";
const BALL_IMAGE = "https://us1.discourse-cdn.com/flex024/uploads/babylonjs/original/3X/7/b/7b835f51e968cd202d62ad1277dac879e19ffd9b.png";
const WALL_IMAGE = "https://www.babylonjs-playground.com/textures/crate.png";
const TILE_SIZE = 0.5;
const SHINY_IMAGE = "https://playground.babylonjs.com/textures/flare.png";

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const PADDLE_WIDTH = 3; 
const PADDLE_HEIGHT = 0.75;
const PADDLE_DEPTH = 0.25;
const PADDLE_SPEED = 0.25;
const BALL_SIZE = 1;
const WALL_WIDTH = PADDLE_DEPTH;
const WALL_HEIGHT = PADDLE_HEIGHT * 2;
const WALL_DEPTH = FIELD_DEPTH;

export class PongView {
  engine: Engine;
  scene: Scene;
  constructor(engine: Engine, scene: Scene) {
    this.engine = engine;
    this.scene = scene;
    this.createEnvironment();
    let toRender = scene.getActiveMeshCandidates().data;
    for (let i = 0; i < toRender.length; i++){
      if (toRender[i].name === "wall")
        applyTexture(toRender[i], WALL_IMAGE, WALL_HEIGHT / TILE_SIZE, FIELD_DEPTH / TILE_SIZE, this.scene);
      else if (toRender[i].name === "paddle")
        applyTexture(toRender[i], PADDLE_IMAGE, 1, 1, this.scene);
      else if (toRender[i].name === "ball")
        applyTexture(toRender[i], BALL_IMAGE, 1, 1, this.scene);
    }
  }

  createEnvironment(){
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

    const ground = new GroundView(this.scene, FIELD_WIDTH, FIELD_DEPTH, FIELD_IMAGE, 0.5);
  }
}

// export class PaddleView{
//   mesh: AbstractMesh;
//   constructor(scene: any, width: number, height: number, depth: number, texturePath: string) {
//     this.mesh = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
//     applyTexture(this.mesh, texturePath, 1, 1, scene);
//   }
// }

// export class BallView {
//   mesh: AbstractMesh;
//   constructor(scene:any, size: number, texturePath: string) {
//     this.mesh = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
//     applyTexture(this.mesh, texturePath, 1, 1, scene);
//   }
// }

export class GroundView {
  mesh: any;
  constructor(scene: any, width: number, depth: number, texturePath: string, tileSize: number){
    this.mesh = MeshBuilder.CreateGround("ground", {width: width, height: depth}, scene);
    applyTexture(this.mesh, texturePath, width / tileSize,  depth / tileSize, scene);
  }
}

// export class WallView {
//   mesh: any;
//   constructor(scene: any, width: number, height: number, depth: number, texturePath: string, x: number, y: number, z: number, tileSize: number) {
//     this.mesh = MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth }, scene);
//     applyTexture(this.mesh, texturePath, height / tileSize, depth / tileSize, scene);
//   }
// }

export function shiny(scene: any, position: Vector3, texturePath: string) {
  const stunningEffects = new ParticleSystem("stars", 1000, scene);
  stunningEffects.renderingGroupId = 1;
  stunningEffects.particleTexture = new Texture(texturePath, scene);
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

function applyTexture(mesh: AbstractMesh, texturePath: string, uscale: number, vscale: number, scene: Scene){
  mesh.renderingGroupId = 1;
  let visual = new StandardMaterial("visual", scene);
  let texture = new Texture(texturePath, scene);
  visual.diffuseTexture = texture;
  mesh.material = visual;
  texture.uScale = uscale;
  texture.vScale = vscale;
}