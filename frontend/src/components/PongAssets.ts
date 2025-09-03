import {
  Engine,
  Scene,
  Vector3,
  Quaternion,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Particles,
  effect,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";

// https://doc.babylonjs.com/toolsAndResources/assetLibraries/availableTextures
// https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/ref_frame/
// https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg
export class Paddle {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, radius: number, angle: number, texturePath: string) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.y = height / 2;
    this.hitbox.position.z = radius * Math.cos(angle);
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texturePath, scene);
    this.hitbox.material = visual;
  }
}

export class Ball {
  hitbox: any;
  start_pos: Vector3;
  speed: Vector3;
  constructor(scene:any, size: number, texturePath: string, x: number, y: number, z: number) {
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
    this.start_pos = new Vector3(x, y, z);
    this.hitbox.position.set(x, y, z);
    this.speed = Vector3.Zero();
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texturePath, scene);
    this.hitbox.material = visual;
  }
  updatePos(){
    this.hitbox.position.addInPlace(this.speed);
    // la rotation de la balle qui va pas du tout !!!!!!!!
    // let yAxis = new Vector3(0, Math.PI / 2, 0);
    // let rotationAxis = (Vector3.Cross(yAxis, this.speed));
    // this.hitbox.rotation.addInPlace(rotationAxis);
  }
  resetPos(){this.hitbox.position.set(this.start_pos.x, this.start_pos.y, this.start_pos.z);}
}

export class Wall {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, texturePath: string, x: number, y: number, z: number) {
    this.hitbox = MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth }, scene);
    this.hitbox.position.set(x, y, z);
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texturePath, scene);
    this.hitbox.material = visual;
  }
}

// export class Shiny {
//   effect: any;
//   constructor(scene: any, texturePath: string) {
//     this.effect = new effect("wiiiiii", 1000, scene);
//     this.effect.particleTexture = new Texture(texturePath, scene);
//   }
//   // explode(position: Vector3) {
//   //   effect.emitter = position;
//   //   effect.startDirection = new Vector3(0, 1, 0); // Direction of particles
//   //   effect.minEmitBox = new Vector3(0, 0, 0); // Origin of the particles
//   //   effect.maxEmitBox = new Vector3(0, 0, 0); // Origin of the particles
    
//   //   effect.emitRate = 500;  // Emit 500 particles
//   //   effect.minLifeTime = 0.5;  // Particles last for 0.5 seconds
//   //   effect.maxLifeTime = 1;  // Particles last for 1 second
//   //   effect.minSize = 0.1;  // Small particles
//   //   effect.maxSize = 0.3;  // Larger particles
//   //   effect.minEmitPower = 1;  // Minimum particle speed
//   //   effect.maxEmitPower = 3;  // Maximum particle speed
//   //   effect.updateSpeed = 0.01;  // Update speed for each frame
    
//   //   effect.start();  // Start the particle system
//   // }
// }