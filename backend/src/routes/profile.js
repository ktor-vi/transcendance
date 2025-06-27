import { openDb } from '../utils/db.js';

export default async function profileRoutes(fastify)
{
  fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const db = await openDb();
		const user = db.get('SELECT * FROM OAUsers where email = ?', userSession.email);
	
		return reply.send(user);
  });
}
