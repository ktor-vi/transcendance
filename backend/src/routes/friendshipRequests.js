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
		console.log("receiver = ", receiver);
		const senderRow = await db.all('SELECT id FROM users WHERE name = ?', sender);
		const receiverRow = await db.all('SELECT id FROM users WHERE name = ?', receiver);
		const senderId = senderRow[0]?.id;
		const receiverId = receiverRow[0]?.id;

		console.log("sender id = ", senderId);
		console.log("receiver id = ", receiverId);
		await db.run(
			`INSERT OR IGNORE INTO requests
			(sender_id, receiver_id)
			VALUES (?, ?)`,
			[senderId, receiverId]
		);
		
		// return reply.send(user);
  });
}