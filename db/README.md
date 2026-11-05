# Database

The canonical schema and seed data live in the backend Flyway migrations:

- `backend/src/main/resources/db/migration/V1__create_schema.sql`
- `backend/src/main/resources/db/migration/V2__seed_demo_data.sql`

The Java backend runs Flyway on startup for both MySQL (Docker Compose/default)
and H2 (zero-install `local`/`test` profiles). There is intentionally no second
copy of the SQL so the database cannot drift from the application.
