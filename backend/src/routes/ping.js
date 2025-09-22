import { updateUserPing } from '../utils/connectedUsers.js';

export default async function pingRoutes(fastify) {
	// POST /ping : update user's last activity timestamp
	fastify.post('/ping', async (req, reply) => {
		const user = req.session.get('user');

		// reject if user not logged in
		if (!user) {
			return reply.code(401).send({ error: 'User not logged in' });
		}

		// update user's last ping timestamp
		updateUserPing(user.name);

		return { ok: true };
	});
}

