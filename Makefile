# Makefile for managing Docker workflows with colored output

# Define the service names and environment configurations
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend
DOCKER_COMPOSE_FILE = docker-compose.yml
DOCKER_NETWORK = your_network_name

# ANSI color codes
RED = \033[0;31m
YELLOW = \033[1;33m
GREEN = \033[0;32m
LILA = \033[38;5;183m
RESET = \033[0m

# Commands for Development
dev:
	@echo "$(LILA)✨🪄✨SSL certificates are currently being generated...✨🪄✨"
	@mkdir -p certs
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout certs/localhost.key \
		-out certs/localhost.crt \
		-subj "/CN=$$(hostname)"
	@echo "ദി(˵ •̀ ᴗ - ˵ ) SSL certificates are successfully generated for $$(hostname)( ദി ˙ᗜ˙ )$(RESET)"
	@echo "$(GREEN)Starting frontend and backend in development mode...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build frontend-dev backend-dev

# Commands for Production
prod:
	@echo "$(LILA)✨🪄✨SSL certificates are currently being generated...✨🪄✨"
	@mkdir -p certs
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout certs/localhost.key \
		-out certs/localhost.crt \
		-subj "/CN=$$(hostname)"
	@echo "ദി(˵ •̀ ᴗ - ˵ ) SSL certificates are successfully generated for $$(hostname)( ദി ˙ᗜ˙ )$(RESET)"
	@echo "$(YELLOW)Building frontend and backend for production...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build  frontend-prod backend-prod 

# Docker Build
build:
	@echo "$(YELLOW)Building Docker containers for all services...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) build

# Docker Compose Up (to start containers)
up:
	@echo "$(GREEN)Starting all services...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build -d
	@echo "$(GREEN)Services are running in detached mode.$(RESET)"

# Docker Compose Down (to stop containers)
down:
	@echo "$(RED)Stopping and removing all containers...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) down
	@echo "$(RED)Containers are stopped and removed.$(RESET)"

# Clean up Docker volumes, networks, and dangling images
clean:
	@echo "$(RED)Cleaning up unused Docker resources and SSL certificates...$(RESET)"
	@rm -rf certs
	@docker-compose -f $(DOCKER_COMPOSE_FILE) down -v --rmi all --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)Clean up complete.$(RESET)"

# Show Docker Compose Logs
logs:
	@echo "$(YELLOW)Showing logs for frontend and backend...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

.PHONY: dev prod build up down clean logs
