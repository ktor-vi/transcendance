import { openDb } from '../utils/db.js';

export default async function usersListRoutes(fastify)
{
	fastify.get('/usersList', async (req, reply) => {
		const db = await openDb();
		const users = await db.all('SELECT name FROM users');
		reply.send(users);
	});
}
