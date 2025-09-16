import {
  Engine,
  Scene,
  Vector3,
  AbstractMesh,
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
  camera: FreeCamera;
  numberOfPlayers: number;
  walls: Wall[];
  paddles: Paddle[];
  goals: Goal[];
  ball: Ball;
  ground: Ground;

  /**
   * construct a model of pong enabling the physics with Cannon
   * @param engine - babylon engine
   * @param scene - babylon scene
   * @param numberOfPlayers - work in progress, number of players must be 2 for now
   * @param local - is the game local ? false if game is remote
   */
  constructor(engine: Engine, scene: Scene, numberOfPlayers: number, local: boolean) {
    this.engine = engine;
    this.scene = scene;
    if (local)
      this.scene.enablePhysics(new Vector3(0, 0, 0), new CannonJSPlugin(true, 10, CANNON));
    this.numberOfPlayers = 2;
    this.walls = [];
    this.paddles = [];
    if (local)
      this.goals = [];
    this.ground = new Ground(this.scene);
    this.createImpostors(local);
    if (local){
      this.camera = new FreeCamera("camera", new Vector3(0, FIELD_DEPTH, -1.5 * FIELD_DEPTH), this.scene);
      this.camera.setTarget(Vector3.Zero());
    }
  }

  /**
   * hard code 2 players setup - can be upgraded if module multiplayers
   */
  createImpostors(local: boolean) : void {
    this.ball = new Ball(this.scene, 0, 0, local);
    this.walls[0] = new Wall(this.scene, (FIELD_WIDTH - WALL_WIDTH) / 2, 0);
    this.walls[1] = new Wall(this.scene, (WALL_WIDTH - FIELD_WIDTH) / 2, 0);
    this.paddles[0] = new Paddle(this.scene, FIELD_DEPTH / 2, Math.PI);
    this.paddles[1] = new Paddle(this.scene, FIELD_DEPTH / 2, 0);
    if (local){
      this.goals[0] = new Goal(this.scene, (FIELD_DEPTH + BALL_SIZE) / 2, Math.PI);
      this.goals[1] = new Goal(this.scene, (FIELD_DEPTH + BALL_SIZE) / 2, 0);
    }
  }

  /**
   * collision check
   * @returns true if collision between the ball and a paddle is detected
   */
  collision() : boolean {
    for (let i = 0; i < this.numberOfPlayers; i++) {
      if (this.ball.hitbox.intersectsMesh(this.paddles[i].hitbox))
        return true;
    }
    return false;
  }

  /**
   * score check
   * @param player - the player for whom goal is checked
   * @returns true if goal is scored
   */
  score(player: number) : boolean {
    if (this.ball.hitbox.intersectsMesh(this.goals[player].hitbox)){
      this.goals[player].score++;
      return true;
    }
    return false;
  }
}

class Paddle {
  hitbox: AbstractMesh;

  /**
   * create a mesh box representing a paddle and attach a physiscs impostor to it
   * @param scene - babylon scene
   * @param radius - how far the paddle is from the center
   * @param angle - the angle of the paddle, for now, with 2 players, 0 or 180 degrees
   */
  constructor(scene: Scene, radius: number, angle: number) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: PADDLE_WIDTH, height: PADDLE_HEIGHT, depth: PADDLE_DEPTH }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.rotation.y = angle;
    this.hitbox.position.set(radius * Math.sin(angle), PADDLE_HEIGHT / 2, radius * Math.cos(angle));
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
  }

  /**
   * update position of the paddle
   * @param direction - the direction of the movement
   */
  move(direction: string) {
    if (direction === "right")
      this.hitbox.position.x += PADDLE_SPEED;
    if (direction === "left")
      this.hitbox.position.x -= PADDLE_SPEED;
  }
}

class Goal {
  hitbox: AbstractMesh;
  score: number;

  /**
   * create an invisible mesh box to trigger the score when the ball hit it
   * @param scene - babylon scene
   * @param radius - how far the goal is from the center
   * @param angle - the angle of the goal, for now, with 2 players, 0 or 180 degrees
   */
  constructor(scene: Scene, radius: number, angle: number) {
    this.hitbox = MeshBuilder.CreateBox("goal", { width: FIELD_WIDTH, height: WALL_HEIGHT, depth: PADDLE_DEPTH }, scene);
    this.hitbox.visibility = 0;
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.y = WALL_HEIGHT / 2;
    this.hitbox.position.z = radius * Math.cos(angle);
    this.score = 0;
  }
}

class Ball {
  scene: Scene;
  hitbox: any;
  start_pos: Vector3;

  /**
   * create a mesh sphere representing the ball and attach a phisics impostor to it
   * @param scene - babylon scene
   * @param x - initial x position of the ball
   * @param z - initial z position of the ball
   * @param local - is the game local ? false if game is remote
   */
  constructor(scene:any, x: number, z: number, local: boolean) {
    this.scene = scene;
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: BALL_SIZE }, scene);
    this.hitbox.renderingGroupId = 1;
    this.start_pos = new Vector3(x, BALL_SIZE / 2, z);
    this.hitbox.position.set(x, BALL_SIZE / 2, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.SphereImpostor, {mass: 0.3, restitution: 1});
    if (local)
      scene.registerBeforeRender(() => {
        this.keepOnTrack();
      });
  }

  /**
   * reset position of the ball
   */
  reset(){
    this.hitbox.physicsImpostor.setLinearVelocity(Vector3.Zero());
    this.hitbox.physicsImpostor.setAngularVelocity(Vector3.Zero());
    this.hitbox.position.set(this.start_pos.x, this.start_pos.y, this.start_pos.z);
  }

  /**
   * launch the ball in a random direction
   */
  launch(){
    let speed = new Vector3((Math.random() - 0.5), 0, (Math.random() > 0.5 ? -1 : 1));
    speed = speed.normalize().multiplyInPlace(new Vector3(10, 10, 10));
    this.hitbox.physicsImpostor.setLinearVelocity(speed);
  }

  /**
   * make sure the ball never get lost out of the xz plane
   */
  keepOnTrack(){
    this.hitbox.position.y = this.start_pos.y;
    let speed = this.hitbox.physicsImpostor.getLinearVelocity();
    speed.y = 0;
    speed = speed.normalize().multiplyInPlace(new Vector3(10, 10, 10));
    this.hitbox.physicsImpostor.setLinearVelocity(speed);
  }

}

class Wall {
  hitbox: AbstractMesh;

  /**
   * create a mesh box representing a wall and attach a physiscs impostor to it
   * @param scene - babylon scene
   * @param x - position x of the wall
   * @param z - position z of the wall
   */
  constructor(scene: Scene, x: number, z: number) {
    this.hitbox = MeshBuilder.CreateBox("wall", { width: WALL_WIDTH, height: WALL_HEIGHT, depth: WALL_DEPTH }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.position.set(x, WALL_HEIGHT / 2, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
  }
}

class Ground {
  mesh: any;

  /**
   * create a mesh ground for visual purposes
   * @param scene - babylon scene
   * @param width - size of the ground on x axis
   * @param depth - size of the ground on z axis
   */
  constructor(scene: any){
    this.mesh = MeshBuilder.CreateGround("ground", {width: FIELD_WIDTH, height: FIELD_DEPTH}, scene);
  }
}
