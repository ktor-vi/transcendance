import fs from 'fs/promises';

import { openDb, openDbHistory } from '../utils/db.js';

export default async function userProfileRoutes(fastify)
{

	fastify.get('/user/:name', async (req, reply) => {

		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Vous devez être connecté' });
		}
		
		const db = await openDb();
		const userName = req.params.name;
		

		const userInfos = await db.get('SELECT * FROM users WHERE name = ?', userName);
		if (!userInfos)
			reply.code(404).send({ error: "Cet utilisateur n'existe pas" });
		console.log("userProfile:");
		console.log(userInfos.picture);
		console.log("PATH");

		try {
			await fs.access(userInfos.picture);
		} catch {
			userInfos.picture = "/uploads/default.jpg";
		}
		if (userInfos)
			reply.send(userInfos);
		else
			reply.code(404).send({ success: false, message: "Problème pendant l'affichage du profil" });
	});
	
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
	if (history)
		reply.send(history);
	else
		reply.code(404).send({ success: false, message: "Problème pendant l'affichage du profil" });
	});
}
