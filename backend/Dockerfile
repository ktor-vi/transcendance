# --- Base image ---
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
RUN npm install
RUN npm rebuild sqlite3

# --- Development stage ---
FROM base AS development

WORKDIR /app
COPY --from=base /app /app

RUN chmod +x ./entrypoint.sh
RUN npm install -g nodemon

CMD ["sh", "./entrypoint.sh"]

# --- Production stage ---
FROM base AS production

WORKDIR /app
COPY --from=base /app /app

RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["sh", "./entrypoint.sh"]
