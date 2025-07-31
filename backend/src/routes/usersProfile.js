import { openDb } from '../utils/db.js';

export default async function userProfileRoutes(fastify)
{
	fastify.get('/user/:name', async (req, reply) => {
		const db = await openDb();
		const userName = req.params.name;

		const user = await db.get('SELECT * FROM users WHERE name = ?', userName);
		if (user)
			reply.send(user);
		else
			reply.code(404).send({ error: "Utilisateur inconnu"});
	});
}
