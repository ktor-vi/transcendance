import { openDb } from '../utils/db.js';

export default async function usersListRoutes(fastify)
{
	fastify.get('/usersList', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		const db = await openDb();
		const users = await db.all('SELECT name FROM users ORDER BY name COLLATE NOCASE ASC');
		reply.send(users);
	});
}
