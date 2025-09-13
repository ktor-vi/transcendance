import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import registerCors from './plugins/cors.js';
//import websocketHandler from "./plugins/websocket.js";
import registerSession from './plugins/session.js';
import registerOAuth from './plugins/oauth.js';
import authRoutes from "./routes/auth.js";
import tournamentRoutes from "./routes/tournament.js";
import profileRoutes from './routes/profile.js';
import usersListRoutes from './routes/usersList.js';
import userProfileRoutes from './routes/usersProfile.js';
import pingRoutes from './routes/ping.js';
import registerRoutes from './routes/register.js';
import userRoutes from './routes/user.js';
import loginRoutes from './routes/login.js';
import forgotPwdRoutes from './routes/forgotPassword.js';
import friendshipRequestsRoutes from './routes/friendshipRequests.js';
import friendsRoutes from './routes/friends.js';
import fastifyMultipart from '@fastify/multipart';
import gameServer from "./plugins/gameServer.js";
import registerWebSockets from "./plugins/websocket.js";
import registerChat from "./plugins/chat_WS.js";

import fs from 'fs';

const fastify = Fastify({
	logger: true,
	https: {
	key: fs.readFileSync("/app/certs/localhost.key"),
	cert: fs.readFileSync("/app/certs/localhost.crt"),
	}
})

//await fastify.register(fastifyStatic, { root: path.join(process.cwd(), 'public'), prefix: '/' });

// ORDRE IMPORTANT : WebSocket AVANT les plugins qui l'utilisent
await fastify.register(fastifyStatic, {
	root: path.join(process.cwd(), "public"),
	prefix: "/",
});
await fastify.register(fastifyMultipart);
await registerCors(fastify);
await registerSession(fastify);
await registerOAuth(fastify);

// WebSocket DOIT être enregistré en premier
await registerWebSockets(fastify);

// Puis les plugins qui utilisent WebSocket
await registerChat(fastify);
//await fastify.register(websocketHandler);
await fastify.register(tournamentRoutes);
await fastify.register(gameServer);

fastify.register(userRoutes, { prefix: '/api'});
fastify.register(usersListRoutes, { prefix: '/api'});
fastify.register(userProfileRoutes, { prefix: '/api'});
fastify.register(friendshipRequestsRoutes, { prefix: '/api'});
fastify.register(friendsRoutes, { prefix: '/api'});
fastify.register(pingRoutes, { prefix: '/api'});

// Routes HTTP classiques
fastify.register(authRoutes);
fastify.register(profileRoutes, { prefix: "/api" });
fastify.register(registerRoutes, { prefix: "/api" });
fastify.register(loginRoutes, { prefix: "/api" });
fastify.register(forgotPwdRoutes, { prefix: "/api" });

// Gestion d'erreurs
fastify.setErrorHandler(function (error, request, reply) {
	if (error.code === "FST_REQ_FILE_TOO_LARGE") {
		reply.code(413).send({ error: "Fichier trop volumineux (> 1MB)" });
	} else {
		console.error(error);
		reply.code(error.statusCode || 500).send({
			error: error.message || "Erreur serveur",
		});
	}
});

fastify.setNotFoundHandler((req, reply) => {
	if (req.url.startsWith("/api/")) {
		// Cas API (backend) → renvoyer du JSON
		reply.status(404).send({ message: "Route API non trouvée" });
	} else {
		// Cas frontend → servir index.html (SPA)
		reply.sendFile("index.html");
	}
});

await fastify.ready();
fastify.printRoutes(); // Pour voir toutes les routes enregistrées

try {
	const address = await fastify.listen({ port: 3000, host: "0.0.0.0" });
	fastify.log.info(`Server listening at ${address}`);
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
