# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g vite  # Install vite globally

# Copy all files and build the frontend
COPY . ./
RUN npm run build

# Production stage (Nginx)
FROM nginx:stable-alpine AS production

# Copy the built files into Nginx's directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (if needed)
COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for Nginx
EXPOSE 80
