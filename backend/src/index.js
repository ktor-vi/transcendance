import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import registerCors from "./plugins/cors.js";
import registerWebSockets from "./plugins/websocket.js";
import registerChat from "./plugins/chat_WS.js";
import registerSession from "./plugins/session.js";
import registerOAuth from "./plugins/oauth.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import registerRoutes from "./routes/register.js";
import loginRoutes from "./routes/login.js";
import forgotPwdRoutes from "./routes/forgotPassword.js";
import fastifyMultipart from "@fastify/multipart";
import fs from "fs";

const fastify = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync("/app/certs/localhost.key"),
    cert: fs.readFileSync("/app/certs/localhost.crt"),
  },
});

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

await fastify.ready();
fastify.printRoutes(); // Pour voir toutes les routes enregistrées

try {
  const address = await fastify.listen({ port: 3000, host: "0.0.0.0" });
  fastify.log.info(`Server listening at ${address}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
