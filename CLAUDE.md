# CLAUDE.md — App Template (Boilerplate SaaS)

## Central Knowledge Base
Shared knowledge across all Claude instances lives in `~/Documents/00-claude-knowledge/`:
- `CLAUDE.md` — Global directives
- `memory.md` — Persistent memory. **Update after every significant task.**
- `projects.md` — Project registry with stacks and conventions

## Project Stack
- **App name**: App Template (NestJS + React full-stack boilerplate)
- **Backend**: NestJS 11 + TypeScript 5.7 strict
- **Frontend**: React 19 + Vite 6 + TypeScript strict
- **Databases**: PostgreSQL (TypeORM 0.3) + MongoDB (Mongoose) + Redis (ioredis via CachePort abstraction)
- **Auth**: Authify (external OAuth 2.0) + BFF pattern, httpOnly cookie `app_access_token`
- **i18n**: i18next (multi-language ready)
- **Charts**: Recharts 3.6
- **Analytics**: Firebase (frontend)
- **Testing**: Jest 30 (backend) + Vitest 4.1 (frontend)

## Deploy
- **Frontend**: AWS Amplify (auto-deploy on git push to main)
- **Backend**: Coolify + Hetzner VPS (Docker, GitHub Actions)
- **Container**: Docker Node 22 Alpine (multi-stage, non-root user nestjs:1001, tini init)
- **Health**: GET `/health` endpoint

## Monitoring Stack (docker-compose.observability.yml)
- **Prometheus** 2.53 — Metrics collection (15s scrape)
- **Loki** 3.4 — Log aggregation (30-day retention)
- **Promtail** 3.4 — Docker container log shipping
- **Grafana** 11.5 — Dashboards & alerting
- **Uptime Kuma** 1.23 — Status page & uptime monitoring
- **MongoDB** 7.0 — Analytics/logs DB

## Backend Architecture
- **Modules**: AuthBff, Admin, Company, Billing, Analytics, Health, Cache, Database, Logger, AuditLogger, ActivityLog
- **Rate Limiting**: Throttler (3 tiers: short 3/s, medium 20/10s, long 100/min)
- **Security**: Helmet.js (CSP, HSTS, X-Frame-Options)
- **Audit**: Request/response logging via AuditLoggerInterceptor
- **Swagger**: Available at `/api/docs`

## Entities
- AdminUser, AdminSession, ActivityLog, SecureStore
- Company, CompanyMember, CompanyInvite
- ProjectAuditLog (audit DB), AnalyticsEvent (audit DB)

## Conventions
- **ValidationPipe**: `forbidNonWhitelisted: true`
- **TypeORM columns**: Always `@Column({name: 'snake_case'})` mappings
- **New entities**: Register in `database.module.ts` entities array
- **Route ordering**: Specific routes BEFORE parametrized
- **Frontend**: Feature-based `features/{name}/hooks|components|services`
- **Design System**: Custom in-house
- **Spacing**: Multiples of 4px only
- **Never hardcode data** — all from API
- **TDD obrigatorio**: Testes antes do codigo

## Coverage Thresholds
- Statements: 80%, Branches: 70%, Functions: 80%, Lines: 80%

## Development
- `npm start` — Backend (port 8000) + Frontend (port 8001) concurrently
- Database: Docker Compose PostgreSQL on port 5555

## External Services
- **Authify**: `auth.ohanax.com` (OAuth 2.0)
- **Billing**: `billing.ohanax.com`
