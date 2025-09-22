import { openDb, openDbHistory } from '../utils/db.js';
import { validateString } from '../utils/fetchUserInfo.js';
import path from 'path';
import fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

export default async function profileRoutes(fastify) {
	// GET /profile : return user info
	fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession) return reply.code(401).send({ error: 'Not logged in' });

		const db = await openDb();
		const user = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);

		if (!user.picture) {
			user.picture = '/uploads/default.jpg';
		} else if (user.picture !== '/uploads/default.jpg') {
			// check if picture exists
			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);
			const fileName = path.basename(user.picture);
			const imgPath = path.join(__dirname, '../../public/uploads', fileName);

			try {
				await fs.access(imgPath);
			} catch {
				user.picture = '/uploads/default.jpg';
			}
		}
		return reply.send(user);
	});

	// POST /profile : update name and/or profile picture
	fastify.post('/profile', async (req, reply) => {
		const userSession = req.session.get('user');
		if (!userSession)
			return reply.code(401).send({ error: 'Not logged in' });

		const data = await req.parts();
		let name = '';
		let picture = null;
		let type = '';

		// parse multipart data
		for await (const part of data) {
			if (part.type === 'file' && part.fieldname === 'changePicture') {
				const chunks = [];
				let totalSize = 0;
				for await (const chunk of part.file) {
					totalSize += chunk.length;
					if (totalSize > 2 * 1024 * 1024)
						return reply.code(400).send({ error: 'Fichier trop volumineux (>2MB)' });
					chunks.push(chunk);
				}
				picture = Buffer.concat(chunks);
				
				// validate file type
				type = await fileTypeFromBuffer(picture);
				if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime))
					return reply.code(400).send({ error: 'Invalid file type' });
			} else if (part.fieldname === 'name') {
				name = part.value;
			}
		}
		if (validateString(name) === false)
			return reply.code(403).send({ success: false, message: 'Caractères invalides' });
		const db = await openDb();
		// check if name already exists
		const existingName = await db.get('SELECT * FROM users WHERE name = ? AND email != ?', name, userSession.email);
		if (existingName)
			return reply.code(409).send({ success: false, message: 'Name already taken' });

		const oldName = userSession.name;
		userSession.name = name;
		req.session.set('user', userSession); // update session

		// update database
		await db.run('UPDATE users SET name = ? WHERE email = ?', name, userSession.email);

		const dbHistory = await openDbHistory();
		await dbHistory.run('UPDATE history SET player_1 = ? WHERE player_1 = ?', name, oldName);
		await dbHistory.run('UPDATE history SET player_2 = ? WHERE player_2 = ?', name, oldName);
		await dbHistory.run('UPDATE history SET winner = ? WHERE winner = ?', name, oldName);

		// handle profile picture
		if (picture) {
			const uploadDir = path.resolve('public/uploads');
			const oldPictureRow = await db.get('SELECT picture FROM users WHERE email = ?', userSession.email);
			const oldPicture = oldPictureRow.picture;

			// delete old picture if not default
			if (oldPicture !== '/uploads/default.jpg' && oldPicture?.startsWith('/uploads/')) {
				const fileName = oldPicture.replace('/uploads/', '');
				const filePath = path.join(uploadDir, fileName);
				try { await fs.unlink(filePath); } catch {}
			}

			const safeName = `${uuidv4()}.${type.ext}`;
			await fs.mkdir(uploadDir, { recursive: true });
			const filePath = path.join(uploadDir, safeName);
			await fs.writeFile(filePath, picture);

			await db.run('UPDATE users SET picture = ? WHERE email = ?', `/uploads/${safeName}`, userSession.email);
		}

		const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);
		reply.send(updatedUser);
	});
}
