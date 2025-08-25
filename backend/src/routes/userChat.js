import { openDb, openChatDB } from '../utils/db.js';

/**
 * 
 * @param {*} fastify 
 */
export default async function privateChat(fastify)
{
	fastify.get('/chat', async (req, reply) => {
		const userDB = await openDb();
		const chatDB = await openChatDB();
		const user1 = req.user.id;
		const user2 = req.params.name;

		let conversationID = await chatDB.get(`
			SELECT * FROM conversations
			WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
			user1, user2, user2, user1);
		if (!conversationID){
			const result = await db.run(`
      			INSERT INTO conversations (user1_id, user2_id)
      			VALUES (?, ?)`,
				user1, user2);
    		conversationID = { id: result.lastID };
		}
		let conversation = await chatDB.all('SELECT * FROM messages \
			WHERE conversation_id = ? ORDER BY created_at DESC',
			conversationID);
	if (!conversation)
		reply.code(404).send({ success: false, message: "Problème pendant l'affichage du chat" });
	reply.send(conversation);
	});
}
