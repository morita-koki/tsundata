.PHONY: help build up down restart logs shell-backend shell-frontend clean install dev prod test lint

# Default target
help:
	@echo "Available commands:"
	@echo "  build       - Build all Docker images"
	@echo "  up          - Start all services in development mode"
	@echo "  down        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  logs        - Show logs for all services"
	@echo "  shell-backend  - Open shell in backend container"
	@echo "  shell-frontend - Open shell in frontend container"
	@echo "  clean       - Clean Docker images and volumes"
	@echo "  install     - Install dependencies locally"
	@echo "  dev         - Start development servers locally"
	@echo "  prod        - Start production build"
	@echo "  test        - Run tests"
	@echo "  lint        - Run linting"
	@echo "  https-setup - Complete HTTPS setup with certificates"
	@echo "  https       - Start HTTPS environment (quick setup)"
	@echo "  ssl-generate - Generate SSL certificates only"
	@echo "  url         - Show access URLs"

# Docker commands
build:
	docker-compose build

up:
	docker-compose up -d
	@echo ""
	@echo "🚀 Services started!"
	@echo "🌐 Access URLs:"
	@echo "  HTTPS: https://localhost"
	@echo "  HTTP:  http://localhost (redirects to HTTPS)"
	@echo ""
	@echo "💡 Click here to access: https://localhost"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

clean:
	docker-compose down -v --rmi all
	docker system prune -f

# Local development commands
install:
	cd backend && npm install
	cd frontend && npm install

dev:
	@echo "Starting backend..."
	cd backend && npm run dev &
	@echo "Starting frontend..."
	cd frontend && npm run dev &
	@echo "Development servers started. Backend: http://localhost:3001, Frontend: http://localhost:3000"

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

# Production commands
prod-build:
	cd frontend && npm run build

prod:
	cd backend && npm start &
	cd frontend && npm start &

# Database commands
db-generate:
	cd backend && npm run db:generate

db-migrate:
	cd backend && npm run db:migrate

# Testing and linting
test:
	@echo "No tests configured yet"

lint:
	cd frontend && npm run lint

# HTTPS commands
https-setup:
	./setup-https.sh

ssl-generate:
	./generate-ssl.sh

https:
	@echo "Setting up HTTPS environment..."
	@if [ ! -f nginx/ssl/localhost.crt ]; then \
		echo "Generating SSL certificates..."; \
		./generate-ssl.sh; \
	fi
	docker-compose up -d
	@echo ""
	@echo "✅ HTTPS environment ready!"
	@echo "🌐 Access URLs:"
	@echo "  HTTPS: https://localhost"
	@echo "  HTTP:  http://localhost (redirects to HTTPS)"
	@echo ""
	@echo "💡 Click here to access: https://localhost"

# Utility commands
status:
	docker-compose ps

health:
	@echo "Checking service health..."
	@curl -s -k https://localhost/api/health || curl -s http://localhost:3001/api/health || echo "Backend not responding"
	@curl -s -k https://localhost || curl -s http://localhost:3000 || echo "Frontend not responding"

url:
	@echo "🌐 Access URLs:"
	@echo "  HTTPS: https://localhost"
	@echo "  HTTP:  http://localhost (redirects to HTTPS)"
	@echo ""
	@echo "💡 For HTTPS access, click here: https://localhost"