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

COPY . ./
# COPY package*.json ./
RUN npm install
RUN npm rebuild sqlite3

# --- Étape de développement ---
FROM base AS development

WORKDIR /app

COPY --from=base /app /app

RUN chmod +x ./entrypoint.sh
RUN npm install -g nodemon

CMD ["sh", "./entrypoint.sh"]

# --- Étape de production ---
FROM base AS production

WORKDIR /app

COPY --from=base /app /app

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]
