import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';

export default async function friendsRoutes(fastify) {
	fastify.get('/requests', async (req, reply) => {
	
		const userSession = req.session.get('user');
		const db = await openDb();

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const userName = userSession.name;
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userName);
		const userId = userRow.id;
		const requests = await db.get('SELECT COUNT (*) AS total FROM requests WHERE receiver_id = ? AND status = ?', userId, "waiting");
		
		reply.send(requests.total);
	});

}