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

		if (userInfos)
			reply.send(userInfos);
		else
			reply.code(404).send({ success: false, message: "Problème pendant l'affichage du profil" });
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
		const wins = await historyDb.get(`SELECT COUNT(*) as count FROM history WHERE winner = ?`, userName);
		const plays = await historyDb.get(`SELECT COUNT(*) as count FROM history WHERE player_1 = ? OR player_2 = ?`, userName, userName);
		
		const multiplier = 100/ plays.count;
		const stat = wins.count * multiplier;
		let ratio;
		if (plays.count === 0)
			ratio = 0;
		else
			ratio = Math.round(stat)


		if (history)
			reply.send({
				history: history,
				wins: wins.count,
				plays: plays.count,
				ratio: ratio
		});
		else
			reply.code(404).send({ success: false, message: "Problème pendant l'affichage du profil" });
	});
}
