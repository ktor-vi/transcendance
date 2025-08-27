import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';

export default async function friendshipRequestsRoutes(fastify)
{
	fastify.post('/friendshipButton', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const sender = userSession.name;
		const receiver = req.body;
		console.log("sender = ", sender);
		console.log("receiver = ", receiver);

		const db = await openDb();
		
		const senderRow = await db.all('SELECT id FROM users WHERE name = ?', sender);
		const receiverRow = await db.all('SELECT id FROM users WHERE name = ?', receiver);
		
		
		const senderId = senderRow[0]?.id;
		const receiverId = receiverRow[0]?.id;

		const existingRequest = await db.get('SELECT * FROM requests WHERE sender_id = ? AND receiver_id = ? AND status = ?', [senderId, receiverId, 'waiting']);
		if (existingRequest)
			return (reply.code(409).send({ success: false, message: "Tu as déjà envoyé une requête" }));

		console.log("sender id = ", senderId);
		console.log("receiver id = ", receiverId);
		await db.run(
			`INSERT OR IGNORE INTO requests
			(sender_id, receiver_id)
			VALUES (?, ?)`,
			[senderId, receiverId]
		);
		
		return (reply.code(200).send({ success: true }));
	});
	// accepter une demande d'ami (et donc mettre à jour les tables)
	fastify.post('/friends/requests/accept', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const user = userSession.name;
		const asker = req.body.sender_name;
		console.log("user = ", user);
		console.log("asker = ", asker);

		const db = await openDb();
		
		const userRow = await db.all('SELECT id FROM users WHERE name = ?', user);
		const askerRow = await db.all('SELECT id FROM users WHERE name = ?', asker);
		
		
		const userId = userRow[0]?.id;
		const askerId = askerRow[0]?.id;
		const user1 = Math.min(userId, askerId);
		const user2 = Math.max(userId, askerId);
		if (await db.get('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2))
		{
			await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', `canceled`, askerId, userId);
			return (reply.code(409).send({ message: 'Vous êtes déjà amis' }));
		}

		console.log("user1 = ", userId);
		console.log("user2 = ", askerId);
		await db.run(
			`INSERT OR IGNORE INTO friends
			(user1_id, user2_id)
			VALUES (?, ?)`,
			[user1, user2]
		);
		
		await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', `accepted`, askerId, userId);
		
		return (reply.code(200).send({ success: true }));
	});
	/*refuser une demande d'ami*/
	fastify.post('/friends/requests/decline', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const user = userSession.name;
		const asker = req.body.sender_name;
		console.log("user = ", user);
		console.log("asker = ", asker);

		const db = await openDb();
		
		const userRow = await db.all('SELECT id FROM users WHERE name = ?', user);
		const askerRow = await db.all('SELECT id FROM users WHERE name = ?', asker);
		
		
		const userId = userRow[0]?.id;
		const askerId = askerRow[0]?.id;

		const user1 = Math.min(userId, askerId);
		const user2 = Math.max(userId, askerId);
		console.log("user1 = ", userId);
		console.log("user2 = ", askerId);

		if (await db.all('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2))
		{
			await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', `canceled`, askerId, userId);
			return (reply.code(409).send({ message: 'Vous êtes déjà amis' }));
		}	

		console.log("userId = ", userId);
		console.log("askerId = ", askerId);
		await db.run(
			`INSERT OR IGNORE INTO friends
			(user1_id, user2_id)
			VALUES (?, ?)`,
			[userId, askerId]
		);
		
		await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', `refused`, askerId, userId);
		
		return (reply.code(200).send({ success: true }));
	});
}