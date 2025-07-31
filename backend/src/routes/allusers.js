import { openDb } from '../utils/db.js';

export default async function allUsersRoutes(fastify)
{
	fastify.get('/allusers', async (req, reply) => {
		const db = await openDb();
		const users = await db.all('SELECT id, email, name FROM users');
		reply.send(users);
	});
}
