# CLAUDE.md — {Nome do Projeto}

## Central Knowledge Base
Shared knowledge across all Claude instances: `~/Documents/claude-knowledge/`
- `memory.md` — Persistent memory. **Update after every significant task.**
- `skills.md` — Reusable procedures | `projects.md` — Project registry

## Stack
- **Backend**: NestJS 11 + TypeScript strict, PostgreSQL via TypeORM
- **Frontend**: React 18 + Vite + TypeScript strict
- **Deploy**: AWS Amplify (frontend) + AppRunner (backend), GitHub Actions CI/CD
- **Auth**: httpOnly cookie `app_access_token`, BFF pattern

## Conventions
- **ValidationPipe**: `forbidNonWhitelisted: true`
- **TypeORM columns**: Always `@Column({name: 'snake_case'})` mappings
- **Table prefix**: `app_` (e.g., `app_users`, `app_sessions`)
- **New entities**: Register in `database.module.ts` entities array
- **Route ordering**: Specific routes BEFORE parametrized
- **API versioning**: `/api/v1/`
- **Spacing**: Multiples of 4px only
- **Never hardcode data in frontend** — all from API
- **TDD obrigatorio**: Testes ANTES do codigo
