// Game state structure for the Pong-like game
export interface GameState {
	ball: { 
		x: number;  // Ball X position
		z: number;  // Ball Z position
		dx: number; // Ball velocity X
		dz: number; // Ball velocity Z
	};
	paddleOne: { 
		x: number;  // Paddle 1 X position
	};
	paddleTwo: { 
		x: number;  // Paddle 2 X position
	};
	score: { 
		p1: number; // Player 1 score
		p2: number; // Player 2 score
	};
	scoreP1: number;
	scoreP2: number;
	gameEnded:boolean;
}

// Interface to manage the game instance
export interface GameInstance {
  updateGameState: (gameState: GameState) => void; // Update current game state
  setPlayerNumber: (player: number) => void; // Assign player number (1 or 2)
  cleanup: () => void;
  setWebSocket: (ws: WebSocket) => void  // Dispose engine and listeners
  setGameActive?: (status: boolean) => void
}
