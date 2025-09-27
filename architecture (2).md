Ride Split — Architecture (Next.js 14 + Prisma on Supabase Postgres + Clerk Auth)

This is a practical, production-minded blueprint you can hand to engineers. It covers files & folders, what each piece does, where state lives, and how services connect.


---

0) High-Level Overview

[ Browser (RSC + Client) ]
        │
        ▼
Next.js 14 (App Router)
  • Server Components (data fetching)
  • Route Handlers (mutations, webhooks)
  • Server Actions (optional)
  • Tailwind v3 UI + shadcn/ui
        │
        ▼
Clerk (Auth)
  • User sessions (JWT/cookies)
  • Webhook → sync to DB (Clerk → Prisma)
        │
        ▼
Supabase (as Postgres)
  • Primary database (managed Postgres)
  • Prisma as the ORM
  • (Optional) Supabase Storage
  • (Optional) Realtime channels (advanced)

Auth source of truth: Clerk
DB source of truth: Supabase Postgres, accessed via Prisma from server-side code only.


---

1) Environment Variables

Create .env.local (dev) and the same keys in Vercel → Project → Environment Variables.

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_****
CLERK_SECRET_KEY=sk_****
CLERK_WEBHOOK_SIGNING_SECRET=whsec_****

# Database (Supabase Postgres)
DATABASE_URL="postgresql://[user]:[pass]@[host]:[port]/[db]?schema=public&pgbouncer=true&connection_limit=1"

# Optional crypto for encrypting Uber/Ola share URLs
URL_ENC_KEY=<base64-encoded 32 bytes for AES-256-GCM>

# Optional: Supabase Storage/Realtime (if you use them later)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

> Note: When you use Prisma with Supabase, Prisma connects directly to the Supabase Postgres instance via DATABASE_URL. (RLS does not apply to Prisma connections—treat all DB access as trusted server-only.)




---

2) File & Folder Structure

src/
  app/
    (marketing)/
      page.tsx                     # Landing/Home
      how-it-works/page.tsx
      safety/page.tsx
    search/
      page.tsx                     # Ride search (RSC fetch)
    ride/
      new/page.tsx                 # Post a ride (client form → route handler)
      [id]/page.tsx                # Ride detail (RSC)
    requests/page.tsx              # Incoming / Outgoing requests
    profile/page.tsx               # User profile (phone, name)
    api/
      webhook/
        clerk/route.ts             # Clerk → DB user sync (Node runtime)
      rides/route.ts               # POST(create), GET(list) if needed
      rides/search/route.ts        # POST search
      rides/[id]/request/route.ts  # POST join (create RideMember)
      rides/[id]/respond/route.ts  # POST owner accept/decline
      rides/[id]/cancel/route.ts   # POST member cancel
      rides/[id]/complete/route.ts # POST owner complete
    layout.tsx
    globals.css
  components/
    nav/
      Navbar.tsx
      NavMenu.tsx
    forms/
      RideForm.tsx
      SearchForm.tsx
    cards/
      RideCard.tsx
      RequestCard.tsx
    ui/*                            # shadcn/ui components
  lib/
    prisma.ts                       # Prisma client singleton
    auth.ts                         # Clerk helpers (server)
    crypto.ts                       # encrypt/decrypt share URLs (optional)
    geo.ts                          # Haversine, bbox, etc.
    validation/
      ride.ts                       # Zod schemas for API inputs
  styles/
    tailwind.css
  types/
    domain.ts                       # shared TypeScript types (DTOs)
  middleware.ts                     # Clerk route protection (with webhook allowlist)
  prisma/
    schema.prisma                   # Prisma schema (User, Ride, RideMember)


---

3) What Each Part Does

app/ (Next.js App Router)

Server Components (RSC) fetch data on the server using Prisma and render HTML. Great for SEO & fast TTFB.

Route Handlers perform mutations (create ride, accept request, etc.). Always run on Node runtime when using Prisma.

Pages

/search: list active rides matching time & geo.

/ride/new: form to post a ride.

/ride/[id]: ride details + CTA (request to join / accept / complete).

/requests: incoming (for owners) & outgoing (for joiners).

/profile: edit display name & phone.



components/

UI building blocks (cards, forms, navbar) using Tailwind + shadcn/ui.


lib/

prisma.ts: PrismaClient singleton to avoid hot-reload leaks.

auth.ts: auth() helpers from @clerk/nextjs/server (eg. fetch userId).

crypto.ts: util to AES-GCM encrypt/decrypt vendor share URLs (if you store them).

geo.ts: distance calculations for search.

validation/ride.ts: Zod schemas (strict input validation at API boundaries).


middleware.ts

Uses Clerk middleware to protect routes by default.

Explicitly allow public pages and the webhook path so Clerk can call it unauthenticated.


prisma/schema.prisma

Models (User, Ride, RideMember) and enums (RideService, RideStatus, MemberStatus), with indexes & cascades.



---

4) Data Model (Prisma on Supabase)

Enums

enum RideService { UBER OLA }
enum RideStatus { ACTIVE COMPLETED CANCELLED }
enum MemberStatus { PENDING ACCEPTED DECLINED CANCELLED }

User

clerkId (unique) — sync from Clerk (webhook).

email (unique), phone? (unique) — for contact; show only to accepted members.

name, firstName?, lastName?, imageUrl?, rating (default 5).


Ride

Geography: fromText/toText, fromLat/fromLng, toLat/toLng.

Timing: departureAt.

Capacity: seatsTotal, seatsAvailable.

Pricing snapshot (paise): estTotalFare, perSeatPrice.

Optional vendor link: shareUrlEnc (encrypted), shareUrlHash (unique when present).

Status: ACTIVE | COMPLETED | CANCELLED, isVerified flag.

Indexes for status+departureAt, ownerId, lat/lng to speed queries.


RideMember

Join requests: PENDING → ACCEPTED | DECLINED | CANCELLED.

fareShare snapshot (paise).

Unique (rideId, userId) prevents duplicates.



---

5) Where State Lives

State kind	Location / Tooling	Notes

Auth session	Clerk (cookies/JWT)	Access via @clerk/nextjs/server in RSC & routes.
Server state	Supabase Postgres (via Prisma)	The “source of truth”. Fetch in RSC; mutate in route handlers.
Client UI state	React useState / shadcn components	Form controls, tabs, dialogs, filters.
Remote cache	(Optional) SWR/React Query in client routes	Only if you add client-side fetches; RSC often eliminates the need.
Realtime	(Optional) Supabase Realtime channels	Advanced: can reflect seat/request updates live. MVP can poll or refresh after actions.


> MVP tip: Start without realtime—RSC + navigation gives you “fresh” data. Add realtime later (e.g



