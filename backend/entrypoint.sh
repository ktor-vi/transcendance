#!/bin/sh

echo "Initializing SQLite3 databases..."

if ! node ./initUsersDb.js; then
	echo "Error initializing Users DB"
	exit 1
fi

if ! node ./initHistoryDb.js; then
	echo "Error initializing History DB"
	exit 1
fi

echo "Databases initialized successfully"
echo "Starting server..."

if [ "$NODE_ENV" = "production" ]; then
	exec npm start
else
	exec npm run dev
fi

