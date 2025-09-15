import { openDb } from '../utils/db.js';
import bcrypt from "bcrypt";

export default async function forgotPwdRoutes(fastify) {
	// POST endpoint to verify security question and response
	fastify.post('/forgotPassword', async (req, reply) => {
		const { email, question, response } = req.body;

		if (!req.body) {
			return reply
				.code(400)
				.send({ success: false, message: "Request body missing" });
		}

		const db = await openDb();
		const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);

		if (!user) {
			return reply
				.code(401)
				.send({ success: false, message: "No account found for this email" });
		}

		// Check if provided question and hashed response match DB
		const isValid = await bcrypt.compare(response, user.response_hash);

		if (!isValid || question !== user.question) {
			return reply
				.code(401)
				.send({ success: false, message: "Question and response do not match" });
		}

		return reply.code(200).send({ success: true });
	});

	// POST endpoint to reset password
	fastify.post('/resetPassword', async (req, reply) => {
		const { email, newPwd } = req.body;

		const db = await openDb();
		const user = await db.get(`SELECT * FROM users WHERE email = ?`, email);

		if (!user) {
			return reply
				.code(401)
				.send({ success: false, message: "No account found for this email" });
		}

		// Hash new password and update DB
		const newHashPwd = await bcrypt.hash(newPwd, 10);
		await db.run('UPDATE users SET password_hash = ? WHERE email = ?', newHashPwd, email);

		return reply.code(201).send({ success: true });
	});
}
