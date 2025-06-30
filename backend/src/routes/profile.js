import { openDb } from '../utils/db.js';

export default async function profileRoutes(fastify)
{
  fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const db = await openDb();
		const user = await db.get('SELECT * FROM OAUsers WHERE email = ?', userSession.email);
	
		return reply.send(user);
  });

  fastify.put('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend
		const { name } = req.body;

		const db = await openDb();
		await db.run('UPDATE OAUsers SET name = ? WHERE email = ?', name, userSession.email);
	
		reply.send({ success: true });
  });
}
