import secureSession from '@fastify/secure-session';

export default async function registerSession(fastify) {
const key = Buffer.from(process.env.SESSION_KEY_BASE64, 'base64');

fastify.register(secureSession, {
  key,
  cookie: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
});
}
