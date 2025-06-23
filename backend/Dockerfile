# --- Étape de base ---
FROM node:20-alpine AS base

RUN apk add --no-cache \
    sqlite \
    python3 \
    py3-pip \
    make \
    g++ \
    libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

# --- Étape de développement ---
FROM base AS development

COPY . ./
RUN chmod +x ./entrypoint.sh
RUN npm rebuild sqlite3
RUN npm install -g nodemon

CMD ["sh", "./entrypoint.sh"]

# --- Étape de production ---
FROM base AS production

COPY . ./
RUN chmod +x ./entrypoint.sh
RUN npm rebuild sqlite3

EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]
