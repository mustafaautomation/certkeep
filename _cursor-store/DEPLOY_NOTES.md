# Certkeep

## Build

```bash
npm ci
npm run build
```

## Start

```bash
npm run start
```

Dev server: `npm run dev` (this workspace: port 43117).

## Test

```bash
npm run typecheck   # next typegen && tsc --noEmit
npm run lint
npm run test:e2e    # next build, then Playwright on http://127.0.0.1:41731
```

CI workflow: `.github/workflows/ci.yml` on `ubuntu-latest`. Zero secrets. Playwright `@playwright/test` >= 1.65.1 (`npx playwright install --with-deps chromium`). The E2E server sets `E2E=1` so `POST /api/test/reset` is available. That route stays closed on Vercel.

## Live URL target

https://certkeep.quvantic.com

Vercel project name: `certkeep` (owner Mustafa, GitHub `mustafaautomation`).

## Environment variables

All optional. With none set, the app runs in mock mode (auth, vault, reminders, Stripe checkout, and PDF extraction).

| Name | Required | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | no | Session cookie HMAC. Demo key used when unset. |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Supabase project URL. Schema: `supabase/migrations/0001_certkeep.sql`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Publishable Supabase key. |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only. Do not expose to the browser. |
| `STRIPE_SECRET_KEY` | no | Stripe test secret. Enables Checkout when a price id is also set. |
| `STRIPE_WEBHOOK_SECRET` | no | Verifies `checkout.session.completed`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | no | Reserved for client Stripe.js. |
| `STRIPE_PRICE_STARTER` | no | Starter price id. |
| `STRIPE_PRICE_PRO` | no | Pro price id. |
| `GROQ_API_KEY` | no | Live extraction. Falls back to the local PDF reader. |
| `GROQ_MODEL` | no | Default `llama-3.3-70b-versatile`. |
| `GEMINI_API_KEY` | no | Live extraction when Groq is unset. |
| `GEMINI_MODEL` | no | Default `gemini-2.0-flash`. |

Runtime data stays in the in-memory vault so a missing database still serves the Harbor demo. Mock writes do not survive a serverless cold start.
