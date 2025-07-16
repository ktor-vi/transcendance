export interface GameState {
  ball: { x: number; z: number; dx: number; dz: number };
  paddleOne: { x: number };
  paddleTwo: { x: number };
  score: { p1: number; p2: number };
}

export interface GameInstance {
  updateGameState: (gameState: GameState) => void;
  setPlayerNumber: (player: number) => void;
  cleanup: () => void;
}