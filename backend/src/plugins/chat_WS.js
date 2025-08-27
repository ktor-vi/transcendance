import fp from "fastify-plugin"; // importe fastify plugin 

// structs pour gerer les private rooms
const 121Rooms = new Map(); 
const user2Socket = new Map(); 
const socket2User = new Map();

// connexion a la DB chat
import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
const chatDb = new sqlite3.Database('./data/chat.sqlite3'); // est ce que ici je change pas pour le bon path ?

export default fp(async function (fastify) {  // declare et exporte le plugin fastify 
	
	fastify.get("/chat", { websocket: true }, (socket, req) => { 
	console.log("Miaou : client chat connecté"); 
	console.log(
	`[CHAT] Nouvelle connexion WebSocket depuis ${req.socket.remoteAddress}`
  );
  
	console.log(`[CHAT] Headers de la requête:`, req.headers);

  //clients.add(socket); A SUPP ??
	//console.log(
//	`[CHAT] Client ajouté. Total: ${clients.size} clients connectés`
 // );

	socket.on("message", (raw) => {
		console.log(`[CHAT] Message reçu:`, raw.toString());
		let msg;
		try {
	  	msg = JSON.parse(raw.toString());
	  	console.log(`[CHAT] Message parsé:`, msg);
	} catch (err) {
		console.error("[CHAT] Erreur de parsing JSON:", err);
		return;
	}

	switch (msg.type) {
		case "join_private_room":
			handleJoinPrivateRoom(socket, msg);
			break;
		case "private_message":
			handlePrivateMessage(socket, msg);
			break;
		case "chatMessage":
			// ici on peut mettre le code poyr une room geante ou tous les clients peuvent parler
			break;
		default:
			console.log(`[CHAAAAT] msg ignored : ${msg.type}`);
	}
});

function handleJoinPrivateRoom(socket, msg) {
	const { conversationId, userId } = msg;


	// associer socket et user dans les deux sens
	user2Socket.set(userId, socket);
	socket2User.set(socket, userId);

	if (!121Rooms.has(conversationId)) {
		121Rooms.set(conversationId, new Set());
	}
	121Rooms.get(conversationId).add(socket);

	console.log(`[CHAT] User ${userId} joined the chat ${conversationId}`);
}

function handlePrivateMessage(socket, msg) {
	const { conversationId, content } = msg;
	const senderId = socket2User.get(socket);

	if (!senderId) {
		console.error("[CHAT] wild socket without user identified");
		return;
	}

	const query = `
		INSERT INTO messages (conversation_id, sender_id, content)
		VALUES (?, ?, ?)
	`;

	chatDb.run(query, [conversationId, senderId, content], function(err) {
		if (err) {
			console.error("[CHAAAAAT] msg not saved", err);
			return;
		}

		const messageId = this.lastID;

		const userDb = new sqlite3.Database('./data/users.sqlite3');
		userDb.get('SELECT name FROM users WHERE id = ?', [senderId], (err, user) => {
			if (err || !user) {
				console.error("[CHAT] Error to fetch user:", err);
				return;
			}

			const payload = JSON.stringify({
				type: "private_message",
				messageId: messageId,
				conversationId: conversationId,
				senderId: senderId,
				senderName: user.name,
				content: content,
				timestamp: new Date().toISOString()
	  		});

			const room = 121Rooms.get(conversationId);
			if (room) {
	  			let broadcastCount = 0;
	  			for (const clientSocket of room) {
					if (clientSocket.readyState === 1) {
		  				try {
							clientSocket.send(payload);
							broadcastCount++;
		  				} catch (err) {
							console.error("[CHAT] Error send to the chatter:", err);
							room.delete(client);
		  				}
					}
	  			}
	  			console.log(`[CHAT] Msg broadcast to ${broadcastCount} client`);
			}

			userDb.close();
	});
  });

socket.on("close", (code, reason) => {
	const userId = socket2User.get(socket);

	clients.delete(socket);
	if (userId) {
		user2Socket.delete(userId);
	}
	socket2User.delete(socket);

	for (const [conversationId, room] of privateRooms.entries()) {
		if (room.has(socket)) {
			room.delete(socket);
			if (room.size === 0) {
				privateRooms.delete(conversationId);
			}
		}
	}
console.log( `[CHAT] Chatter disconnected`);
});
