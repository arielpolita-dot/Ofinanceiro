# App Template

SaaS application template with NestJS backend and React frontend.

## Stack

- **Backend**: NestJS 11 + TypeScript, PostgreSQL via TypeORM, MongoDB via Mongoose
- **Frontend**: React 19 + Vite + TypeScript + react-i18next
- **Auth**: Authify (OAuth BFF pattern with httpOnly cookies)
- **Billing**: Billify (external billing service integration)
- **Deploy**: AWS Amplify (frontend) + Hetzner VPS via Coolify (backend)
- **Reverse Proxy**: Traefik v3 (managed by Coolify)
- **Observability**: Grafana + Prometheus + Loki + Uptime Kuma
- **CI/CD**: GitHub Actions (lint/test) + Coolify auto-deploy (GitHub App)

## Quick Start

1. Copy the template and create a new repository
2. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Start development:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
  src/
    modules/
      admin/        # Admin dashboard endpoints
      analytics/    # Event tracking (MongoDB)
      auth/         # Authentication (BFF pattern via Authify)
      billing/      # Payment/subscription (via Billify)
      company/      # Multi-tenant company management
    common/         # Guards, services, middleware
    database/
      entities/     # TypeORM entities (PostgreSQL)
      schemas/      # Mongoose schemas (MongoDB)

frontend/
  src/
    components/     # Layout, shared components
    design-system/  # UI component library
    hooks/          # useAuth, useAnalytics, usePolling
    pages/          # App pages
    services/       # API client, analytics (Firebase provider)
    styles/         # Global CSS

monitoring/               # Observability config (as code)
  grafana/provisioning/   # Datasources auto-provisioning
  prometheus/             # Scrape targets config
  loki/                   # Log aggregation config
  promtail/               # Docker log shipping config

.github/workflows/        # CI pipeline (lint, test, coverage)
```

## Databases

### PostgreSQL (TypeORM) — App Data

All tables use `app_` prefix:

| Table | Module |
|-------|--------|
| `app_admin_users` | admin |
| `app_admin_sessions` | admin |
| `app_companies` | company |
| `app_company_members` | company |
| `app_company_invites` | company |
| `app_activity_logs` | analytics |
| `app_secure_store` | common |

### MongoDB (Mongoose) — Logs & Analytics

Dedicated MongoDB instance in the same Coolify project. Collections:

| Collection | Module | Description |
|------------|--------|-------------|
| `analytics_events` | analytics | Frontend event tracking (funnels, conversions, UTM) |
| `audit_logs` | audit-logger | Backend request/method/error audit logging |

## Deploy

- **Frontend**: Push to `main` triggers Amplify auto-deploy
- **Backend**: Push to `main` → GitHub Actions (CI) + Coolify auto-deploy (build on Hetzner)
- **Observability**: `docker compose -f docker-compose.observability.yml up -d`

## Observability

The monitoring stack runs alongside the app on the same Hetzner VPS:

- **Grafana** — Dashboards, alerts (Telegram/Slack)
- **Prometheus** — Metrics collection (host, containers, NestJS /metrics)
- **Loki + Promtail** — Centralized logs (JSON structured, queryable via LogQL)
- **Uptime Kuma** — Status page + uptime monitoring
- **MongoDB** — Logs database (analytics_events + audit_logs)

Required env vars: `GRAFANA_ADMIN_PASSWORD`, `APP_METRICS_TARGET`, `MONGO_INITDB_ROOT_PASSWORD`

## Configuration

See `config.json` for project settings.
Environment variables are managed via Coolify dashboard (team / project / env / app hierarchy).
