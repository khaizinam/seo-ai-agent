.PHONY: setup dev build start pm2-start pm2-stop pm2-restart pm2-logs db-up db-down

setup: db-up
	npm install
	npx prisma generate
	npx prisma db push

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# Database commands
db-up:
	docker compose up -d

db-down:
	docker compose down

# PM2 commands
pm2-start: build
	npx pm2 start ecosystem.config.js

pm2-stop:
	npx pm2 stop seo-admin-panel || true

pm2-restart: build
	npx pm2 restart seo-admin-panel

pm2-logs:
	npx pm2 logs seo-admin-panel

pm2-delete:
	npx pm2 delete seo-admin-panel || true
