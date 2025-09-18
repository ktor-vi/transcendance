import fs from 'fs/promises';
import { openDb, openDbHistory } from '../utils/db.js';

export default async function userProfileRoutes(fastify) {
	// Get profile info of a specific user
	fastify.get('/user/:name', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not connected' });

		const db = await openDb();
		const userName = req.params.name;
		const userInfos = await db.get('SELECT * FROM users WHERE name = ?', userName);

		if (!userInfos) return reply.code(404).send({ error: "User does not exist" });

		// Ensure picture exists
		try {
			await fs.access(userInfos.picture);
		} catch {
			userInfos.picture = "/uploads/default.jpg";
		}

		reply.send(userInfos);
	});

	// Get match history of a specific user
	fastify.get('/user/history/:name', async (req, reply) => {
		const historyDb = await openDbHistory();
		const userName = req.params.name;

		const history = await historyDb.all(
			`SELECT 
				type, 
				player_1, 
				player_2, 
				scores, 
				winner,
				strftime('%Y-%m-%d %H:%M', datetime(created_at, '+2 hours')) AS created_at
			FROM history 
			WHERE player_1 = ? OR player_2 = ? 
			ORDER BY created_at DESC`,
			userName, userName
		);

		if (!history) return reply.code(404).send({ success: false, message: "Unable to retrieve history" });

		reply.send(history);
	});
}
