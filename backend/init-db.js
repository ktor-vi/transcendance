import sqlite3pkg from 'sqlite3'
const sqlite3 = sqlite3pkg.verbose(); //sqlite3 est un nom choisi, on "importe" ensuite sqlite3 avec require, verbose sert a avoir plus d'infos en cas d'erreurs

console.log ("Opening or creating OAusers database...");

function errorHandling(err) // ma variable err va "stocker" l'eventuel erreur qu'il y aura dans la fonction Database (sinon elle sera null)
{
	if (err)
	{
		console.error("error when creating database");
	}
	else
	{
		console.log("database opened");
	}

}

// new sqlite3.Database(path, callback
const db = new sqlite3.Database('./data/OAusers.sqlite3', errorHandling) //cree ma db dans un fichier que je place dans data

const createSQTable = // je cree une table que je nomme "OAusers" avec son formatage choisi
`
CREATE TABLE IF NOT EXISTS
	OAusers
	(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		given_name TEXT,
		family_name TEXT,
		password_hash TEXT,
		picture TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
`;

db.run(createSQTable, (err) => //execute une commande sql
{
	if (err)
	{
		console.error("error when creating table");
	}
	else
	{
		console.log("OAusers table created or already existing");
	}
})

db.close((err) => // ferme la connexion a la db car elle a ete ouverte automatiquement en la creeant
{
	if (err)
	{
		console.error("error when closing database");
	}
	else
	{
		console.log("database closed");
	}
	
})
// la fermeture evite des potentielles corruptions de donnees, de la consommation inutiles de ressources etc.
console.log ("Closing OAusers database...");

