import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import registerCors from './plugins/cors.js';
import registerWebSockets from './plugins/websocket.js';
import registerSession from './plugins/session.js';
import registerOAuth from './plugins/oauth.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import usersListRoutes from './routes/usersList.js';
import userProfileRoutes from './routes/usersProfile.js';
import pingRoutes from './routes/ping.js';
import registerRoutes from './routes/register.js';
import userRoutes from './routes/user.js';
import loginRoutes from './routes/login.js';
import forgotPwdRoutes from './routes/forgotPassword.js';
import friendshipRequestsRoutes from './routes/friendshipRequests.js';
import fastifyMultipart from '@fastify/multipart';

import fs from 'fs';

const fastify = Fastify({
	logger: true,
	https: {
	key: fs.readFileSync("/app/certs/localhost.key"),
	cert: fs.readFileSync("/app/certs/localhost.crt"),
	}
})

await fastify.register(fastifyStatic, { root: path.join(process.cwd(), 'public'), prefix: '/' });

await fastify.register(fastifyMultipart);


await registerCors(fastify);
await registerSession(fastify);
await registerOAuth(fastify);
await registerWebSockets(fastify);

fastify.register(authRoutes);
fastify.register(userRoutes, { prefix: '/api'});
fastify.register(profileRoutes, { prefix: '/api'});
fastify.register(usersListRoutes, { prefix: '/api'});
fastify.register(userProfileRoutes, { prefix: '/api'});
fastify.register(friendshipRequestsRoutes, { prefix: '/api'});
fastify.register(registerRoutes, { prefix: '/api'});
fastify.register(loginRoutes, { prefix: '/api'});
fastify.register(forgotPwdRoutes, { prefix: '/api'});
fastify.register(pingRoutes, { prefix: '/api'});

// gestion manuelle de certains messages d'erreurs
fastify.setErrorHandler(function (error, request, reply) {
	if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
		reply.code(413).send({ error: 'Fichier trop volumineux (> 1MB)' });
	} else {
		// log interne (console ou logger)
		console.error(error);
		// réponse générique
		reply.code(error.statusCode || 500).send({
			error: error.message || 'Erreur serveur'
		});
	}
});

await fastify.ready();
fastify.printRoutes();


fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`Server listening at ${address}`);
});

