import Fastify from 'fastify';
import registerCors from './plugins/cors.js';
import registerWebSockets from './plugins/websocket.js';
import registerSession from './plugins/session.js';
import registerOAuth from './plugins/oauth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

import fs from 'fs';

const fastify = Fastify({
  logger: true,
  https: {
  key: fs.readFileSync("/app/certs/localhost.key"),
  cert: fs.readFileSync("/app/certs/localhost.crt"),
  }
})

await registerCors(fastify);
await registerSession(fastify);
await registerOAuth(fastify);
await registerWebSockets(fastify);

fastify.register(authRoutes);
fastify.register(userRoutes);

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
