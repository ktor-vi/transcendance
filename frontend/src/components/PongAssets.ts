import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  FreeCamera,
  KeyboardEventTypes,
} from "@babylonjs/core";


// https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/ref_frame/
export class Paddle {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, radius: number, angle: number) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.z = radius * Math.cos(angle);
  }
}

export class Ball {
  hitbox: any;
  speed: Vector3;
  constructor(scene:any, size: number) {
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
    this.speed = Vector3.Zero();
  }
}

export class Wall {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number) {
    this.hitbox = MeshBuilder.CreateBox("ground", { width: width, height: height, depth: depth }, scene);
  }
}
