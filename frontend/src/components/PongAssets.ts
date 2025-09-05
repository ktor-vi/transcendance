import {
  Vector3,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Texture,
  ParticleSystem,
  Color4,
  Effect,
  KeyboardEventTypes,
} from "@babylonjs/core";

// https://doc.babylonjs.com/toolsAndResources/assetLibraries/availableTextures
// https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/ref_frame/
// https://doc.babylonjs.com/img/resources/textures_thumbs/grass.dds.jpg
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
  hitbox: any;
  start_pos: Vector3;
  constructor(scene:any, size: number, texturePath: string, x: number, y: number, z: number) {
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
    let speed = new Vector3(Math.random(), 0, Math.random());
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
  stunningEffects.particleTexture = new Texture(texturePath, scene);
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
}
