import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';

export default async function friendsRoutes(fastify) {
	fastify.get('/requests', async (req, reply) => {
	
		const userSession = req.session.get('user');
		const db = await openDb();

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const userName = userSession.name;
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userName);
		const userId = userRow.id;
		const requests = await db.get('SELECT COUNT (*) AS total FROM requests WHERE receiver_id = ? AND status = ?', userId, "waiting");
		
		reply.send(requests.total);
	});

	fastify.get('/friends', async (req, reply) => {

		const userSession = req.session.get('user');
		const db = await openDb();

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		const userName = userSession.name;
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userName);
		const userId = userRow.id;

		const friendsTable = await db.all('SELECT * FROM friends WHERE user1_id = ? OR user2_id = ?', userId, userId);
		console.log("Table d'amis :");
		console.log(friendsTable);

		const friendsList = await db.all(`
			SELECT
			CASE WHEN friends.user1_id = ? THEN u2.name
      		ELSE u1.name END AS friend_name,
    		friends.friends_since FROM friends
  			JOIN users u1 ON friends.user1_id = u1.id
  			JOIN users u2 ON friends.user2_id = u2.id
  			WHERE friends.user1_id = ? OR friends.user2_id = ?
			`, userId, userId, userId);


		const totalFriends = await db.get('SELECT COUNT (*) AS total FROM friends WHERE user1_id = ? OR user2_id = ?', userId, userId);
		console.log("Nombre d'amis :");
		console.log(totalFriends);
		reply.send({
			total: totalFriends.total,
			friends: friendsList
		});
	});
}