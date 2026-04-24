# Mané

A warm place to plan what you'll buy for home, room by room — together with the people you live with.

Mané lets you:
- create up to **3 spaces** (homes, flats, or a single room),
- organise each home into **rooms** (up to 8),
- paste a product link and have Mané auto-fetch the title, photo, and price,
- watch the **subtotal** for each room — and the total for the whole home — fill in as you go,
- share a friendly code so housemates can request to join (you approve).

Built with Next.js 15 (App Router), Auth.js, Prisma, Postgres, and Tailwind. Light-grey/off-white by default, with a dark mode toggle. Lora for headings, Inter for body.

---

## 1. Local setup

You need Node 18.17+ (20 recommended), a free Postgres database (Neon / Supabase / Vercel Postgres), and a Google OAuth client.

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
npx prisma db push
npm run dev
```

Open http://localhost:3000.

### Generating `AUTH_SECRET`
```bash
openssl rand -base64 32
# or: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Creating a free Postgres database (Neon)
1. Sign up at https://neon.tech (free tier).
2. Create a project. Copy the **pooled connection string** (it includes `-pooler`).
3. Paste it into `DATABASE_URL` in `.env` — make sure it ends with `?sslmode=require`.

### Setting up Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials.
2. Create an **OAuth 2.0 Client ID** (type: Web application).
3. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://YOUR-DEPLOYED-DOMAIN`
4. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DEPLOYED-DOMAIN/api/auth/callback/google`
5. Copy the Client ID → `AUTH_GOOGLE_ID`, Client secret → `AUTH_GOOGLE_SECRET`.

---

## 2. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on https://vercel.com/new.
3. Set environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   (Vercel injects `AUTH_URL` automatically — no need to set it.)
4. The build command `npm run build` runs `prisma generate && next build`.
5. **First deploy:** after the first deploy succeeds, run
   ```bash
   npx prisma db push
   ```
   locally with your **production** `DATABASE_URL` temporarily in `.env` to create the tables. (Or, commit a migration with `prisma migrate dev` and switch to `prisma migrate deploy` in the build step.)

6. Back in Google Cloud, add your Vercel URL to the OAuth client's allowed origins + redirect URIs.

Done — visit the deployed URL and create your first space.

---

## 3. Mané's shape

```
src/
  app/
    page.tsx                  — landing
    login/                    — email/password + Google
    register/                 — also picks currency
    onboarding/               — Google users pick currency on first login
    dashboard/                — home tiles, empty state, add/join flows
    home/[id]/                — rooms grid, members & requests panels
    room/[id]/                — items, subtotal, add-item dialog
    join/[code]/              — direct join links
    api/
      auth/[...nextauth]/     — Auth.js
      register/               — email/password sign-up
      profile/                — name + currency
      onboarding/complete/    — marks a user as onboarded
      homes/, homes/[id]/     — CRUD + rooms + requests
      rooms/[id]/, items/[id] — CRUD
      join/                   — request to join a home by code
      fetch-metadata/         — OpenGraph + JSON-LD scraper
  components/                 — UI (theme toggle, modal, profile menu, …)
  lib/
    auth.ts                   — NextAuth config (Google + credentials)
    prisma.ts                 — Prisma client singleton
    currency.ts               — currency list + Intl formatter
    metadata.ts               — product URL scraper
    utils.ts                  — cn(), join-code generator, initials
    constants.ts              — caps (3 homes / 8 rooms / 100 words)
prisma/schema.prisma          — User, Home, Room, Item, JoinRequest, …
```

## 4. Caps & rules

| Rule | Limit |
|---|---|
| Spaces per user | 3 (owned + joined combined) |
| Rooms per home | 8 |
| Rooms in a Single-Room space | 1 (fixed, auto-created) |
| Item description | 100 words |

Invite flow: a join code → requester submits → owner approves or rejects. A badge appears on the home tile and inside the home for the owner when requests are pending.

## 5. Updates model

Mané is **refresh-based on purpose**. Adding an item updates the list inside the page (no full reload). If a housemate adds something at the same time, click **Refresh** in the room page to see theirs appear.

## 6. Product metadata

When you paste a product URL, Mané reads the page server-side (10s timeout), extracts title/image/price/currency from (in order):
1. JSON-LD `Product` / `Offer` blocks,
2. Open Graph tags,
3. Twitter card tags,
4. `itemprop="price"` / `priceCurrency`.

Some sites block scrapers (notably Amazon). When that happens, Mané shows a friendly hint and lets you fill the fields in by hand.

## 7. Making it yours

- Colours live in `tailwind.config.ts` (`brand`, `surface`, `night`).
- Fonts in `src/app/layout.tsx` (Lora + Inter).
- Ambient warmth in `src/app/globals.css` (`body::before`).
