# Giftora — STL Custom Keychain Ecommerce Platform

Monorepo with three independently deployable apps sharing one backend API and database.

```
apps/
  customer-frontend/   Vite + React customer storefront
  admin-frontend/      Vite + React admin dashboard
  backend/             Express API (shared by both frontends)
  worker/              STL generation worker
packages/
  shared/               Shared types, constants, validators
```

## Getting started

Install dependencies once from the repo root (npm workspaces):

```
npm install
```

Run an app:

```
npm run dev:customer   # http://localhost:5173
npm run dev:admin      # http://localhost:5174
npm run dev:backend    # http://localhost:4000
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and fill in real values before running the backend.
