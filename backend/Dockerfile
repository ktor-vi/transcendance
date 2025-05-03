# Base image
FROM node:18-alpine AS base

RUN apk add sqlite
WORKDIR /app

COPY package*.json ./
RUN npm install

FROM base AS development

COPY . ./
RUN npm install

RUN npm install -g nodemon

FROM base AS production

COPY . ./

EXPOSE 3000
CMD ["npm", "start"]
