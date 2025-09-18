import { openDb } from "../utils/db.js";

export default async function blocking(fastify) {
	// POST endpoint to block or unblock a user
	fastify.post("/blocking", async (req, reply) => {
		const { senderId, receiverId, blocked } = req.body;
		const db = await openDb();

		if (blocked) {
			// block the user
			await db.run(
				`INSERT OR IGNORE INTO blockedUsers (blocker_id, blocked_id) VALUES (?, ?)`,
				[senderId, receiverId]
			);
		} else {
			// unblock the user
			await db.run(
				`DELETE FROM blockedUsers WHERE blocker_id = ? AND blocked_id = ?`,
				[senderId, receiverId]
			);
		}

		return reply.send({ success: true });
	});

	// POST endpoint to check if a user is blocked
	fastify.post("/blockedStatus", async (req, reply) => {
		const { senderId, receiverId } = req.body;
		const db = await openDb();

		const blockedStatus = await db.get(
			`SELECT 1 FROM blockedUsers WHERE blocker_id = ? AND blocked_id = ?`,
			[senderId, receiverId]
		);

		// return boolean status
		return reply.send({ blocked: !!blockedStatus });
	});
}
