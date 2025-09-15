import { openDb } from '../utils/db.js';
/*import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';
*/

export default async function friendsRoutes(fastify) {
	// GET endpoint: number of pending friendship requests
	fastify.get('/requests', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const db = await openDb();
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userSession.name);
		const userId = userRow.id;

		const requests = await db.get(
			'SELECT COUNT(*) AS total FROM requests WHERE receiver_id = ? AND status = ?',
			[userId, "waiting"]
		);

		reply.send(requests.total);
	});

	// GET endpoint: list of friends
	fastify.get('/friends', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const db = await openDb();
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userSession.name);
		const userId = userRow.id;

		const friendsList = await db.all(`
			SELECT
				CASE WHEN friends.user1_id = ?
				THEN u2.name
				ELSE u1.name END AS friend_name,
				strftime('%Y-%m-%d %H:%M', datetime(friends.friends_since, '+2 hours')) AS friends_since
			FROM friends
			JOIN users u1 ON friends.user1_id = u1.id
			JOIN users u2 ON friends.user2_id = u2.id
			WHERE friends.user1_id = ? OR friends.user2_id = ?
		`, [userId, userId, userId]);

		const totalFriends = await db.get(
			'SELECT COUNT(*) AS total FROM friends WHERE user1_id = ? OR user2_id = ?',
			[userId, userId]
		);

		reply.send({
			total: totalFriends.total,
			friends: friendsList
		});
	});

	// GET endpoint: list of pending friendship requests
	fastify.get('/friends/requests', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const db = await openDb();
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userSession.name);
		const receiverId = userRow.id;

		const requestsList = await db.all(
			`SELECT
				u.name AS sender_name,
				strftime('%Y-%m-%d %H:%M', datetime(requests.request_date, '+2 hours')) AS request_date
			FROM requests
			JOIN users u ON requests.sender_id = u.id
			WHERE requests.receiver_id = ? AND requests.status = 'waiting'
			ORDER BY requests.request_date DESC`,
			[receiverId]
		);

		reply.send(requestsList);
	});

	// GET endpoint: check if a specific user is already a friend
	fastify.get('/friends/isFriend/:friendName', async (req, reply) => {
		const friendName = req.params.friendName;
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const db = await openDb();
		const friendRow = await db.get('SELECT id FROM users WHERE name = ?', friendName);
		const userRow = await db.get('SELECT id FROM users WHERE name = ?', userSession.name);

		const friendId = friendRow?.id;
		const userId = userRow?.id;

		const user1 = Math.min(friendId, userId);
		const user2 = Math.max(friendId, userId);

		const friendship = !!(await db.get('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2));

		reply.code(200).send({ friendship });
	});
}
