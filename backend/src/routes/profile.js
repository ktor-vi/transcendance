import { openDb, openDbHistory } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from "url";

export default async function profileRoutes(fastify)
{
	fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const db = await openDb();
		const user = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);

		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const fileName = path.basename(user.picture); // "36f6a779-30a5-446f-86e2-25681b40f890.jpg"
		const imgPath = path.join(__dirname, "../../public/uploads", fileName);

		try {
			await fs.access(imgPath);
		} catch {
			user.picture = "/uploads/default.jpg";
}
		console.log("USER PIC = ");
		console.log(user.picture);
		return reply.send(user);
	});
	
	fastify.post('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend

		// parts vient de fastify/multipart et sert à "parser" la requête contenant texte/ fichier (image)
		const data = await req.parts();
		// ces variables vont récupérer les infos de la requête
		let name = "";
		let picture = null;
		let extension = "";
		let type = "";

		//ensuite nous devons lire la requête (data) qui est "découpée" en une variable
		// ici nommée part. La loop "for... of..." permet d'itérer au sein d'une variable
		for await (const part of data) { // await car data est asynchrone (cf. await req.parts())
			// si le part qu'on est en train de parser est bien un fichier
			// et son attribut name est bien = changePicture
			if (part.type === 'file' && part.fieldname === 'changePicture') {
				// on créé une variable vide chunks qui va stocker les chunk de la boucle
				const chunks = [];
				// on push tout dans nos chunks en vérifiant la taille
				let totalSize = 0;
				for await (const chunk of part.file) {
					totalSize += chunk.length;
					if (totalSize > (2 * 1024 * 1024)) {// 2MB max
						return reply.code(400).send({ error: 'Fichier trop volumineux (> 2MB)' });
					}
					chunks.push(chunk)
				}
				// fusionner les chunk du tableau
				picture = Buffer.concat(chunks);

				// vérification du type de fichier
				type = await fileTypeFromBuffer(picture);
				if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
					return reply.code(400).send({ error: 'Type de fichier non accepté' });
				}
				} else {
					if (part.fieldname === 'name')
						name = part.value;
				}
		}
		const db = await openDb();
		// mise à jour de la DB avec les infos text
		const existingName = await db.get("SELECT * FROM users WHERE name = ? AND email != ?", name, userSession.email);

		if (existingName)
			return reply.code(409).send({ success: false, message: "Name déjà pris" });
		else
		{
			const userSession = req.session.get('user');
			const oldName = userSession.name;
			console.log("OLD = ");
			console.log(userSession);
			userSession.name = name;
			req.session.set('user', userSession); // ✅ remplace l’ancien

			await db.run('UPDATE users SET name = ? WHERE email = ?', name, userSession.email);
			const dbHistory = await openDbHistory();
			await dbHistory.run('UPDATE history SET player_1 = ? WHERE player_1 = ?', name, oldName);
			await dbHistory.run('UPDATE history SET player_2 = ? WHERE player_2 = ?', name, oldName);
			await dbHistory.run('UPDATE history SET winner = ? WHERE winner = ?', name, oldName);

		}
		if (picture) {
			//suppression de l'ancien fichier pour ne pas surcharger le serveur inutilement
			let uploadDir = path.resolve('public/uploads');
			const oldPictureRow = await db.get('SELECT picture FROM users WHERE email = ?', userSession.email);
			const oldPicture = oldPictureRow.picture;

			if (oldPicture != "/uploads/default.jpg" && oldPicture && oldPicture.startsWith('/uploads/')) {
				const fileName = oldPicture.replace('/uploads/', '');
				const filePath = path.join(uploadDir, fileName);

				try {
					await fs.unlink(filePath);
					} catch {
				}
			}

			extension = type.ext;
			uploadDir = path.resolve('public/uploads');
			// création d'un nom généré aléatoirement
			const safeName = `${uuidv4()}.${extension}`;
			// on expose uniquement le dossier uploads
				await mkdir(uploadDir, { recursive: true });
				const filePath = path.join(uploadDir, safeName);
				await fs.writeFile(filePath, picture);
				// mise à jour dans la db
				await db.run('UPDATE users SET picture = ? WHERE email = ?', `/uploads/${safeName}`, userSession.email);
			}
			const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);
			reply.send(updatedUser);

		});
		
}
