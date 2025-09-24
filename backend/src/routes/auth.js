import { fetchUserInfo } from '../utils/fetchUserInfo.js';
import { openDb } from '../utils/db.js';

export default async function authRoutes(fastify) {	
	// GET callback for Google OAuth2 authentication
	fastify.get('/api/login/google/callback', async function (request, reply) {
		// exchange authorization code for access token
		const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

		// fetch user info from Google
		const userInfo = await fetchUserInfo(token.access_token);

		// store user info in session
		request.session.set('user', userInfo);

		// open database
		const db = await openDb();

		// insert user in database if not exists
		const result = await db.run(
			`INSERT OR IGNORE INTO users (email, name, picture) VALUES (?, ?, ?)`,
			userInfo.email,
			userInfo.name,
			userInfo.picture
		);

		// redirect to frontend dashboard
		reply.redirect(`https://${process.env.HOSTNAME}:5173/dashboard?logged=1`);
	});

	// POST endpoint to logout user
	fastify.post('/api/logout', async (req, reply) => {
		req.session.delete();
		reply.send({ success: true });
	});

	// GET endpoint to retrieve current session user
	fastify.get("/api/session", async (req, reply) => {
		const user = req.session.get("user");
		return user;
	});

	// simple root endpoint for testing backend certificate
	fastify.get("/", async (req, reply) => {
		return reply
			.code(200)
			.send({ success: true, message: "Successfully accepted back-end certificate" });
	});
}

