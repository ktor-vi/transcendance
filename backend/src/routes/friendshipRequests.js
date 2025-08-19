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
		const senderId = await db.all('SELECT id FROM users WHERE name = ?', sender);
		const receiverId = await db.all('SELECT id FROM users WHERE name = ?', receiver);
		console.log("sender id = ", senderId);
		console.log("receiver id = ", receiverId);
		//const history = await historyDb.all('SELECT * FROM history WHERE player_1 = ? OR player_2 = ? ORDER BY created_at DESC', userName, userName);
		// await db.run(
		// 	`INSERT OR IGNORE INTO requests
		// 	()`
		// );
		
		// return reply.send(user);
  });
}