#!/bin/sh

echo "🛠 Initialisation des bases de donnees avec sqlite3..."
if ! node ./initUsersDb.js; then
  echo "❌ Erreur lors de l'initialisation de users DB"
  exit 1
fi

if ! node ./initHistoryDb.js; then
  echo "❌ Erreur lors de l'initialisation de History DB"
  exit 1
fi

if ! node ./initChatDB.js; then
  echo "❌ Erreur lors de l'initialisation du chat DB"
  exit 1
fi

echo "✅ Base de données initialisée"
echo "🚀 Lancement..."

# Choix de la commande selon l'environnement
if [ "$NODE_ENV" = "production" ]; then
  exec npm start
else
  exec npm run dev
fi
