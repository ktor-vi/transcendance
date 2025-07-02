import { openDb } from '../utils/db.js';

console.log("🛠️  loading registerRoutes plugin");	
export default async function registerRoutes(fastify)
{
	console.log("🛠️  registerRoutes() called");

	fastify.post('/register', async (req, reply) => {


	   console.log("🔔 route POST /api/register reached");
		const { email , name, password } = req.body;

		const db = await openDb();
		const result = await db.run(
			`INSERT OR IGNORE INTO OAusers 
	  		(email, name, given_name, family_name, password_hash, picture)
	  		VALUES (?, ?, ?, ?, ?, ?)`,
	  		[email, name, "", "", password, ""]
		);
		if (result.changes > 0) {
			console.log(`NOUVEL UTILISATEUR CRÉÉ : ${name}`);
		}
		else
			console.log("L'utilisateur existait déjà dans la base de données.")
	
		reply.send({ success: true });
  });
}