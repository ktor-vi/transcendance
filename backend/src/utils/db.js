import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open users database
export async function openDb() {
	return open({
		filename: './data/users.sqlite3',
		driver: sqlite3.Database
	});
}

// Open history database
export async function openDbHistory() {
	return open({
		filename: './data/history.sqlite3',
		driver: sqlite3.Database
	});
}
