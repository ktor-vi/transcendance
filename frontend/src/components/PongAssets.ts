import {
  Engine,
  Scene,
  Vector3,
  Quaternion,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";

// https://doc.babylonjs.com/toolsAndResources/assetLibraries/availableTextures
// https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/ref_frame/
// https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg
export class Paddle {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, radius: number, angle: number, texture: string) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.y = height / 2;
    this.hitbox.position.z = radius * Math.cos(angle);
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texture, scene);
    this.hitbox.material = visual;
  }
}

export class Ball {
  hitbox: any;
  start_pos: Vector3;
  speed: Vector3;
  constructor(scene:any, size: number, texture: string, x: number, y: number, z: number) {
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
    this.start_pos = new Vector3(x, y, z);
    this.hitbox.position.set(x, y, z);
    this.speed = Vector3.Zero();
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texture, scene);
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
  constructor(scene: any, width: number, height: number, depth: number, texture: string, x: number, y: number, z: number) {
    this.hitbox = MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth }, scene);
    this.hitbox.position.set(x, y, z);
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texture, scene);
    this.hitbox.material = visual;
  }
}

export class Shiny {

}