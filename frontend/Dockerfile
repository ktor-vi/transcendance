FROM node:18-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl

ARG HOSTNAME

COPY package*.json ./
RUN npm install
RUN npm install -g vite  # Install vite globally

COPY . ./

RUN mkdir -p /app/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /app/certs/localhost.key \
      -out /app/certs/localhost.crt \
      -subj "/CN=${HOSTNAME}"

RUN npm run build

FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY ./nginx-template.conf /etc/nginx/templates/nginx-template.conf

COPY ./entrypoint.sh /docker-entrypoint.d/10-generate-nginx.sh

RUN chmod +x /docker-entrypoint.d/10-generate-nginx.sh

EXPOSE 80