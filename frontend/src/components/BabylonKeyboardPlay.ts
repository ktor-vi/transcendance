// BabylonKeyboardPlay.ts
import {
	Engine,
	Scene,
	Vector3,
	HemisphericLight,
	MeshBuilder,
	FreeCamera,
	KeyboardEventTypes
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

// Initializes a BabylonJS scene for local keyboard play
export function createBabylonKeyboardPlay(canvas: HTMLCanvasElement) {
	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	// Camera setup
	const camera = new FreeCamera("camera", new Vector3(0, 10, 0), scene);
	camera.setTarget(Vector3.Zero());
	camera.rotation.x = Math.PI / 2;
	camera.attachControl(canvas, true);
	camera.position.set(0, 8, -10);

	// Lighting
	new HemisphericLight("light", new Vector3(0, 1, 0), scene);

	// Ground
	const ground = MeshBuilder.CreateBox("ground", { width: 13.5, height: 0.1, depth: 7.5 }, scene);
	ground.position.y = -0.5;

	// Ball and paddles
	const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.5 }, scene);
	ball.position.y = 0;

	const paddleOne = MeshBuilder.CreateBox("paddleOne", { width: 2, height: 0.75, depth: 0.25 }, scene);
	paddleOne.position.set(0, 0, -3.75);

	const paddleTwo = MeshBuilder.CreateBox("paddleTwo", { width: 2, height: 0.75, depth: 0.25 }, scene);
	paddleTwo.position.set(0, 0, 3.75);

	// Game state
	let score = { p1: 0, p2: 0 };
	let scoreCallback: ((score: { p1: number; p2: number }) => void) | null = null;
	let ballDirection = new Vector3(0.05, 0, 0.1);
	const FIELD_WIDTH = 13.5;
	const FIELD_DEPTH = 7.5;
	let gameStarted = false;

	// Keyboard state
	const keysOne = { left: false, right: false };
	const keysTwo = { left: false, right: false };
	const PDL_SPD = 0.25;

	// Reset game
	function resetGame() {
		ball.position.set(0, 0, 0);
		ballDirection = new Vector3(0.05 * (Math.random() > 0.5 ? 1 : -1), 0, 0.1 * (Math.random() > 0.5 ? 1 : -1));
		gameStarted = true;
	}

	// Score update callback registration
	function onScoreUpdate(cb: (score: { p1: number; p2: number }) => void) {
		scoreCallback = cb;
	}

	// GUI button
	const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
	const button = Button.CreateSimpleButton("startButton", "Start / Restart");
	button.width = "150px";
	button.height = "40px";
	button.color = "white";
	button.background = "green";
	button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
	button.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
	button.top = "20px";

	button.onPointerUpObservable.add(() => {
		score.p1 = 0;
		score.p2 = 0;
		if (scoreCallback) scoreCallback(score);
		resetGame();
	});

	advancedTexture.addControl(button);

	// Keyboard input
	scene.onKeyboardObservable.add((kbInfo) => {
		const key = kbInfo.event.key.toLowerCase();
		switch (kbInfo.type) {
			case KeyboardEventTypes.KEYDOWN:
				if (key === "a") keysOne.left = true;
				if (key === "d") keysOne.right = true;
				if (key === "j") keysTwo.left = true;
				if (key === "l") keysTwo.right = true;
				break;
			case KeyboardEventTypes.KEYUP:
				if (key === "a") keysOne.left = false;
				if (key === "d") keysOne.right = false;
				if (key === "j") keysTwo.left = false;
				if (key === "l") keysTwo.right = false;
				break;
		}
	});

	// Render loop
	engine.runRenderLoop(() => {
		if (!gameStarted) return;

		// Ball movement and collisions
		ball.position.addInPlace(ballDirection);

		if (ball.position.x <= -FIELD_WIDTH / 2 || ball.position.x >= FIELD_WIDTH / 2)
			ballDirection.x *= -1;

		if (ball.position.z <= -FIELD_DEPTH / 2 + 0.5 && Math.abs(ball.position.x - paddleOne.position.x) < 1.1) {
			ball.position.z = -FIELD_DEPTH / 2 + 0.5;
			ballDirection.z *= -1;
		}

		if (ball.position.z >= FIELD_DEPTH / 2 - 0.5 && Math.abs(ball.position.x - paddleTwo.position.x) < 1.1) {
			ball.position.z = FIELD_DEPTH / 2 - 0.5;
			ballDirection.z *= -1;
		}

		// Score update
		if (ball.position.z <= -FIELD_DEPTH) { score.p2++; if (scoreCallback) scoreCallback(score); resetGame(); }
		if (ball.position.z >= FIELD_DEPTH) { score.p1++; if (scoreCallback) scoreCallback(score); resetGame(); }

		// Paddle movement
		if (keysOne.left) paddleOne.position.x -= PDL_SPD;
		if (keysOne.right) paddleOne.position.x += PDL_SPD;
		if (keysTwo.left) paddleTwo.position.x -= PDL_SPD;
		if (keysTwo.right) paddleTwo.position.x += PDL_SPD;

		scene.render();
	});

	window.addEventListener("resize", () => engine.resize());

	return {
		start: resetGame,
		reset: () => { score = { p1: 0, p2: 0 }; if (scoreCallback) scoreCallback(score); resetGame(); },
		onScoreUpdate,
	};
}
