# ==============================================================================
# Dexta Africa Enterprise Portal - DevOps & Automation Makefile
# ==============================================================================

.PHONY: help dev build test lint typecheck docker-build up down restart logs clean db-push db-seed

# Default target
help:
	@echo "=========================================================================="
	@echo "  Dexta Africa Operations Portal - DevOps Automation Commands"
	@echo "=========================================================================="
	@echo "  make dev          - Start local Next.js development server"
	@echo "  make build        - Compile Next.js production standalone bundle"
	@echo "  make test         - Run TypeScript typecheck and ESLint validations"
	@echo "  make lint         - Run ESLint code analysis"
	@echo "  make typecheck    - Verify TypeScript types without emitting files"
	@echo ""
	@echo "  Docker Stack:"
	@echo "  make up           - Start local container stack (App + MinIO S3 + Mailpit)"
	@echo "  make down         - Stop and remove all local containers"
	@echo "  make restart      - Restart local container services"
	@echo "  make logs         - Stream live container logs"
	@echo "  make docker-build - Build production multi-stage Docker image"
	@echo "  make prod-up      - Run production Docker Compose configuration"
	@echo ""
	@echo "  Database:"
	@echo "  make db-push      - Push Prisma schema to database"
	@echo "  make db-seed      - Execute database seed script"
	@echo "  make clean        - Remove build artifacts, cache, and temp files"
	@echo "=========================================================================="

# ------------------------------------------------------------------------------
# Local Development
# ------------------------------------------------------------------------------
dev:
	npm run dev

build:
	npx prisma generate
	npm run build

typecheck:
	npm run typecheck

lint:
	npm run lint

test: typecheck lint
	@echo "✅ All code quality checks passed."

# ------------------------------------------------------------------------------
# Database Operations
# ------------------------------------------------------------------------------
db-push:
	npx prisma db push

db-seed:
	node prisma/seed.js

# ------------------------------------------------------------------------------
# Docker Operations
# ------------------------------------------------------------------------------
docker-build:
	docker build -t dexta-admin-portal:latest .

up:
	docker-compose up -d --build
	@echo ""
	@echo "🚀 Dexta Africa Local Stack Ready:"
	@echo "   - Portal Application: http://localhost:3000"
	@echo "   - Health Check:       http://localhost:3000/api/health"
	@echo "   - MinIO S3 Console:   http://localhost:9001 (User: dexta_minio_user)"
	@echo "   - Mailpit Email UI:   http://localhost:8025"
	@echo ""

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs -f app

prod-up:
	docker-compose -f docker-compose.prod.yml up -d --build

# ------------------------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------------------------
clean:
	rm -rf .next out coverage dist *.tsbuildinfo
	@echo "🧹 Cleaned build artifacts."

