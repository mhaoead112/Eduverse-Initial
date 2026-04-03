# Eduverse

Eduverse is a modular LMS with:
- `client/`: React + Vite + Tailwind frontend
- `server/`: Express + TypeScript + Drizzle backend
- `shared/`: shared types/schemas used by client and server

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (local or managed)

### Environment
Create `.env` in repo root:

```env
DATABASE_URL=postgres://<user>:<password>@localhost:5432/eduverse
JWT_SECRET=replace_me
SESSION_SECRET=replace_me
OPENAI_API_KEY=replace_me
GOOGLE_API_KEY=replace_me
SEARCH_ENGINE_ID=replace_me
```

### Install and Run

```bash
npm install
npm run dev
```

- Frontend default: `http://localhost:5173`
- Backend default: `http://localhost:3001`

## Scripts

### Root scripts

```bash
npm run dev
npm run build
npm run check
npm run db:push
npm run db:migrate-join-code
```

### Client scripts (`client/`)

```bash
npm run dev
npm run build
npm run preview
npm run perf:ci
npm run i18n:ci
```

## Team Workflow

Detailed workflow: [docs/DEVELOPER_WORKFLOW.md](./docs/DEVELOPER_WORKFLOW.md)

Recommended day-to-day loop:
1. Sync branch from latest `main`.
2. Implement in small vertical slices.
3. Run local guards for touched area:
   - `npm run build` (root or client as needed)
   - `cd client && npm run i18n:ci` for portal/localization work
   - `cd client && npm run perf:ci` for performance-sensitive changes
4. Open PR with before/after notes and screenshots for UI changes.

## Add New Page and Translation

Step-by-step guide: [docs/ADD_PAGE_TRANSLATION_GUIDE.md](./docs/ADD_PAGE_TRANSLATION_GUIDE.md)

## Release Checklist

Use this before every production release:
- [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)

## Additional Docs

- API docs: [docs/README.md](./docs/README.md)
- Performance CI: [`.github/workflows/frontend-performance-budget.yml`](./.github/workflows/frontend-performance-budget.yml)

## Notes

- Do not commit real secrets (`.env` is gitignored).
- Backend contracts should not be changed unless explicitly requested.
- Portal routes are role-based under `/student`, `/teacher`, `/admin`, `/parent`.
