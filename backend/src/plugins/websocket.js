import crypto from "crypto";
import fp from "fastify-plugin";
import fastifyWebsocket from "@fastify/websocket";

const FIELD_WIDTH = 13.5;
const FIELD_DEPTH = 7.5;
const PDL_SPD = 0.25;

export default fp(async function (fastify) {
  await fastify.register(fastifyWebsocket);

  const rooms = new Map();

  function createRoom() {
    const roomId = crypto.randomUUID().slice(0, 8);
    const gameState = {
      ball: { x: 0, z: 0, dx: 0.05, dz: 0.1 },
      paddleOne: { x: 0 },
      paddleTwo: { x: 0 },
      score: { p1: 0, p2: 0 },
    };
    const clients = new Map();

    const room = { clients, gameState };
    rooms.set(roomId, room);

    room.loop = setInterval(() => updateRoom(roomId), 1000 / 60);

    return roomId;
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Game loop 60 FPS
  function updateRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const gameState = room.gameState;
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.z += gameState.ball.dz;

    gameState.paddleOne.x = clamp(
      gameState.paddleOne.x,
      -FIELD_WIDTH / 2,
      FIELD_WIDTH / 2
    );
    gameState.paddleTwo.x = clamp(
      gameState.paddleTwo.x,
      -FIELD_WIDTH / 2,
      FIELD_WIDTH / 2
    );

    // Rebond sur murs gauche/droite
    if (
      gameState.ball.x <= -FIELD_WIDTH / 2 ||
      gameState.ball.x >= FIELD_WIDTH / 2
    ) {
      gameState.ball.dx *= -1;
    }

    // Rebond sur palettes
    // Paddle 1 collision
    if (
      gameState.ball.z <= -FIELD_DEPTH / 2 + 0.5 &&
      gameState.ball.z >= -FIELD_DEPTH / 2 - 0.5 && // tolérance plus large
      Math.abs(gameState.ball.x - gameState.paddleOne.x) < 1.1
    ) {
      gameState.ball.z = -FIELD_DEPTH / 2 + 0.5; // corriger position pour éviter le clip
      gameState.ball.dz *= -1;
    }

    // Paddle 2 collision
    if (
      gameState.ball.z >= FIELD_DEPTH / 2 - 0.5 &&
      gameState.ball.z <= FIELD_DEPTH / 2 + 0.5 && // tolérance plus large
      Math.abs(gameState.ball.x - gameState.paddleTwo.x) < 1.1
    ) {
      gameState.ball.z = FIELD_DEPTH / 2 - 0.5; // corriger position
      gameState.ball.dz *= -1;
    }

    // Reset balle si sortie du terrain
    if (Math.abs(gameState.ball.z) >= FIELD_DEPTH) {
      if (gameState.ball.z > FIELD_DEPTH) {
        gameState.score.p1++;
        gameState.ball.dz = -Math.abs(gameState.ball.dz);
      }
      if (gameState.ball.z < 0) {
        gameState.score.p2++;
        gameState.ball.dz = Math.abs(gameState.ball.dz);
      }

      if (gameState.score.p1 >= 11 || gameState.score.p2 >= 11) {
        clearInterval(room.loop);
        setInterval(() => {
          for (const { socket } of room.clients.values()) {
            if (socket.readyState === 1) socket.close();
          }
          rooms.delete(roomId);
        }, 5000);
      }
      Object.assign(gameState.ball, {
        x: 0,
        z: 0,
        dx: 0.05,
        dz: gameState.ball.dz,
      });
    }
    // Broadcast état aux clients prêts
    const payload = JSON.stringify({ type: "state", gameState });
    for (const { socket } of room.clients.values()) {
      if (socket.readyState === 1) socket.send(payload);
    }
  }

  // Trouve une room avec < 2 joueurs ou crée-en une nouvelle
  function findOrCreateRoom() {
    for (const [id, room] of rooms.entries()) {
      if (room.clients.size < 2) return id;
    }
    return createRoom();
  }

  fastify.get("/ws", { websocket: true }, (socket, req) => {
    const clientId = crypto.randomUUID();
    let joinedRoom = null;
    let playerNum = 0;

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (msg.type === "joinRoom") {
        if (msg.roomId !== "auto") {
          socket.send(
            JSON.stringify({ type: "error", message: "Invalid roomId" })
          );
          socket.close();
          return;
        }

        const roomId = findOrCreateRoom();
        const room = rooms.get(roomId);
        const takenNums = [...room.clients.values()].map((c) => c.playerNum);

        if (takenNums.length >= 2) {
          socket.send(JSON.stringify({ type: "error", message: "Room full" }));
          socket.close();
          return;
        }

        if (!takenNums.includes(1)) playerNum = 1;
        else if (!takenNums.includes(2)) playerNum = 2;

        room.clients.set(clientId, { socket, playerNum });
        joinedRoom = roomId;

        socket.send(
          JSON.stringify({ type: "assign", roomId, player: playerNum })
        );
        console.log(`👤 Joueur ${playerNum} rejoint room ${roomId}`);
      }

      if (msg.type === "input" && joinedRoom) {
        const room = rooms.get(joinedRoom);
        if (!room) return;
        const client = room.clients.get(clientId);
        if (!client) return;

        const gs = room.gameState;
        const paddle = client.playerNum === 1 ? gs.paddleOne : gs.paddleTwo;
        if (msg.left && client.playerNum === 1) paddle.x -= PDL_SPD;
        if (msg.right && client.playerNum === 1) paddle.x += PDL_SPD;
        if (msg.left && client.playerNum === 2) paddle.x += PDL_SPD;
        if (msg.right && client.playerNum === 2) paddle.x -= PDL_SPD;
      }
    });

    function cleanUp() {
      if (!joinedRoom) return;
      const room = rooms.get(joinedRoom);
      if (!room) return;
      room.clients.delete(clientId);
      if (room.clients.size === 0) {
        rooms.delete(joinedRoom);
        console.log(`🧹 Room ${joinedRoom} supprimée`);
      }
    }

    socket.on("close", cleanUp);
    socket.on("error", cleanUp);
  });
});
