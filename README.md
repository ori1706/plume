# Plume — calm microblogs for curious minds

A production-style **Twitter / X‑inspired microblog** built for iframe embedding on a portfolio: home timeline, Explore, Notifications, profiles, replies, quotes, reposts, search, hashtags, @mentions, and rich seed data. Auth is **JWT in `localStorage`** (`plume_token`) so the demo works cleanly inside cross-origin iframes (no brittle third-party cookies).

> **Screenshot:** add `docs/screenshot-home.png` after capture for the résumé page; the UI is dark-first with optional light theme.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Next.js 15 │────▶│  API Routes +    │────▶│  PostgreSQL     │
│  App Router │     │  Prisma Client   │     │  (Supabase/local)│
│  React 19   │◀────│  Server actions  │◀────│                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

| Layer | Tech |
|-------|------|
| UI | Next.js 15 App Router, React 19, Tailwind CSS 4, Framer Motion |
| Data | Prisma ORM 6.x, PostgreSQL |
| Auth | `jose` JWT, Bearer + `Authorization` / stored token |
| Dev DB | Docker Compose (`postgres:16-alpine`, port **33321**) |

## Local setup

1. **Clone & install**

   ```bash
   cd Showcase-Feed
   npm install
   cp .env.example .env
   ```

2. **Start Postgres**

   ```bash
   docker compose up -d postgres
   ```

3. **Migrate & seed**

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

4. **Run the app** (default port **3140**)

   ```bash
   npm run dev
   ```

   Open [http://localhost:3140](http://localhost:3140). The client calls **`POST /api/auth/bootstrap`** on load to sign in as the demo user (no password prompt).

## Docker (app + database)

Build and run the full stack (runs migrations on start):

```bash
docker compose up --build
```

Adjust `DATABASE_URL` in `.env` / compose for your environment. The `Dockerfile` targets production: `prisma generate`, `next build`, `migrate deploy`, `next start`.

## Demo credentials

| Mode | How |
|------|-----|
| **Auto (recommended)** | Open the app — bootstrap issues a JWT for **`@plume_preview`**. |
| **Password (seeded users)** | Any seeded user email from the DB + password **`demo`** (bcrypt in seed). The UI does not expose a login form; use bootstrap or extend with a login route if needed. |

**Designated demo handle:** `plume_preview`

**Other seeded handles (personas):**  
`mira_chen`, `jules_oka`, `indiefocus`, `dr_clara`, `cityledger`, `brushandbyte`, `syntaxsarah`, `loopengineer`, `filmthread`, `climatememo`, `kitchencodes`, `urbansketch`, `polarfront`

## Database schema (overview)

- **User** — handle, name, bio, avatar, banner, location, password hash (optional)
- **Post** — body, `authorId`, `parentId` (replies), `quotedPostId` (quote tweets)
- **PostMedia** — image URLs per post
- **Like**, **Repost**, **Bookmark** — engagement
- **Follow** — follower / followee graph
- **Notification** — like, follow, reply, repost (with actor + optional post)
- **Hashtag** + **PostHashtag** — tags and trending counts

Run `npx prisma studio` to inspect.

## Iframe embed (parent career page)

Headers allow embedding: **`Content-Security-Policy: frame-ancestors *`** (see `next.config.ts`). Layout avoids `100vh` for the shell; modals mount under `#plume-shell`.

```html
<iframe
  src="https://YOUR-VERCEL-URL"
  width="100%"
  height="720"
  style="border:0;border-radius:16px;max-width:1200px;display:block;margin:0 auto"
  title="Plume"
  allow="autoplay; clipboard-write"
  loading="lazy"
></iframe>
```

Local multi-width check: open `iframe-test.html` in a browser (or `npx serve .` from the repo root). It includes **1024px**, **800px** (right rail hidden), and **1200px** (right rail visible) iframes.

## Deploy (Vercel + Supabase)

1. Create a **Supabase** project → **Project settings → Database** → copy the **connection string** (URI, with password). Set `?sslmode=require` if required.
2. In Vercel → project → **Environment variables**:
   - `DATABASE_URL` — Supabase Postgres URL
   - `JWT_SECRET` — long random string
   - `NEXT_PUBLIC_APP_NAME` — optional (`Plume`)
3. Deploy:

   ```bash
   npx vercel --prod --yes
   ```

   If the CLI stops for **interactive login**, finish linking in the browser once, then re-run; document any blocker in your handoff.

4. **Post-deploy:** run migrations against production (Vercel build can run `prisma migrate deploy` if configured, or run once locally with prod `DATABASE_URL`):

   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   DATABASE_URL="..." npm run db:seed
   ```

## GitHub

```bash
gh repo create ori1706/plume --public --source=. --push --description "Plume — portfolio microblog (Next.js, Prisma, Postgres)"
```

(Use another repo name if `plume` is taken.)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on port 3140 |
| `npm run build` / `npm start` | Production build & start |
| `npm run db:seed` | Reseed database |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run lint` | ESLint |

## Verification checklist (browser)

- Home timeline populated; Trending + Who to follow sidebars on large widths
- Compose (280 chars, images, `#` / `@` typeahead), post appears at top
- Hashtag → search; @mention → profile `/{handle}`
- Like / repost / reply / quote; notifications; Explore tabs; search
- **Iframe:** `iframe-test.html` loads three widths without CSP/frame errors

## License

MIT (showcase / portfolio use).
