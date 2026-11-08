# DermaCare Luxe clinic website and CRM

The public clinic website is a React/Vite application. Its Express API uses PostgreSQL for patients, appointments, sessions, audit history, and an automation outbox.

## Local setup

1. Create a PostgreSQL database and configure `DATABASE_URL` (the development fallback is `postgres://postgres:postgres@localhost:5432/dermacare`).
2. Configure a random `SESSION_SECRET` of at least 32 characters and, in production, `NODE_ENV=production` and `PG_SSL=true` when required by the database host.
3. Run `npm install`, then `npm run db:migrate`.
4. Provision the single doctor account with `DOCTOR_EMAIL`, `DOCTOR_PASSWORD` (at least 12 characters), and optionally `DOCTOR_NAME`, then run `npm run db:seed`.
5. Start the API with `npm run server` and the UI with `npm run dev`. Vite proxies `/api` to the API on port 5000.

Receptionist accounts must be provisioned by an operator directly in PostgreSQL with role `receptionist` and a bcrypt password hash; there is intentionally no public staff registration. Staff sign in at `/staff-access`.

Configure `N8N_BOOKING_WEBHOOK`, `N8N_CANCEL_WEBHOOK`, and optionally `N8N_WEBHOOK_SECRET` on the backend. For password reset email delivery, configure `PASSWORD_RESET_WEBHOOK`; it receives the account email and one-time token. Configure `N8N_BACKEND_TOKEN` for the Calendar event ID callback. Never place these variables in frontend configuration.

Bookings are saved as Pending and only the doctor can approve or reject them. The outbox records events after the transaction commits, and the dispatcher retries failures. The n8n workflow should deduplicate using the `Idempotency-Key` header and support `appointment.pending`, `appointment.approved`, `appointment.rejected`, and `appointment.cancelled`.

Existing JSON data in `server/data` is preserved and is not automatically imported or deleted. Review and deduplicate it before any controlled migration/import. The app needs a PostgreSQL service and configured credentials to run migrations and exercise authenticated workflows.
