import sqlite3pkg from 'sqlite3'
const sqlite3 = sqlite3pkg.verbose(); //sqlite3 est un nom choisi, on "importe" ensuite sqlite3 avec require, verbose sert a avoir plus d'infos en cas d'erreurs

console.log ("Opening or creating users database...");

function errorHandling(err) // ma variable err va "stocker" l'eventuel erreur qu'il y aura dans la fonction Database (sinon elle sera null)
{
	if (err)
		console.error("error when creating database");
	else
		console.log("database opened");
}

// new sqlite3.Database(path, callback
const db = new sqlite3.Database('./data/users.sqlite3', (err) => { //cree ma db dans un fichier que je place dans data
	if (err) {
		console.error("Error opening DB");
		return;
	}
	
	console.log("Databases open !!!!");
	

	db.run("PRAGMA foreign_keys = ON"); // active le foreign key

	// je cree une table que je nomme "users" avec son formatage choisi
	const createSQTable = `

CREATE TABLE IF NOT EXISTS
	users
	(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		name TEXT UNIQUE NOT NULL,
		password_hash TEXT,
		question TEXT,
		response_hash TEXT,
		picture TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

CREATE TABLE IF NOT EXISTS
	friends (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
		user2_id INTEGER NOT NULL,
		friends_since DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user1_id, user2_id)
	);

CREATE TABLE IF NOT EXISTS
	requests (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id INTEGER NOT NULL,
		receiver_id INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'waiting',
		request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
	);
CREATE TABLE IF NOT EXISTS
	conversations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
		user2_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user1_id, user2_id)
  );

CREATE TABLE IF NOT EXISTS
	messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		conversation_id INTEGER NOT NULL,
		sender_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

	db.exec(createSQTable, (err) => { // execute une cmd sql
		if (err)
			console.error("SQL error when DB creation :", err.message);
		else
			console.log("Tables created or already existing");

	db.close((err) => { // ferme la connexion a la db car elle a ete ouverte automatiquement en la creeant
		if (err)
			console.error("error when closing databases");
		else
			console.log("Databases closed");
	
		});
	});
});

// la fermeture evite des potentielles corruptions de donnees, de la consommation inutiles de ressources etc.

