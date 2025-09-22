import { isUserOnline } from '../utils/connectedUsers.js';

export default async function userRoutes(fastify) {
	// Get current logged-in user
	fastify.get('/me', async (req, reply) => {
		const user = req.session.get('user');
		if (!user) return reply.code(401).send({ error: 'Not connected' });
		return user;
	});

	// Check if a specific user is online
	fastify.get('/user/:name/online', async (req, reply) => {
		const online = isUserOnline(req.params.name);
		return { online };
	});
}

