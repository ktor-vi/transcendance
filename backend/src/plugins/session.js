import secureSession from '@fastify/secure-session';

export default async function registerSession(fastify) {
	// require secret key from .env
	if (!process.env.SESSION_KEY_BASE64) {
		throw new Error("SESSION_KEY_BASE64 must be defined in .env");
	}
	const key = Buffer.from(process.env.SESSION_KEY_BASE64, 'base64');

	// register plugin
	fastify.register(secureSession, {
		key,
		cookieName: 'sessionid',
		cookie: {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true,     // set false in dev if no HTTPS
			maxAge: 24 * 60 * 60, // 24h
		},
	});

	// helpers
	fastify.decorateRequest('getUser', function() {
		return this.session.get('user');
	});
	fastify.decorateRequest('setUser', function(user) {
		this.session.set('user', user);
	});
	fastify.decorateRequest('deleteUser', function() {
		this.session.delete('user');
	});
}

/*
Usage:

request.session.set('user', { id: 123 });
const user = request.session.get('user');
request.session.delete('user');
*/

