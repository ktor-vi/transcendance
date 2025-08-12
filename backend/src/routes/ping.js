import { updateUserPing } from '../utils/connectedUsers.js';

export default async function pingRoutes(fastify) {
	fastify.post('/ping', async (req, reply) => {
		const user = res.session.get('user');
		if (!user)
			return reply.code(401).send({ error: 'Non connecté' });
		updateUserPing(user.id);
		return { ok: true };
	});
}