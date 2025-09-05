import {
  Scene,
  Vector3,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Texture,
  ParticleSystem,
  Color4,
} from "@babylonjs/core";

export class Paddle {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, radius: number, angle: number, texturePath: string) {
    this.hitbox = MeshBuilder.CreateBox("paddle", { width: width, height: height, depth: depth }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.rotation.y = angle;
    this.hitbox.position.x = radius * Math.sin(angle);
    this.hitbox.position.y = height / 2;
    this.hitbox.position.z = radius * Math.cos(angle);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texturePath, scene);
    this.hitbox.material = visual;
  }
}

export class Ball {
  scene: Scene;
  hitbox: any;
  start_pos: Vector3;
  constructor(scene:any, size: number, texturePath: string, x: number, y: number, z: number) {
    this.scene = scene;
    this.hitbox = MeshBuilder.CreateSphere("ball", { diameter: size }, scene);
    this.hitbox.renderingGroupId = 1;
    this.start_pos = new Vector3(x, y, z);
    this.hitbox.position.set(x, y, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.SphereImpostor, {mass: 0.3, restitution: 1});
    let visual = new StandardMaterial("visual", scene);
    visual.diffuseTexture = new Texture(texturePath, scene);
    this.hitbox.material = visual;
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

export class Ground {
  mesh: any;
  constructor(scene: any, width: number, depth: number, texturePath: string, tileSize: number){
    this.mesh = MeshBuilder.CreateGround("ground", {width: width, height: depth}, scene);
    this.mesh.renderingGroupId = 1;
    let visual = new StandardMaterial("visual", scene);
    let texture = new Texture(texturePath, scene);
    visual.diffuseTexture = texture;
    this.mesh.material = visual;
    texture.uScale = width / tileSize;
    texture.vScale = depth / tileSize;
  }
}

export class Wall {
  hitbox: any;
  constructor(scene: any, width: number, height: number, depth: number, texturePath: string, x: number, y: number, z: number, tileSize: number) {
    this.hitbox = MeshBuilder.CreateBox("wall", { width: width, height: height, depth: depth }, scene);
    this.hitbox.renderingGroupId = 1;
    this.hitbox.position.set(x, y, z);
    this.hitbox.physicsImpostor = new PhysicsImpostor(this.hitbox, PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1});
    let visual = new StandardMaterial("visual", scene);
    let texture = new Texture(texturePath, scene);
    visual.diffuseTexture = texture;
    this.hitbox.material = visual;
    texture.uScale = height / tileSize;
    texture.vScale = depth / tileSize;
  }
}

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
