import { openDb } from '../utils/db.js';
import bcrypt from 'bcrypt';

export default async function loginRoutes(fastify) {
	// POST /login : authenticate user
	fastify.post('/login', async (req, reply) => {
		const { email, password } = req.body;

		// fetch user from DB
		const db = await openDb();
		const user = await db.get('SELECT * FROM users WHERE email = ?', email);

		if (!user) {
			return reply.code(401).send({ success: false, message: 'No account found with this email' });
		}

		// compare hashed password
		const isValid = await bcrypt.compare(password, user.password_hash);
		if (!isValid) {
			return reply.code(401).send({ success: false, message: 'Mot de passe incorrect' });
		}

		// store user in session
		req.session.set('user', user);

		// inform client of successful login
		return reply.code(201).send({ success: true });
	});
}
