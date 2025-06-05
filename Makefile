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
RESET = \033[0m

# Commands for Development
dev:
	@echo "$(GREEN)Starting frontend and backend in development mode...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build frontend-dev backend-dev
	@echo "$(GREEN)Frontend is running on http://localhost:5173$(RESET)"
	@echo "$(GREEN)Backend is running on http://localhost:3000$(RESET)"

# Commands for Development with HTTPS
dev-https:
	@echo "$(GREEN)Starting frontend and backend in development mode with HTTPS...$(RESET)"
	@./toggle-https.sh enable
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build frontend-prod backend-prod
	@echo "$(GREEN)Frontend is running on https://localhost$(RESET)"
	@echo "$(GREEN)Backend is running on https://localhost/api$(RESET)"

# Commands for Production
prod:
	@echo "$(YELLOW)Building frontend and backend for production...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) up --build frontend-prod backend-prod --detach
	@echo "$(YELLOW)Production environment is up.$(RESET)"

# Enable HTTPS configuration
enable-https:
	@echo "$(YELLOW)Enabling HTTPS configuration...$(RESET)"
	@./toggle-https.sh enable
	@echo "$(GREEN)HTTPS enabled. Use 'make dev-https' or 'make prod' to run with HTTPS$(RESET)"

# Disable HTTPS configuration
disable-https:
	@echo "$(YELLOW)Disabling HTTPS configuration...$(RESET)"
	@./toggle-https.sh disable
	@echo "$(GREEN)HTTPS disabled. Use 'make dev' to run with HTTP$(RESET)"

# Generate SSL certificates
ssl-certs:
	@echo "$(YELLOW)Generating SSL certificates...$(RESET)"
	@./generate-ssl.sh
	@echo "$(GREEN)SSL certificates generated$(RESET)"

# Docker Build
build:
	@echo "$(YELLOW)Building Docker containers for all services...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) build
	@echo "$(GREEN)Build complete.$(RESET)"

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
	@echo "$(RED)Cleaning up unused Docker resources...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) down -v --rmi all --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)Clean up complete.$(RESET)"

# Show Docker Compose Logs
logs:
	@echo "$(YELLOW)Showing logs for frontend and backend...$(RESET)"
	@docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

.PHONY: dev dev-https prod build up down clean logs enable-https disable-https ssl-certs
