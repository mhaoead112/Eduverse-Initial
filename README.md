# Eduverse

Eduverse is a modular learning platform scaffolded as a multi-part repository with a server (Express + Drizzle ORM), a client (React + Vite + Tailwind), and shared TypeScript types/schemas.

This README documents how to get the project running locally, required environment variables, common issues, and recommended next steps.

## Repository layout

- `client/` – React frontend (Vite + Tailwind)
- `server/` – Express backend (TypeScript, Drizzle ORM)
- `shared/` – Shared TypeScript schema and types used by client and server
- `migrations/` – SQL / drizzle-kit migration files
- `package.json` – repo-level scripts (development helper)

> Note: This repo contains both a root `package.json` and a `server/package.json`. See "Which package.json to use" below.

## Prerequisites

- Node.js (v18+ recommended; repository has been tested with Node 20+)
- npm (or yarn/pnpm) to install packages
- PostgreSQL for local development (or a cloud/postgres-compatible provider)

Optional (recommended): Docker for running Postgres locally.

## Required environment variables

Create a `.env` file in the project root (or copy from `.env.example`) with the following variables set:

```properties
DATABASE_URL=postgres://<user>:<password>@localhost:5432/eduverse
OPENAI_API_KEY=sk-REPLACE_ME
GOOGLE_API_KEY=REPLACE_ME
SEARCH_ENGINE_ID=REPLACE_ME
JWT_SECRET=REPLACE_ME
SESSION_SECRET=REPLACE_ME
```

Important security note: Do NOT commit `.env` or real secrets to git. Use `.env.example` (placeholders only) and add `.env` to `.gitignore`.

## Which package.json to use

- To run the server from the repository root, use the root scripts (recommended for dev convenience).
- Alternatively you can `cd server` and run `npm install` / `npm run dev` there if you prefer an isolated install.

Examples (PowerShell):

```powershell
# install deps at repo root
npm install

# run the backend (root dev script)
npm run dev

# OR run server package directly
cd server
npm install
npm run dev
```

## Database / migrations

- This project uses Drizzle ORM. Migrations (if present) are in `migrations/` and can be applied with `drizzle-kit`.
- If you use Postgres locally, ensure any required extensions are enabled (for example `pgcrypto` for `gen_random_uuid()`):

```sql
-- Run in psql or via migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

If you need to push migrations with drizzle-kit:

```powershell
npm run db:push
```

## Common setup steps

1. Copy or create `.env` from `.env.example` and fill placeholders.
2. Install dependencies: `npm install` (at root or in `server/` as your chosen workflow).
3. Start the dev server: `npm run dev`.

## Troubleshooting

- Error: `FATAL ERROR: DATABASE_URL is not set` — ensure your `.env` is present and the `DATABASE_URL` key is set. We load `.env` early in the server; if you still see the error check which script you used to start the server and that `dotenv` is available.
- Error: `Cannot find package '@paralleldrive/cuid2'` — run `npm install` at the package level that runs the server (root or `server/`). Ensure the dependency is present in that `package.json`.
- Path alias issues (`@shared/*`) — TypeScript `paths` are compile-time only. Dev runners like `tsx` or Vite may need additional config to resolve path aliases at runtime. If you run into module resolution errors, either use relative imports or add a runtime path resolver (e.g. `tsconfig-paths`).

## Developer workflow suggestions

- Standardize where you run commands from (root vs `server/`) and document it in this README.
- Consider setting up a proper monorepo workspace (npm/pnpm workspaces) if you want shared dependency management.
- Replace console.log debugging with a configurable logger (winston, pino) for production.

## Contributing

1. Fork the repo and create a feature branch.
2. Add tests or verify the app starts locally.
3. Open a pull request describing changes and motivations.

## License

MIT

---


