import {
  Engine, Scene, Vector3, HemisphericLight,
  MeshBuilder, FreeCamera
} from "@babylonjs/core";
import { connectWebSocket, sendInput } from "./socket";

export function startGame(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera = new FreeCamera("camera", new Vector3(0, 10, 0), scene);
  camera.setTarget(Vector3.Zero());
  camera.rotation.x = Math.PI / 2;
  camera.attachControl(canvas, true);

  new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  const paddle1 = MeshBuilder.CreateBox("p1", { width: 2, height: 0.5, depth: 0.25 }, scene);
  const paddle2 = MeshBuilder.CreateBox("p2", { width: 2, height: 0.5, depth: 0.25 }, scene);
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);

  // Écoute les messages du serveur
  connectWebSocket((state) => {
    paddle1.position.set(state.p1.x, 0, state.p1.z);
    paddle2.position.set(state.p2.x, 0, state.p2.z);
    ball.position.set(state.ball.x, 0, state.ball.z);
  });

  const input = { left: false, right: false };

  window.addEventListener("keydown", (e) => {
    if (e.key === "a") input.left = true;
    if (e.key === "d") input.right = true;
    sendInput(input);
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "a") input.left = false;
    if (e.key === "d") input.right = false;
    sendInput(input);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
}
