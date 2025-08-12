import sqlite3pkg from 'sqlite3'
const sqlite3 = sqlite3pkg.verbose();

console.log ("Opening or creating history database...");

function errorHandling(err)
{
	if (err)
		console.error("error when creating histiry database");
	else
		console.log("histiry database opened");
}

const db = new sqlite3.Database('./data/history.sqlite3', errorHandling) //cree ma db dans un fichier que je place dans data

const createSQTable =
`
CREATE TABLE IF NOT EXISTS
	history
	(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT,
		player_1 TEXT,
		player_2 TEXT,
		scores TEXT,
		winner TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
`;

db.run(createSQTable, (err) => //execute une commande sql
{
	if (err)
		console.error("error when creating history table");
	else
		console.log("history table created or already existing");
})

db.close((err) => // ferme la connexion a la db car elle a ete ouverte automatiquement en la creeant
{
	if (err)
		console.error("error when closing history database");
	else
		console.log("history database closed");
	
})
// la fermeture evite des potentielles corruptions de donnees, de la consommation inutiles de ressources etc.
console.log ("Closing history database...");

