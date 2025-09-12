import fp from "fastify-plugin"; // Import Fastify plugin helper
import { getOrCreateConversation } from "./conversationService.js";
import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database("./data/users.sqlite3");

export default fp(async function (fastify) { // Declare and export Fastify plugin

	const clients = new Set(); // Store connected clients (each entry = a socket)
	// Note: For associating with DB later, using a Map with userId -> socket might be better

	// WebSocket entry point
	fastify.get("/chat", { websocket: true }, (socket, req) => {

		console.log("Meow: chat client connected");

		console.log(`[CHAT] New WebSocket connection from ${req.socket.remoteAddress}`);
		console.log(`[CHAT] Request headers:`, req.headers);

		clients.add(socket);
		console.log(`[CHAT] Client added. Total connected clients: ${clients.size}`);

		// Listen for messages from client
		socket.on("message", (raw) => {
			console.log(`[CHAT] Received message:`, raw.toString());

			let msg;
			try {
				msg = JSON.parse(raw);
				console.log(`[CHAT] Parsed message:`, msg);
			} catch (err) {
				console.error("[CHAT] JSON parsing error:", err);
				return;
			}

			if (msg.type === "chatMessage") {
				const payload = JSON.stringify({
					type: "chatMessage",
					user: msg.user ?? "Anonymous",
					content: msg.content,
				});

				console.log(`[CHAT] Broadcasting to ${clients.size} clients:`, payload);

				let broadcastCount = 0;
				for (const client of clients) {
					if (client !== socket && client.readyState === 1) {
						try {
							client.send(payload);
							broadcastCount++;
						} catch (err) {
							console.error("[CHAT] Error sending to a client:", err);
							clients.delete(client);
						}
					}
				}

				console.log(`[CHAT] Message broadcasted to ${broadcastCount} clients`);
			} else {
				console.log(`[CHAT] Ignored message type: ${msg.type}`);
			}
		});

		// Handle client disconnect
		socket.on("close", (code, reason) => {
			clients.delete(socket);
			console.log(`[CHAT] Client disconnected (Code: ${code}, Reason: ${reason}). Remaining clients: ${clients.size}`);
		});

		// Handle socket errors
		socket.on("error", (err) => {
			console.error("[CHAT] Socket error:", err);
			clients.delete(socket);
			console.log(`[CHAT] Client removed after error. Remaining clients: ${clients.size}`);
		});
	});

		// --- Direct Messages (DM) ---
	const dmClients = new Map(); // userId -> socket

	fastify.get("/dm", { websocket: true }, (socket, req) => {
		console.log("[DM] 🔍 Nouvelle connexion WebSocket DM");
		console.log("[DM] Headers:", req.headers);
		console.log("[DM] Query params:", req.query);
		console.log("[DM] Session complète:", req.session);
		console.log("[DM] req.session?.userId:", req.session?.userId);

		// 1️⃣ Debug complet de la session
		const senderId = req.session?.user?.id;
		console.log("[DM] SenderId extrait:", senderId, typeof senderId);

		if (!senderId) {
			console.log("[DM] ❌ Pas de senderId dans la session, fermeture WebSocket");
			socket.send(JSON.stringify({
				type: "error",
				message: "Session utilisateur non trouvée"
			}));
			socket.close(4001, "No user session");
			return;
		}

		// 2️⃣ Debug du query parameter receiver
		const receiverId = req.query.receiverId;
		console.log("[DM] ReceiverId depuis query params:", receiverId, typeof receiverId);

		if (!receiverId) {
			console.log("[DM] ❌ Pas de receiverId dans les query params");
			socket.send(JSON.stringify({
				type: "error",
				message: "ID destinataire manquant dans l'URL"
			}));
			socket.close(4002, "No receiver ID");
			return;
		}

		// 3️⃣ Vérifier que senderId != receiverId
		if (senderId.toString() === receiverId.toString()) {
			console.log("[DM] ❌ Tentative d'envoi de DM à soi-même");
			socket.send(JSON.stringify({
				type: "error",
				message: "Impossible d'envoyer un DM à soi-même"
			}));
			socket.close(4003, "Cannot DM self");
			return;
		}

		console.log("[DM] ✅ Connexion valide:", { senderId, receiverId });

		// 4️⃣ Stocke le socket pour l'utilisateur connecté
		dmClients.set(senderId.toString(), socket);
		console.log("[DM] Socket stocké pour utilisateur:", senderId);
		console.log("[DM] Clients DM connectés:", Array.from(dmClients.keys()));

		// Confirmer la connexion au client
		socket.send(JSON.stringify({
			type: "dmConnected",
			senderId: senderId,
			receiverId: receiverId
		}));

		socket.on("message", async (raw) => {
			console.log("[DM] Message reçu:", raw.toString());
			let msg;
			try {
				msg = JSON.parse(raw);
				console.log("[DM] Message parsé:", msg);
			} catch (err) {
				console.error("[DM] Erreur parsing JSON:", err);
				return;
			}

			if (msg.type === "dmMessage" && msg.content) {
				console.log("[DM] Traitement du message DM:", msg.content);

				try {
					// a) Crée ou récupère la conversation
					const conversationId = await getOrCreateConversation(senderId, receiverId);
					console.log("[DM] ConversationId:", conversationId);

					// b) Sauvegarde le message en DB
					db.run(
						`INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
						[conversationId, senderId, msg.content],
						(err) => {
							if (err) {
								console.error("[DM] Erreur DB:", err);
							} else {
								console.log("[DM] Message sauvegardé en DB");
							}
						}
					);

					// c) Prépare le payload pour le destinataire
					const dmPayload = JSON.stringify({
						type: "dmMessage",
						conversationId: conversationId,
						from: senderId,
						to: receiverId,
						content: msg.content,
						timestamp: new Date().toISOString()
					});

					console.log("[DM] Payload à envoyer:", dmPayload);

					// d) Envoie le message au destinataire si connecté
					const receiverKey = receiverId.toString();
					if (dmClients.has(receiverKey)) {
						console.log("[DM] ✅ Destinataire connecté, envoi du message");
						try {
							dmClients.get(receiverKey).send(dmPayload);
							console.log("[DM] Message envoyé au destinataire");
						} catch (err) {
							console.error("[DM] Erreur lors de l'envoi:", err);
							dmClients.delete(receiverKey);
						}
					} else {
						console.log("[DM] ⚠️ Destinataire non connecté");
					}

					// e) Confirme l'envoi à l'expéditeur
					socket.send(JSON.stringify({
						type: "dmSent",
						conversationId: conversationId,
						to: receiverId,
						content: msg.content,
						timestamp: new Date().toISOString()
					}));

				} catch (err) {
					console.error("[DM] Erreur lors du traitement:", err);
					socket.send(JSON.stringify({
						type: "error",
						message: "Erreur lors de l'envoi du message"
					}));
				}
			} else {
				console.log("[DM] Type de message ignoré:", msg.type);
			}
		});

		// Nettoyage à la fermeture ou erreur
		const cleanup = () => {
			dmClients.delete(senderId.toString());
			console.log("[DM] Nettoyage effectué pour utilisateur:", senderId);
			console.log("[DM] Clients restants:", Array.from(dmClients.keys()));
		};

		socket.on("close", (code, reason) => {
			console.log("[DM] Connexion fermée:", { code, reason });
			cleanup();
		});

		socket.on("error", (err) => {
			console.error("[DM] Erreur socket:", err);
			cleanup();
		});
	});

	console.log("[DM PLUGIN] Direct messaging WebSocket ready");
});

/*import fp from "fastify-plugin"; // Import Fastify plugin helper
import { getOrCreateConversation } from "./conversationService.js";
import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database("./data/users.sqlite3");

export default fp(async function (fastify) { // Declare and export Fastify plugin
	const clients = new Set(); // Store connected clients (each entry = a socket)
	// Note: For associating with DB later, using a Map with userId -> socket might be better

	// WebSocket entry point
	fastify.get("/chat", { websocket: true }, (socket, req) => {
		console.log("Meow: chat client connected");
		console.log(`[CHAT] New WebSocket connection from ${req.socket.remoteAddress}`);
		console.log(`[CHAT] Request headers:`, req.headers);
		clients.add(socket);
		console.log(`[CHAT] Client added. Total connected clients: ${clients.size}`);

		// Listen for messages from client
		socket.on("message", (raw) => {
			console.log(`[CHAT] Received message:`, raw.toString());
			let msg;
			try {
				msg = JSON.parse(raw);
				console.log(`[CHAT] Parsed message:`, msg);
			} catch (err) {
				console.error("[CHAT] JSON parsing error:", err);
				return;
			}
			if (msg.type === "chatMessage") {
				const payload = JSON.stringify({
					type: "chatMessage",
					user: msg.user ?? "Anonymous",
					content: msg.content,
				});
				console.log(`[CHAT] Broadcasting to ${clients.size} clients:`, payload);
				let broadcastCount = 0;
				for (const client of clients) {
					if (client !== socket && client.readyState === 1) {
						try {
							client.send(payload);
							broadcastCount++;
						} catch (err) {
							console.error("[CHAT] Error sending to a client:", err);
							clients.delete(client);
						}
					}
				}
				console.log(`[CHAT] Message broadcasted to ${broadcastCount} clients`);
			} else {
				console.log(`[CHAT] Ignored message type: ${msg.type}`);
			}
		});

		// Handle client disconnect
		socket.on("close", (code, reason) => {
			clients.delete(socket);
			console.log(`[CHAT] Client disconnected (Code: ${code}, Reason: ${reason}). Remaining clients: ${clients.size}`);
		});

		// Handle socket errors
		socket.on("error", (err) => {
			console.error("[CHAT] Socket error:", err);
			clients.delete(socket);
			console.log(`[CHAT] Client removed after error. Remaining clients: ${clients.size}`);
		});
	});

	// --- Direct Messages (DM) ---
	const dmClients = new Map(); // userId -> socket

	fastify.get("/dm", { websocket: true }, (socket, req) => {
		console.log("[DM] 🔍 Nouvelle connexion WebSocket DM");
		console.log("[DM] Headers:", req.headers);
		console.log("[DM] Query params:", req.query);
		console.log("[DM] Session complète:", req.session);
		console.log("[DM] req.session?.user?.id:", req.session?.user?.id);

		// 1️⃣ Debug complet de la session
		const senderId = req.session?.userId;
		console.log("[DM] SenderId extrait:", senderId, typeof senderId);

		if (!senderId) {
			console.log("[DM] ❌ Pas de senderId dans la session, fermeture WebSocket");
			socket.send(JSON.stringify({
				type: "error",
				message: "Session utilisateur non trouvée"
			}));
			socket.close(4001, "No user session");
			return;
		}

		// 2️⃣ Debug du query parameter receiver
		const receiverId = req.query.receiverId;
		console.log("[DM] ReceiverId depuis query params:", receiverId, typeof receiverId);

		if (!receiverId) {
			console.log("[DM] ❌ Pas de receiverId dans les query params");
			socket.send(JSON.stringify({
				type: "error",
				message: "ID destinataire manquant dans l'URL"
			}));
			socket.close(4002, "No receiver ID");
			return;
		}

		// 3️⃣ Vérifier que senderId != receiverId
		if (senderId.toString() === receiverId.toString()) {
			console.log("[DM] ❌ Tentative d'envoi de DM à soi-même");
			socket.send(JSON.stringify({
				type: "error",
				message: "Impossible d'envoyer un DM à soi-même"
			}));
			socket.close(4003, "Cannot DM self");
			return;
		}

		console.log("[DM] ✅ Connexion valide:", { senderId, receiverId });

		// 4️⃣ Stocke le socket pour l'utilisateur connecté
		dmClients.set(senderId.toString(), socket);
		console.log("[DM] Socket stocké pour utilisateur:", senderId);
		console.log("[DM] Clients DM connectés:", Array.from(dmClients.keys()));

		// Confirmer la connexion au client
		socket.send(JSON.stringify({
			type: "dmConnected",
			senderId: senderId,
			receiverId: receiverId
		}));

		socket.on("message", async (raw) => {
			console.log("[DM] Message reçu:", raw.toString());
			let msg;
			try {
				msg = JSON.parse(raw);
				console.log("[DM] Message parsé:", msg);
			} catch (err) {
				console.error("[DM] Erreur parsing JSON:", err);
				return;
			}

			if (msg.type === "dmMessage" && msg.content) {
				console.log("[DM] Traitement du message DM:", msg.content);

				try {
					// a) Crée ou récupère la conversation
					const conversationId = await getOrCreateConversation(senderId, receiverId);
					console.log("[DM] ConversationId:", conversationId);

					// b) Sauvegarde le message en DB
					db.run(
						`INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
						[conversationId, senderId, msg.content],
						(err) => {
							if (err) {
								console.error("[DM] Erreur DB:", err);
							} else {
								console.log("[DM] Message sauvegardé en DB");
							}
						}
					);

					// c) Prépare le payload pour le destinataire
					const dmPayload = JSON.stringify({
						type: "dmMessage",
						conversationId: conversationId,
						from: senderId,
						to: receiverId,
						content: msg.content,
						timestamp: new Date().toISOString()
					});

					console.log("[DM] Payload à envoyer:", dmPayload);

					// d) Envoie le message au destinataire si connecté
					const receiverKey = receiverId.toString();
					if (dmClients.has(receiverKey)) {
						console.log("[DM] ✅ Destinataire connecté, envoi du message");
						try {
							dmClients.get(receiverKey).send(dmPayload);
							console.log("[DM] Message envoyé au destinataire");
						} catch (err) {
							console.error("[DM] Erreur lors de l'envoi:", err);
							dmClients.delete(receiverKey);
						}
					} else {
						console.log("[DM] ⚠️ Destinataire non connecté, clients disponibles:", Array.from(dmClients.keys()));
					}

					// e) Confirme l'envoi à l'expéditeur
					socket.send(JSON.stringify({
						type: "dmSent",
						conversationId: conversationId,
						to: receiverId,
						content: msg.content,
						timestamp: new Date().toISOString()
					}));

				} catch (err) {
					console.error("[DM] Erreur lors du traitement:", err);
					socket.send(JSON.stringify({
						type: "error",
						message: "Erreur lors de l'envoi du message"
					}));
				}
			} else {
				console.log("[DM] Type de message ignoré:", msg.type);
			}
		});

		// Nettoyage à la fermeture ou erreur
		const cleanup = () => {
			dmClients.delete(senderId.toString());
			console.log("[DM] Nettoyage effectué pour utilisateur:", senderId);
			console.log("[DM] Clients restants:", Array.from(dmClients.keys()));
		};

		socket.on("close", (code, reason) => {
			console.log("[DM] Connexion fermée:", { code, reason });
			cleanup();
		});

		socket.on("error", (err) => {
			console.error("[DM] Erreur socket:", err);
			cleanup();
		});
	});

	console.log("[DM PLUGIN] Direct messaging WebSocket ready");
});*/
