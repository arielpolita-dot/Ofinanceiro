# App Template

SaaS application template with NestJS backend and React frontend.

## Stack

- **Backend**: NestJS 11 + TypeScript, PostgreSQL via TypeORM
- **Frontend**: React 18 + Vite + TypeScript
- **Auth**: Authify (OAuth BFF pattern with httpOnly cookies)
- **Billing**: External billing service integration
- **Deploy**: AWS Amplify (frontend) + AppRunner via ECR (backend)
- **IaC**: Terraform (ECR, AppRunner, IAM, CloudWatch)
- **CI/CD**: GitHub Actions

## Quick Start

1. Copy the template and create a new repository
2. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Fill in the `{Preencher aqui}` placeholders
4. Install dependencies:
   ```bash
   npm run install:all
   ```
5. Start development:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
  src/
    admin/          # Admin dashboard endpoints
    analytics/      # Event tracking
    auth-bff/       # Authentication (BFF pattern)
    billing/        # Payment/subscription
    common/         # Guards, services, middleware
    database/       # TypeORM entities, migrations
    health/         # Health check endpoint

frontend/
  src/
    components/     # Layout, shared components
    design-system/  # UI component library
    hooks/          # useAuth, useAnalytics, usePolling
    pages/          # App pages
    services/       # API client, service modules
    styles/         # Global CSS

infra/              # Terraform IaC
.github/workflows/  # CI/CD pipelines
```

## Database Tables

All tables use `app_` prefix:

| Table | Description |
|-------|-------------|
| `app_users` | User accounts |
| `app_sessions` | Auth sessions (refresh tokens) |
| `app_activity_logs` | User activity tracking |
| `app_analytics_events` | Frontend analytics (audit DB) |
| `app_audit_logs` | Backend request logs (audit DB) |

## Deploy

- **Frontend**: Push to `main` triggers Amplify auto-deploy
- **Backend**: Push to `main` with `backend/` changes triggers GitHub Actions

## Configuration

See `config.json` for project settings.
See `infra/variables.tf` for Terraform variables.
