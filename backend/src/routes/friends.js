import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';

export default async function friendsRoutes(fastify) {
	// route pour récupérer le nombre de requêtes qu'on a en attente
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
	// route pour afficher la liste de nos amis
	fastify.get('/friends', async (req, reply) => {

		const userSession = req.session.get('user');
		const db = await openDb();

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		const userName = userSession.name;
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userName);
		const userId = userRow.id;
		
		const friendsList = await db.all(`
			SELECT
			CASE WHEN friends.user1_id = ?
			THEN u2.name
			ELSE u1.name END AS friend_name,
			friends.friends_since FROM friends
			JOIN users u1 ON friends.user1_id = u1.id
			JOIN users u2 ON friends.user2_id = u2.id
			WHERE friends.user1_id = ? OR friends.user2_id = ?
			`, userId, userId, userId);
			
		console.log("List d'amis :");
		console.log(friendsList);

		const totalFriends = await db.get('SELECT COUNT (*) AS total FROM friends WHERE user1_id = ? OR user2_id = ?', userId, userId);
		console.log("Nombre d'amis :");
		console.log(totalFriends);
		reply.send({
			total: totalFriends.total,
			friends: friendsList
		});
	});
	// route qui gère la page des requêtes
	fastify.get('/friends/requests', async (req, reply) => {
		const userSession = req.session.get('user');
		const db = await openDb();

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const userName = userSession.name;
		const userRow = await db.get('SELECT * FROM users WHERE name = ?', userName);
		const receiverId = userRow.id;

		const requestsTable = await db.all('SELECT sender_id, request_date FROM requests WHERE receiver_id = ? AND status = ?', receiverId, "waiting");
		console.log("Table des requêtes :");
		console.log(requestsTable);

		const sendersList = await db.all(`
			SELECT
				u.name AS sender_name,
				requests.request_date
			FROM requests
			JOIN users u
				ON requests.sender_id = u.id
			WHERE requests.receiver_id = ?
				AND requests.status= 'waiting'
			`, receiverId);
		console.log("Noms des sender :");
		console.log(sendersList);
		reply.send(sendersList );
	});
	// route pour voir si on déjà amis avec qqu
	fastify.get('/friends/isFriend/:friendName', async (req, reply) => {
		const friend = req.params.friendName;
		const userSession = req.session.get('user');

		const db = await openDb();
		const friendRow = await db.get('SELECT id FROM users WHERE name = ?', friend);
		const userRow = await db.get('SELECT id FROM users WHERE name = ?', userSession.name);

		const friendId = friendRow?.id;
		const userId = userRow?.id;

		const user1 = Math.min(friendId, userId);
		const user2 = Math.max(friendId, userId);

		let friendship = false;

		if (await db.get('SELECT * FROM friends WHERE user1_id = ? AND user2_id = ?', user1, user2))
			friendship = true;
		reply.code(200).send({ friendship });
	});
}