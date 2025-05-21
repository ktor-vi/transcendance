
# Étape de base
FROM node:20-alpine AS base

# Installation des dépendances nécessaires pour SQLite3 et autres outils
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install


# Étape de développement
FROM base AS development

# Copie du reste des fichiers de l'application
COPY . ./

# Reconstruction de SQLite3 pour l'environnement Alpine
RUN npm rebuild sqlite3

# Installation de nodemon pour le développement
RUN npm install -g nodemon

# Commande de démarrage pour le développement
CMD ["npm", "run", "dev"]

# Étape de production
FROM base AS production

# Copie du reste des fichiers de l'application
COPY . ./

# Reconstruction de SQLite3 pour l'environnement Alpine
RUN npm rebuild sqlite3

# Exposition du port de l'application
EXPOSE 3000

# Commande de démarrage pour la production
CMD ["npm", "start"]
