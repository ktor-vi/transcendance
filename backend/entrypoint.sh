#!/bin/sh

echo "🛠 Initialisation de la base de donnees avec sqlite3..."
if ! node ./initDb.js; then
  echo "❌ Erreur lors de l'initialisation de la base"
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
