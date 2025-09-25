# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/712b96df-d2df-4cc2-becf-88a4553d0041

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/712b96df-d2df-4cc2-becf-88a4553d0041) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/712b96df-d2df-4cc2-becf-88a4553d0041) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Quick deploy checklist (Vercel / Supabase / Stripe)

Follow these minimal steps to deploy the web app and wire serverless functions.

- Vercel (web app)
	- Root directory: ./ (this is a Vite app)
	- Framework preset: Vite
	- Install: pnpm i --frozen-lockfile
	- Build command: pnpm build
	- Output dir: dist
	- Required public envs (set in Vercel Environment Variables):
		- VITE_SUPABASE_URL
		- VITE_SUPABASE_ANON_KEY
		- VITE_STRIPE_PUBLISHABLE_KEY
		- VITE_GA4_ID (optional)
		- VITE_SENTRY_DSN (optional)
	- Do NOT store secret/service keys in the Vercel web env (e.g. SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, webhook secrets).

- Supabase (Edge Functions & secrets)
	- Deploy functions under `supabase/functions/*` (e.g. `stripe_webhook`, `booking_accept`, `validate_quote`, `health`).
	- Set secrets with `supabase secrets set --env-file ./supabase/.env` and include:
		- STRIPE_WEBHOOK_SECRET
		- STRIPE_SECRET_KEY
		- SUPABASE_URL
		- SUPABASE_SERVICE_ROLE_KEY

- Stripe
	- Put publishable key in Vercel as `VITE_STRIPE_PUBLISHABLE_KEY`.
	- Put secret key and webhook secret into Supabase function secrets (not public envs).
	- Webhook URL: https://<project-ref>.functions.supabase.co/stripe_webhook

Quick local commands:

```bash
pnpm i
pnpm typecheck
pnpm test
pnpm build
```

Quick health checks

We included a couple of helpers to quickly validate your deployed Supabase Edge Functions:

- `public/status.html` — a tiny static page you can deploy with the app. Enter your Supabase project ref (the short id) and click Check to call `/health` and `/validate_quote` on your functions endpoint.
- `scripts/smoke-runner.js` — a Node 20+ script that calls the same endpoints from the CLI. Example:

```bash
# from project root
node ./scripts/smoke-runner.js --ref=your-supabase-ref
```

These tools are optional but useful after deploying functions or rotating secrets.

### Admin / Observability Additions

- Dead-letter table: `stripe_failed_events` captures Stripe webhook events that exhausted retries (see `supabase/migrations/*stripe_failed_events*`).
- Persistent Admin layout (sidebar) with routes: Dashboard, Settings, Stripe Failed Events.
- Admin route `#/stripe-failed-events` renders recent failed events.
- Backend endpoint: `GET /api/admin/stripe-failed-events` now uses **role-based bearer token auth** (Supabase access token) instead of a static header secret.
	- Client sends: `Authorization: Bearer <access_token>` (taken from `supabase.auth.getSession()`).
	- Server validates token via service client and loads roles from `user_roles`.
	- Allowed roles: `company_admin` or `super_admin` (adjust list in `src/server/auth.ts`).

Removed:
	(Legacy) The previous `X-Admin-Secret` / `VITE_ADMIN_API_SECRET` mechanism has been removed.

Security notes:
- Keep service key only on server (never expose to client).
- Consider adding rate limiting / audit logging for admin endpoints.
- Rotate Stripe and Supabase secrets regularly; leverage environment-specific values.

## Demo Mode (In-Memory Preview)

This repository includes a zero-external dependency Demo Mode to showcase multi‑role flows (client / company / guard) without real Supabase or Stripe.

### Running Demo Mode
```bash
pnpm i               # install deps (first time)
pnpm dev -- --mode demo   # uses .env.demo (VITE_DEMO_MODE=true)
```
Or copy the sample:
```bash
cp .env.demo .env.local
pnpm dev -- --mode demo
```

### Capabilities
- Seeded users, bookings, messages, vehicles.
- Simulated payments: Stripe fee (3.5% + 300¢) → 25% company cut → remainder guard payout.
- In‑memory DB persisted to `localStorage` (`demo_state_v1`).
- Lightweight realtime bus for new messages & ledger updates.
- URL role override: `?as=client|company|guard` (persists to `localStorage.demo_role`).
- Always-visible Role Switcher (demo only).
- Company dashboard: Payment Simulator & ledger.
- Guard home / bookings: Payout ledger slice.

### Simulate a Payment
1. Open company tab: `http://localhost:5173/?as=company`.
2. Click "Simulate Payment" on a booking.
3. Ledger row appears (fees, company share, guard payout); guard tab reflects new payout line.

### End-to-End Smoke Script
Open three tabs:
- Client  `http://localhost:5173/?as=client`
- Company `http://localhost:5173/?as=company`
- Guard   `http://localhost:5173/?as=guard`

Flow:
1. Client creates or views booking.
2. Company simulates payment.
3. Guard sees payout entry.
4. Send a message from one role; others receive (realtime shim).
5. Refresh all tabs → state persists (localStorage snapshot).
6. Switch roles via Role Switcher and confirm view changes.
7. Repeat payment simulation to validate cumulative totals.

### Reset Demo State
Use DevTools console:
```js
localStorage.removeItem('demo_state_v1');
localStorage.removeItem('demo_role');
```
Reload with a fresh seed.

### Production vs Demo
| Concern | Demo | Production |
|---------|------|------------|
| Flag | VITE_DEMO_MODE=true | (unset / false) |
| Data | In-memory + localStorage | Supabase Postgres |
| Auth | Seeded identities | Supabase Auth JWT |
| Payments | Simulated splitter | Stripe (webhooks) |
| Realtime | Local pub/sub | Supabase Realtime |

Never enable Demo Mode in a real deployment environment.

Stabilization branch: `release/preview-1` (bugfix-only; non-critical lint warnings intentionally deferred unless masking runtime issues).


