# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Personal website for Akshit Kumar with a newsletter (Thoughts in Knots), backend API, and admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **Auth**: express-session + connect-pg-simple (sessions in PostgreSQL)
- **Passwords**: bcryptjs (12 rounds)
- **Email**: Resend (graceful fallback: logs to console when key missing)
- **Payments**: Razorpay (graceful fallback: mock order when keys missing)

## Artifacts

| Artifact | Path | Port |
|---|---|---|
| Personal site (React + Vite) | `/` | 25158 |
| Thoughts in Knots newsletter (React + Vite) | `/thoughtsinknots/` | 22043 |
| Admin Panel (React + Vite) | `/admin/` | 20130 |
| API Server (Express 5) | `/api/...` | 8080 |

## Admin Panel (`artifacts/admin-panel`, `/admin/`)

Separate artifact at `artifacts/admin-panel/`. Admin user seeded in DB with email `admin@akshitkumar.com`.

Pages:
- `/admin/login` — login page (requires `role=admin` user)
- `/admin/dashboard` — overview with subscriber stats + article stats
- `/admin/articles` — article list with edit/delete
- `/admin/articles/new` — create article (title, slug, summary, body HTML, isFree, publishedAt)
- `/admin/articles/:id/edit` — edit existing article (fetches full body from `/api/admin/articles/:id`)
- `/admin/subscribers` — subscriber list with plan/status breakdown

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema (`lib/db/src/schema/index.ts`)

| Table | Purpose |
|---|---|
| `users` | Registered subscribers and admins |
| `articles` | Newsletter articles (free + paywalled) |
| `subscriptions` | Active/expired subscriber subscriptions |
| `pending_subscribers` | Pre-payment magic-link flow state |
| `user_sessions` | Session storage (auto-created by connect-pg-simple) |

## API Routes (`artifacts/api-server/src/`)

### Auth (`/api/auth/`)
- `GET /me` — current session user
- `POST /subscribe-initiate` — create Razorpay order + magic link
- `POST /verify-token` — validate magic link token
- `POST /create-account` — create user + activate subscription
- `POST /login` — session login
- `POST /logout` — destroy session
- `POST /forgot-password` — send reset email
- `POST /reset-password` — apply new password

### Articles (`/api/articles/`)
- `GET /` — paginated list (body locked for non-subscribers)
- `GET /most-loved` — sorted by likes
- `GET /:slug` — full article (body locked if non-subscriber and !is_free)
- `POST /:slug/like` — increment likes (auth required)

### Admin (`/api/admin/`) — admin session required
- `GET /subscribers` — list all users + subscriptions
- `GET /articles` — list all articles (summary, no body)
- `GET /articles/:id` — single article with full body (for editor)
- `POST /articles` — create article
- `PUT /articles/:id` — update article
- `DELETE /articles/:id` — delete article

### Webhook (`/api/webhook/`)
- `POST /razorpay` — Razorpay payment.captured event → activates subscription

## Required Secrets

These must be set by the user before the payment/email flows go live:

| Secret | Purpose |
|---|---|
| `SESSION_SECRET` | Already set — express-session signing |
| `RAZORPAY_KEY_ID` | Razorpay API key (public) |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature verification |
| `RESEND_API_KEY` | Resend transactional email |
| `SITE_URL` | Base URL for magic links (default: https://akshitkumar.com) |

## Pricing

| Region | Monthly | Yearly |
|---|---|---|
| India (IN) | ₹199 | ₹1,999 |
| International (INTL) | $3.99 | $39.99 |

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
