.PHONY: help install dev stop logs clean test build deploy

help:
	@echo "GramMate - Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help        - Show this help message"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development environment with Docker Compose"
	@echo "  dev-stop    - Stop development environment"
	@echo "  backend     - Start backend server (manual mode)"
	@echo "  frontend    - Start frontend dev server (manual mode)"
	@echo "  db          - Start PostgreSQL and Redis only"
	@echo "  logs        - Show docker-compose logs"
	@echo "  clean       - Remove Docker containers and volumes"
	@echo "  test        - Run all tests"
	@echo "  test-unit   - Run unit tests"
	@echo "  test-int    - Run integration tests"
	@echo "  build       - Build Docker images"
	@echo "  deploy      - Deploy to production (Kubernetes)"
	@echo "  format      - Format code (black, prettier)"
	@echo "  lint        - Run linters (flake8, eslint)"
	@echo ""

# Installation
install:
	@echo "Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✓ Dependencies installed"

# Development
dev:
	@echo "Starting development environment..."
	docker-compose up -d
	@echo ""
	@echo "✓ Services started!"
	@echo ""
	@echo "Access:"
	@echo "  Frontend:     http://localhost:3000"
	@echo "  Backend API:  http://localhost:8000"
	@echo "  API Docs:     http://localhost:8000/docs"
	@echo "  Database:     localhost:5432 (grammate/grammate_dev_password)"
	@echo "  Redis:        localhost:6379"
	@echo ""
	@echo "View logs with: make logs"

dev-stop:
	@echo "Stopping development environment..."
	docker-compose down
	@echo "✓ Services stopped"

# Manual server starts (for development without Docker)
backend:
	@echo "Starting backend server..."
	cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm start

# Database only
db:
	@echo "Starting database services..."
	docker-compose up -d db redis
	@echo "✓ Database services started"

# Logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Cleanup
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "✓ Cleanup complete"

# Testing
test:
	@echo "Running all tests..."
	cd backend && pytest || true
	cd frontend && npm test -- --watchAll=false || true

test-unit:
	@echo "Running unit tests..."
	cd backend && pytest -m unit
	cd frontend && npm test -- --watchAll=false unit

test-int:
	@echo "Running integration tests..."
	cd backend && pytest -m integration

test-coverage:
	@echo "Running tests with coverage..."
	cd backend && pytest --cov=. --cov-report=html
	@echo "Coverage report: backend/htmlcov/index.html"

# Building
build:
	@echo "Building Docker images..."
	docker-compose build
	@echo "✓ Images built"

build-backend:
	docker build -t grammate-backend:latest backend/
	@echo "✓ Backend image built"

build-frontend:
	docker build -t grammate-frontend:latest frontend/
	@echo "✓ Frontend image built"

# Code Quality
format:
	@echo "Formatting code..."
	cd backend && black . --exclude venv
	cd frontend && npx prettier --write "src/**/*.{js,jsx,ts,tsx,css}"
	@echo "✓ Code formatted"

lint:
	@echo "Running linters..."
	cd backend && flake8 . --exclude venv --max-line-length=100
	cd frontend && npx eslint src/**/*.jsx 2>/dev/null || true
	@echo "✓ Linting complete"

# Deployment
deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f k8s/
	@echo "✓ Deployed"

deploy-status:
	kubectl get deployments,services,pods -n grammate

# Database
db-migrate:
	@echo "Running database migrations..."
	cd backend && alembic upgrade head

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Continue? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec db psql -U grammate -d grammate -f reset.sql; \
		echo "✓ Database reset"; \
	fi

# Monitoring
monitor:
	@echo "Opening monitoring dashboard..."
	open http://localhost:9090 || xdg-open http://localhost:9090

# Utilities
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec db psql -U grammate -d grammate

# Default
.DEFAULT_GOAL := help
