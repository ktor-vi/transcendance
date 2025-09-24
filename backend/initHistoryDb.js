import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();

// handle db open/creation result
function errorHandling(err) {
	if (err)
		console.error("Error opening history database");
}

// create db file if not exists
const db = new sqlite3.Database('./data/history.sqlite3', errorHandling);

// SQL schema for history table
const createSQTable = `
CREATE TABLE IF NOT EXISTS history (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	type TEXT,
	player_1 TEXT,
	player_2 TEXT,
	scores TEXT,
	winner TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

// create table if needed
db.run(createSQTable, (err) => {
	if (err)
		console.error("Error creating history table");
});

// close db to avoid corruption or resource leaks
db.close((err) => {
	if (err)
		console.error("Error closing history database");
});
