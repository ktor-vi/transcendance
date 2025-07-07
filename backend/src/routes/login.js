import { openDb } from '../utils/db.js';

export default async function loginRoutes(fastify) {
	fastify.post('/login', async (req, reply) => {
		
		console.log("loginRoutes ASKED");
		const { email , password } = req.body;

		const db = await openDb();
		const user = await db.get(`SELECT * FROM OAusers WHERE email = ?`, email);

		console.log("TEEEEEEEEST");
		if (!user)
			reply.code(401).send({ success: false, message: "Aucun compte avec cette adresse mail" });
		else {
			console.log(`CET EMAIL EXISTE DANS LA DB`);
			reply.code(201).send({ success: true });
		}
	});
}
