import { openDb, openDbHistory } from '../utils/db.js';

export default async function userProfileRoutes(fastify)
{
	fastify.get('/user/:name', async (req, reply) => {
		const historyDb = await openDbHistory();
		const userName = req.params.name;

		const history = await historyDb.all('SELECT * FROM history WHERE player_1 = ? OR player_2 = ? ORDER BY created_at DESC', userName, userName
	);
	if (history)
		reply.send(history);
	else
		reply.code(404).send({ success: false, message: "Problème pendant l'afichage du profil" });
	});
}
