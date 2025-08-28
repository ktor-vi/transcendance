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
const db = new sqlite3.Database('./data/users.sqlite3', errorHandling) //cree ma db dans un fichier que je place dans data

const createSQTable = // je cree une table que je nomme "users" avec son formatage choisi
`
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
`;

db.exec(createSQTable, (err) => //execute une commande sql
{
	if (err)
		console.error("error when creating users table");
	else
		console.log("users table created or already existing");
})

db.close((err) => // ferme la connexion a la db car elle a ete ouverte automatiquement en la creeant
{
	if (err)
		console.error("error when closing users database");
	else
		console.log("users database closed");
	
})
// la fermeture evite des potentielles corruptions de donnees, de la consommation inutiles de ressources etc.
console.log ("Closing users database...");

