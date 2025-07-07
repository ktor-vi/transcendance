import Fastify from 'fastify';
import registerCors from './plugins/cors.js';
import registerWebSockets from './plugins/websocket.js';
import registerSession from './plugins/session.js';
import registerOAuth from './plugins/oauth.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import registerRoutes from './routes/register.js';
import loginRoutes from './routes/login.js';

const fastify = Fastify({ logger: true });

await registerSession(fastify);
await registerCors(fastify);
await registerOAuth(fastify);
await registerWebSockets(fastify);

fastify.register(authRoutes);
fastify.register(profileRoutes, { prefix: '/api'});
fastify.register(registerRoutes, { prefix: '/api'});
fastify.register(loginRoutes, { prefix: '/api'});

await fastify.ready();
fastify.printRoutes();

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
