# AltDap Backend API

This service implements the AltDap backend described in `backend-architecture.md` using NestJS + Prisma + PostgreSQL.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env` and update the values.
3. **Run Prisma migrations (optional for dev)**
   ```bash
   npx prisma migrate dev --name init
   ```
4. **Start the API**
   ```bash
   npm run start:dev
   ```

The server listens on `http://localhost:3000/api` by default.

## Project Structure

```
src/
  main.ts                 # Nest bootstrap w/ global pipes + middleware
  app.module.ts           # Aggregates domain modules
  core/                   # Prisma service, config, health endpoint
  modules/
    auth/                 # Signup/login/guardian consent
    users/                # Profiles, settings, avatar handshake
    assessments/          # Question bank & recommendation APIs
    courses/              # Catalog, modules, completion and progress
    engagement/           # Streaks, challenges, badges
    mentors/              # Mentor catalog, bookings, organizations
    community/            # Posts, reactions, comments, moderation
    support/              # Emergency resources & counselor tickets
    notifications/        # Notification center & push subscriptions
    analytics/            # Admin analytics + user status management
shared/
  dto/, interfaces/, utils/ (e.g., pagination)
prisma/
  schema.prisma           # Full relational data model
```

Each module exposes DTO-validated controllers and stub services; replace the placeholder logic with Prisma queries as you connect the database.

## Scripts

- `npm run start:dev` – run the Nest app with live reload.
- `npm run build` – compile TypeScript to `dist/`.
- `npm run prisma:generate` – regenerate Prisma client from the schema.
- `npm run prisma:migrate` – run development migrations.

## Next Steps

- Implement JWT strategies/guards and wire controllers to Prisma.
- Add integration tests for critical user journeys (auth, courses, community posts).
- Configure CI/CD plus Observability hooks (OpenTelemetry exporters, logging sinks).