.PHONY: api-smoke api-up api-down fe-dev be-dev

api-smoke:
	@BASE?=http://localhost:3000
	@echo "Running API smoke against $$BASE"; \
	BASE=$$BASE bash tools/api-smoke.sh

api-up:
	docker compose -f docker-compose.dev.yml up -d

api-down:
	docker compose -f docker-compose.dev.yml down -v

fe-dev:
	cd frontend && npm run dev

be-dev:
	cd backend && npm run dev

