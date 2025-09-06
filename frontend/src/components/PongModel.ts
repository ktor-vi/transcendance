import {
  Engine,
  Scene,
  Vector3,
  MeshBuilder,
  FreeCamera,
  PhysicsImpostor,
  CannonJSPlugin,
} from "@babylonjs/core";

import * as CANNON from "cannon";

// Paramètres du terrain
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


export class PongModel {
  engine: Engine;
  scene: Scene;
  walls: Wall[];
  paddles: Paddle[];
  balls: Ball[];

  constructor(canvas: HTMLCanvasElement, numberOfPlayers: number){
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));
    this.walls = [];
    this.paddles = [];
    this.balls = [];
    this.createImpostors(numberOfPlayers);

    // je ne sais pas encore où déclarer la caméra
    const camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), this.scene);
    camera.attachControl(canvas, true);
    camera.setTarget(Vector3.Zero());
  }

  createImpostors(numberOfPlayers: number){
    this.walls[0] = new Wall(this.scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, (FIELD_WIDTH - WALL_WIDTH) / 2, WALL_HEIGHT / 2, 0);
    this.walls[1] = new Wall(this.scene, WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, (WALL_WIDTH - FIELD_WIDTH) / 2, WALL_HEIGHT / 2, 0);
    this.paddles[0] = new Paddle(this.scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, Math.PI);
    this.paddles[1] = new Paddle(this.scene, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH, FIELD_DEPTH / 2, 0);
    this.balls[0] = new Ball(this.scene, BALL_SIZE, 0, BALL_SIZE / 2, 0);
  }
}

export class Paddle {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, radius: number, angle: number) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.y = height / 2;
    this.hitbox.position.z = radius * Math.cos(angle);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
  }
}

export class Ball {
  scene: Scene;
  hitbox: any;
  start_pos: Vector3;
  constructor(scene:any, size: number, x: number, y: number, z: number) {
    this.scene = scene;
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
    this.hitbox.renderingGroupId = 1;
    this.start_pos = new Vector3(x, y, z);
    this.hitbox.position.set(x, y, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.SphereImpostor, {mass: 0.3, restitution: 1});
  }
  reset(){
    this.hitbox.physicsImpostor.setLinearVelocity(Vector3.Zero());
    this.hitbox.physicsImpostor.setAngularVelocity(Vector3.Zero());
    this.hitbox.position.set(this.start_pos.x, this.start_pos.y, this.start_pos.z);
  }
  launch(){
    let speed = new Vector3((Math.random() - 0.5), 0, (Math.random() > 0.5 ? -1 : 1));
    speed = speed.normalize().multiplyInPlace(new Vector3(10, 10, 10));
    this.hitbox.physicsImpostor.setLinearVelocity(speed);
  }
  keepOnTrack(){
    this.hitbox.position.y = this.start_pos.y;
    let speed = this.hitbox.physicsImpostor.getLinearVelocity();
    speed.y = 0;
    speed = speed.normalize().multiplyInPlace(new Vector3(10, 10, 10));
    this.hitbox.physicsImpostor.setLinearVelocity(speed);
  }

}

export class Wall {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, x: number, y: number, z: number) {
    this.hitbox = MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.position.set(x, y, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
  }
}
