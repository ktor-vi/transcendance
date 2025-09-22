// // ws-server.ts
// import { WebSocketServer } from 'ws';

// // Start WebSocket server on port 3000
// const wss = new WebSocketServer({ port: 3000 });

// wss.on('connection', (ws) => {
// 	ws.on('message', (message) => {
// 		const data = JSON.parse(message.toString());

// 		// Broadcast chat messages to all clients
// 		if (data.type === "chatMessage") {
// 			wss.clients.forEach((client) => {
// 				if (client.readyState === ws.OPEN) client.send(JSON.stringify(data));
// 			});
// 		}
// 	});

// 	console.log("🟢 New client connected"); // informational
// });
