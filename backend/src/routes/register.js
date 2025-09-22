import { openDb } from '../utils/db.js';
import { validateString } from '../utils/fetchUserInfo.js';
import bcrypt from 'bcrypt';

export default async function registerRoutes(fastify) {
	// POST /register : create a new user
	fastify.post('/register', async (req, reply) => {
		const { email, name, password, question, response } = req.body;

		// hash password and security response
		const hashPassword = await bcrypt.hash(password, 10);
		const hashResponse = await bcrypt.hash(response, 10);

		const db = await openDb();

		// check if email or name already exists
		const existingEmail = await db.get('SELECT * FROM users WHERE email = ?', [email]);
		const existingName = await db.get('SELECT * FROM users WHERE name = ?', [name]);

		if (existingEmail)
			return reply.code(409).send({ success: false, message: 'Cet email est déjà enregistré' });
		if (existingName)
			return reply.code(409).send({ success: false, message: 'Ce pseudo est déjà pris' });

		if (validateString(name) === false)
			return reply.code(403).send({ success: false, message: 'Caractères invalides dans pseudo' });
		if (validateString(response) === false)
			return reply.code(403).send({ success: false, message: 'Caractères invalides dans la réponse' });

		// insert new user with default picture
		const result = await db.run(
			`INSERT OR IGNORE INTO users 
			(email, name, password_hash, question, response_hash, picture)
			VALUES (?, ?, ?, ?, ?, ?)`,
			[email, name, hashPassword, question, hashResponse, '/uploads/default.jpg']
		);

		if (result.changes > 0) {
			// user created successfully
			return reply.code(201).send({ success: true });
		} else {
			// fallback if insert failed
			return reply.code(409).send({ success: false, message: 'User creation failed' });
		}
	});
}
