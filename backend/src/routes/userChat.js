import { openDb, openChatDB } from '../utils/db.js';

/**
 * Find and send a conversation between two users
 * @param {*} fastify
 */
export default async function privateChat(fastify)
{
	fastify.get('/chat/:name', async (req, reply) => {
		const userDB = await openDb();
		const chatDB = await openChatDB();

		// define users of the conversation
		let userFrom = req.user.id;
		let userTo = await userDB.get(`
			SELECT * FROM users
			WHERE name = ?`,
			req.params.name).id;

		// get conversation
		let conversationID = await chatDB.get(`
			SELECT * FROM conversations
			WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
			userFrom, userTo, userTo, userFrom).id;
		if (!conversationID){
			let result = await chatDB.run(`
      			INSERT INTO conversations (user1_id, user2_id)
      			VALUES (?, ?)`,
				userFrom, userTo);
    		conversationID = { id: result.lastID };
		}

		// send reply
		let conversation = await chatDB.get(`
			SELECT * FROM messages
			WHERE conversation_id = ? ORDER BY created_at DESC`,
			conversationID);
		if (!conversation)
			reply.code(404).send({ success: false, message: "Problème pendant l'affichage du chat" });
		else
			reply.send(conversation);
	});

	fastify.post('/chat/:name', async (req, reply) => {
		const userDB = await openDb();
		const chatDB = await openChatDB();

		// define users of the conversation
		let userFrom = req.user.id;
		let userTo = await userDB.get(`
			SELECT * FROM users
			WHERE name = ?`,
			req.params.name).id;

		// get conversation
		let conversationID = await chatDB.get(`
			SELECT * FROM conversations
			WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
			userFrom, userTo, userTo, userFrom).id;
		if (!conversationID){
			let result = await chatDB.run(`
      			INSERT INTO conversations (user1_id, user2_id)
      			VALUES (?, ?)`,
				userFrom, userTo);
    		conversationID = { id: result.lastID };
		}

		// insert new message in the conversation
		let content = req.content;
		chatDB.run(`
			INSERT INTO messages (conversation_id, sender_id, content)
			VALUES (?, ?, ?)`,
			conversationID, userFrom, content);

		// send reply
		let conversation = await chatDB.get(`
			SELECT * FROM messages
			WHERE conversation_id = ? ORDER BY created_at DESC`,
			conversationID);
		if (!conversation)
			reply.code(404).send({ success: false, message: "Problème pendant l'affichage du chat" });
		else
			reply.send(conversation);
	});
}
