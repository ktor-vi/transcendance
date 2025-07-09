import { openDb } from '../utils/db.js';

export default async function profileRoutes(fastify)
{
  fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const db = await openDb();
		const user = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);
	
		return reply.send(user);
  });

  fastify.put('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend
		const { name, given_name, family_name } = req.body;

		const db = await openDb();
		await db.run('UPDATE users SET name = ?, given_name = ?, family_name = ? WHERE email = ?', name, given_name, family_name, userSession.email);
	
		reply.send({ success: true });
  });

	fastify.post('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend
		const { name, given_name, family_name } = req.body;

		const db = await openDb();
		await db.run('UPDATE users SET name = ?, given_name = ?, family_name = ? WHERE email = ?', name, given_name, family_name, userSession.email);
	
		reply.send({ success: true });
	});

	fastify.post('/profile/picture', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend
		const { name, given_name, family_name } = req.body;

		const db = await openDb();
		await db.run('UPDATE users SET name = ? WHERE email = ?', name);
	
		reply.send({ success: true });
  });
}
