# AmpWeb

Rails 8 + Hotwire + Bootstrap app, fully runnable via Docker Compose.

## Stack

- Rails 8.1 (Hotwire / Stimulus / Turbo)
- Bootstrap (cssbundling)
- Postgres 16
- Redis 7
- Sidekiq
- OpenSearch + Searchkick
- MailCatcher (dev email)
- Devise
- RSpec

## Prerequisites

- Docker Desktop (or another Docker Engine) with Compose v2+

No local Ruby, Node, Postgres, or Redis install required.

## Start

```bash
docker compose up --build
```

App: http://localhost:3000  
Sidekiq Web: http://localhost:3000/sidekiq  
OpenSearch: http://localhost:9200  
MailCatcher: http://localhost:1080

## Common commands

```bash
# Logs
docker compose logs -f web

# Rails console
docker compose exec web bin/rails console

# Run specs
docker compose exec web bundle exec rspec

# Stop
docker compose down

# Stop and wipe volumes (fresh DB / OpenSearch)
docker compose down -v
```

## Environment

Defaults live in `.env` (see `.env.example`). Compose wires:

- `DATABASE_URL` → Postgres service `db`
- `REDIS_URL` → Redis service `redis`
- `OPENSEARCH_URL` → OpenSearch service `opensearch`
- `MAILCATCHER_HOST` → MailCatcher service `mailcatcher` (SMTP :1025, UI :1080)
