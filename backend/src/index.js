// ───────────────────────────────────────────────
// External dependencies
// ───────────────────────────────────────────────
import fs from "fs";
import path from "path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";

// ───────────────────────────────────────────────
// Internal plugins
// ───────────────────────────────────────────────
import registerCors from "./plugins/cors.js";
import registerSession from "./plugins/session.js";
import registerOAuth from "./plugins/oauth.js";
import registerWebSockets from "./plugins/websocket.js";
import registerChat from "./plugins/chat_WS.js";
import gameServer from "./plugins/gameServer.js";

// ───────────────────────────────────────────────
// Routes
// ───────────────────────────────────────────────
import authRoutes from "./routes/auth.js";
import loginRoutes from "./routes/login.js";
import registerRoutes from "./routes/register.js";
import forgotPwdRoutes from "./routes/forgotPassword.js";
import profileRoutes from "./routes/profile.js";
import userRoutes from "./routes/user.js";
import usersListRoutes from "./routes/usersList.js";
import userProfileRoutes from "./routes/usersProfile.js";
import friendshipRequestsRoutes from "./routes/friendshipRequests.js";
import friendsRoutes from "./routes/friends.js";
import tournamentRoutes from "./routes/tournament.js";
import pingRoutes from "./routes/ping.js";

// ───────────────────────────────────────────────
// Server initialization
// ───────────────────────────────────────────────
const fastify = Fastify({
	logger: true,
	https: {
		key: fs.readFileSync("/app/certs/localhost.key"),
		cert: fs.readFileSync("/app/certs/localhost.crt"),
	},
});

// ───────────────────────────────────────────────
// Plugin registration
// ───────────────────────────────────────────────
await fastify.register(fastifyStatic, {
	root: path.join(process.cwd(), "public"),
	prefix: "/",
});
await fastify.register(fastifyMultipart);
await registerCors(fastify);
await registerSession(fastify);
await registerOAuth(fastify);

// WebSockets (order matters)
await registerWebSockets(fastify);
await registerChat(fastify);
await fastify.register(gameServer);
await fastify.register(tournamentRoutes);

// ───────────────────────────────────────────────
// API routes
// ───────────────────────────────────────────────
const apiPrefix = { prefix: "/api" };

fastify.register(userRoutes, apiPrefix);
fastify.register(usersListRoutes, apiPrefix);
fastify.register(userProfileRoutes, apiPrefix);
fastify.register(friendshipRequestsRoutes, apiPrefix);
fastify.register(friendsRoutes, apiPrefix);
fastify.register(pingRoutes, apiPrefix);
fastify.register(profileRoutes, apiPrefix);
fastify.register(registerRoutes, apiPrefix);
fastify.register(loginRoutes, apiPrefix);
fastify.register(forgotPwdRoutes, apiPrefix);

// Public routes (no /api prefix)
fastify.register(authRoutes);

// ───────────────────────────────────────────────
// Error handling
// ───────────────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
	if (error.code === "FST_REQ_FILE_TOO_LARGE") {
		reply.code(413).send({ error: "File too large (> 1MB)" });
	} else {
		fastify.log.error(error);
		reply.code(error.statusCode || 500).send({
			error: error.message || "Internal server error",
		});
	}
});

fastify.setNotFoundHandler((req, reply) => {
	if (req.url.startsWith("/api/")) {
		// API route → return JSON
		reply.status(404).send({ message: "API route not found" });
	} else {
		// Frontend route → fallback to index.html (SPA)
		reply.sendFile("index.html");
	}
});

// ───────────────────────────────────────────────
// Server startup
// ───────────────────────────────────────────────
await fastify.ready();
fastify.printRoutes();

try {
	const address = await fastify.listen({ port: 3000, host: "0.0.0.0" });
	fastify.log.info(`🚀 Server listening at ${address}`);
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
