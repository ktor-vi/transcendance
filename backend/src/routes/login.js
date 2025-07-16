import { openDb } from '../utils/db.js';
import bcrypt from "bcrypt";

export default async function loginRoutes(fastify) {
	fastify.post('/login', async (req, reply) => {
		
		console.log("loginRoutes ASKED");
		const { email , password } = req.body;

		const db = await openDb();
		const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);

		if (!user)
			return (reply.code(401).send({ success: false, message: "Aucun compte avec cette adresse mail" }));
		else {
			console.log(`CET EMAIL EXISTE DANS LA DB`);
		}
			const isValid = await bcrypt.compare(password, user.password_hash);

			if (!isValid) {
				return (reply.code(401).send({ success: false, message: "Mot de passe incorrect" }));
			}
			req.session.set('user', user);
			return (reply.code(201).send({ success: true }));
		});
}
