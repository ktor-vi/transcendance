import { openDb } from '../utils/db.js';
import bcrypt from "bcrypt";

export default async function forgotPwdRoutes(fastify) {
	fastify.post('/forgotPassword', async (req, reply) => {
		console.log("🔔 route POST /api/forgotPassword reached");

		const { email , question, response } = req.body;

		if (!req.body)
			return (reply.code(400).send({ success: false, message: "Problème lors de la récupération du body forgotPwd" }));

		const db = await openDb();
		const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);
		const db_question = user.question;

		if (!user)
			return (reply.code(401).send({ success: false, message: "Aucun compte avec cette adresse mail" }));
		else {
			console.log(`CET EMAIL EXISTE DANS LA DB`);
		}

		const isValid = await bcrypt.compare(response, user.response_hash);

		console.log("J'ai choisi la :");
		console.log(question);
		console.log("Dans la DB j'ai :");
		console.log(db_question);

		if (!isValid || question !== db_question) {
			return (reply.code(401).send({ success: false, message: "La question et la réponse ne correspondent pas" }));
		}

		return (reply.code(201).send({ success: true }));
		
	});
}