import { openDb } from "../utils/db.js";

export default async function friendshipRequestsRoutes(fastify) {
	// POST endpoint to send a friendship request
	fastify.post('/friendshipButton', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const sender = userSession.name;
		const receiver = req.body;

		const db = await openDb();
		const senderRow = await db.all('SELECT id FROM users WHERE name = ?', sender);
		const receiverRow = await db.all('SELECT id FROM users WHERE name = ?', receiver);

		const senderId = senderRow[0]?.id;
		const receiverId = receiverRow[0]?.id;

		// Prevent duplicate requests
		const existingRequest = await db.get(
			'SELECT * FROM requests WHERE sender_id = ? AND receiver_id = ? AND status = ?',
			[senderId, receiverId, 'waiting']
		);
		if (existingRequest)
			return reply.code(409).send({ success: false, message: "Une requête a déjà été envoyée" });

		await db.run(
			`INSERT OR IGNORE INTO requests (sender_id, receiver_id) VALUES (?, ?)`,
			[senderId, receiverId]
		);

		return reply.code(200).send({ success: true });
	});

	// POST endpoint to accept a friendship request
	fastify.post('/friends/requests/accept', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const user = userSession.name;
		const asker = req.body.sender_name;

		const db = await openDb();
		const userRow = await db.all('SELECT id FROM users WHERE name = ?', user);
		const askerRow = await db.all('SELECT id FROM users WHERE name = ?', asker);

		const userId = userRow[0]?.id;
		const askerId = askerRow[0]?.id;

		const user1 = Math.min(userId, askerId);
		const user2 = Math.max(userId, askerId);

		// Prevent adding if already friends
		if (await db.get('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2)) {
			await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', 'canceled', askerId, userId);
			return reply.code(409).send({ message: 'Déjà ami' });
		}

		// Insert friendship and update request status
		await db.run('INSERT OR IGNORE INTO friends (user1_id, user2_id) VALUES (?, ?)', [user1, user2]);
		await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', 'accepted', askerId, userId);

		return reply.code(200).send({ success: true });
	});

	// POST endpoint to decline a friendship request
	fastify.post('/friends/requests/decline', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const user = userSession.name;
		const asker = req.body.sender_name;

		const db = await openDb();
		const userRow = await db.all('SELECT id FROM users WHERE name = ?', user);
		const askerRow = await db.all('SELECT id FROM users WHERE name = ?', asker);

		const userId = userRow[0]?.id;
		const askerId = askerRow[0]?.id;

		const user1 = Math.min(userId, askerId);
		const user2 = Math.max(userId, askerId);

		// Prevent action if already friends
		if (await db.get('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2)) {
			await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', 'canceled', askerId, userId);
			return reply.code(409).send({ message: 'Déjà ami' });
		}

		// Update request status to refused
		await db.run('UPDATE requests SET status = ? WHERE sender_id = ? AND receiver_id = ?', 'refused', askerId, userId);

		return reply.code(200).send({ success: true });
	});
}
