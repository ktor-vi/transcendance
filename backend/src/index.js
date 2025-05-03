import Fastify from 'fastify';
import sqlite3 from 'sqlite3';

// console.log("Starting backend server...");
const fastify = Fastify({ logger: true });
const db = new sqlite3.Database(process.env.DATABASE_URL);
fastify.post('/api/create-message', async (request, reply) => {
  const content = 'Hello from backend!';
  const createdAt = new Date().toISOString();

  db.run(
    `CREATE TABLE IF NOT EXISTS testicules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`
  );

  db.run(`INSERT INTO messages (content, created_at) VALUES (?, ?)`, [content, createdAt], function (err) {
    if (err) {
      console.error(err);
      return reply.code(500).send({ error: 'Failed to insert message' });
    }

    return reply.send({ message: 'Message inserted', id: this.lastID });
  });
});
// Make sure the Fastify server listens on a port
fastify.listen(3000, '0.0.0.0', (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
