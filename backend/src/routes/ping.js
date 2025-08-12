import { updateUserPing } from '../utils/connectedUsers.js';

export default async function pingRoutes(fastify) {
	fastify.post('/ping', async (req, reply) => {
		const user = req.session.get('user');
		if (!user) {
			console.log('Ping reçu mais pas connecté');
			return reply.code(401).send({ error: 'Non connecté' });
		}
		console.log('Ping reçu de', user.name);
		updateUserPing(user.name);
		return { ok: true };
	});
}