import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();

console.log("Opening or creating history database...");

// handle db open/creation result
function errorHandling(err) {
	if (err)
		console.error("Error opening history database");
	else
		console.log("History database opened");
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
	else
		console.log("History table ready");
});

// close db to avoid corruption or resource leaks
db.close((err) => {
	if (err)
		console.error("Error closing history database");
	else
		console.log("History database closed");
});

console.log("Closing history database...");
