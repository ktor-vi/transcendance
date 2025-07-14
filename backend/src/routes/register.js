import { openDb } from '../utils/db.js';

export default async function registerRoutes(fastify) {
	fastify.post('/register', async (req, reply) => {

	   console.log("🔔 route POST /api/register reached");
		const { email , name, password } = req.body;
		const hashPassword =  await bcrypt.hash(password, 10);

		const db = await openDb();
		const result = await db.run(
			`INSERT OR IGNORE INTO users 
	  		(email, name, given_name, family_name, password_hash, picture)
	  		VALUES (?, ?, ?, ?, ?, ?)`,
	  		[email, name, "", "", hashPassword, ""]
		);
		if (result.changes > 0) {
			console.log(`NOUVEL UTILISATEUR CRÉÉ : ${name}`);
			reply.code(201).send({ success: true });
		} else {
			console.log("L'utilisateur existait déjà dans la base de données.")
			reply.code(409).send({ success: false, message: "Adresse mail déjà enregistrée" });
		}
  });
}