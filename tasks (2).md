Ride Split — MVP Build Plan (Next.js 14 + Prisma on Supabase Postgres + Clerk)

Each task is tiny, single-concern, and testable. Execute one at a time and run the Test before moving on.


---

Phase 0 — Bootstrap & Tooling

0.1 Scaffold Next.js + Tailwind

Start: No repo.

Do:

npx create-next-app@14.22.2 ridesplit --ts --app --eslint --tailwind
cd ridesplit

Done when: Dev server starts.

Test: Visit http://localhost:3000 and see the default page.


0.2 Install core deps

Start: Fresh app.

Do:

npm i @clerk/nextjs zod @prisma/client prisma lucide-react clsx

Done when: package.json lists packages.

Test: npm run build completes.


0.3 Commit baseline

Start: Uncommitted changes.

Do: Initialize git and commit.

Done when: git log shows initial commit.

Test: git status is clean.



---

Phase 1 — Environment & Config

1.1 Add env placeholders

Start: No env file.

Do: Create .env.local with:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
DATABASE_URL=
URL_ENC_KEY=

Done when: File exists locally.

Test: process.env.DATABASE_URL logs non-empty in a server file (temporary).


1.2 Configure Tailwind base styles

Start: Default CSS.

Do: Add a bg-gray-50 wrapper in app/layout.tsx.

Done when: Background is light gray.

Test: Reload page; UI reflects style.



---

Phase 2 — Prisma + Supabase Postgres

2.1 Initialize Prisma

Start: No Prisma files.

Do: npx prisma init → sets prisma/schema.prisma.

Done when: prisma/ folder exists.

Test: npx prisma format succeeds.


2.2 Paste schema

Start: Empty schema.

Do: Add your User, Ride, RideMember models + enums + indexes to schema.prisma.

Done when: File compiles.

Test: npx prisma validate succeeds.


2.3 Migrate & generate

Start: Schema present.

Do:

npx prisma migrate dev -n init
npx prisma generate

Done when: Tables created; client generated.

Test: npx prisma studio shows 3 tables.


2.4 Create Prisma singleton

Start: None.

Do: Create src/lib/prisma.ts with a PrismaClient singleton.

Done when: File compiles.

Test: Temporary route handler runs await prisma.$queryRaw\select 1`` without error.



---

Phase 3 — Clerk Auth (App Router)

3.1 Wrap app with ClerkProvider

Start: No provider.

Do: In app/layout.tsx, wrap <body> with <ClerkProvider>…</ClerkProvider>.

Done when: App builds.

Test: Put <UserButton/> in the navbar; it renders signed-out state.


3.2 Add Sign-in/Sign-up routes

Start: Missing pages.

Do: Add:

app/sign-in/[[...sign-in]]/page.tsx

app/sign-up/[[...sign-up]]/page.tsx using Clerk components.


Done when: Pages render.

Test: Navigate to /sign-in and see the form.


3.3 Protect routes via middleware

Start: No auth gating.

Do: Create middleware.ts:

Public: /, /sign-in(.*), /sign-up(.*), /api/webhook/clerk(.*)

Protect everything else.


Done when: Middleware runs.

Test: Visit /profile signed-out → redirected to sign-in.



---

Phase 4 — Clerk Webhook → DB User Sync

4.1 Create webhook route file

Start: None.

Do: Add app/api/webhook/clerk/route.ts with:

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

GET handler returning 405 (for existence checks).


Done when: Route exists.

Test: Browser GET /api/webhook/clerk → 405.


4.2 Implement Svix verification skeleton

Start: Bare file.

Do: In POST, read svix-* headers, await req.text(), and if missing headers return 400.

Done when: Returns 400 for missing headers.

Test: curl -X POST /api/webhook/clerk → 400.


4.3 Upsert user by clerkId

Start: No DB write.

Do: Verify with CLERK_WEBHOOK_SIGNING_SECRET, parse event, on user.created|user.updated do prisma.user.upsert({ where:{clerkId}, … }), populate email?, firstName?, lastName?, imageUrl?, name.

Done when: Row appears/updates.

Test: From Clerk dashboard, send a Test delivery → 200; row created.



---

Phase 5 — Minimal Health & Auth Debug

5.1 Health endpoint

Start: None.

Do: Add app/api/healthz/route.ts returning {ok:true}.

Done when: Responds JSON.

Test: GET /api/healthz → 200 {ok:true}.


5.2 Session debug endpoint

Start: None.

Do: Add app/api/debug/session/route.ts that returns { userId } from @clerk/nextjs/server.

Done when: Endpoint compiles.

Test: Signed in call returns your Clerk userId.



---

Phase 6 — Validation Schemas (Zod)

6.1 Create Zod DTOs

Start: None.

Do: src/lib/validation/ride.ts with:

RideCreateSchema

RideSearchSchema

RespondSchema ({ memberId, action: 'ACCEPT' | 'DECLINE' })


Done when: Types compile.

Test: Import and safeParse in a small unit test script.



---

Phase 7 — Domain APIs (Route Handlers)

> Each handler: Node runtime, parse with Zod, return { ok, data? , error? }.



7.1 POST /api/rides (create ride)

Start: No create.

Do: Validate body; compute perSeatPrice; set seatsAvailable = seatsTotal; connect ownerId via current user; optionally compute shareUrlHash/shareUrlEnc.

Done when: Row inserted.

Test: curl with JSON body while signed in → 200 + ride ID; DB shows row.


7.2 GET /api/rides/[id] (fetch ride)

Start: None.

Do: Return ride detail; include owner name/phone; omit shareUrlEnc unless viewer is owner or accepted member.

Done when: Conditional exposure works.

Test: Call as owner vs another user; compare JSON fields.


7.3 POST /api/rides/search (time + geo)

Start: None.

Do: Validate { fromLat, fromLng, toLat, toLng, timeStart, timeEnd }; filter by time & simple Haversine threshold.

Done when: List returned.

Test: Seed two rides; verify only matching ride returns.


7.4 POST /api/rides/[id]/request (create RideMember PENDING)

Start: None.

Do: Create membership with fareShare = perSeatPrice; enforce (rideId,userId) uniqueness.

Done when: Row created.

Test: Second call returns 409/400 with clear error.


7.5 POST /api/rides/[id]/respond (owner accept/decline)

Start: None.

Do: Transaction:

ACCEPT: decrement seats iff seatsAvailable > 0, set member ACCEPTED

DECLINE: set member DECLINED


Done when: Seat decrements once on accept.

Test: Two rapid accepts on last seat → one fails gracefully.


7.6 POST /api/rides/[id]/cancel (member cancel)

Start: None.

Do: If PENDING → CANCELLED (no seat change); if ACCEPTED → tx: set CANCELLED + increment seats by 1.

Done when: Correct seat math.

Test: Cancel an accepted member; seats +1.


7.7 POST /api/rides/[id]/complete (owner completes ride)

Start: None.

Do: Set Ride.status = COMPLETED (owner only).

Done when: Status flips.

Test: Non-owner returns 403.



---

Phase 8 — UI Skeleton (Server Components first)

8.1 Navbar

Start: Default layout.

Do: Add components/nav/Navbar.tsx with items: Search / Post a Ride / My Rides / Requests / Profile + <UserButton/>.

Done when: Visible on all pages.

Test: Links navigate (even if pages are placeholder).


8.2 /ride/new (client form)

Start: Blank page.

Do: Build minimal form (from/to text + lat/lng + datetime + seats + est fare + service + optional URL). On submit → POST /api/rides → redirect to /ride/[id].

Done when: Creates a ride end-to-end.

Test: Submit valid data → land on ride detail.


8.3 /ride/[id] (RSC detail)

Start: Placeholder.

Do: Fetch ride; show route, time, seats, per-seat price; show Request to Join for non-owner; Complete for owner.

Done when: CTAs render by role.

Test: Owner vs non-owner accounts show different actions.


8.4 /search (RSC list)

Start: Placeholder.

Do: Simple filters (time window dropdowns) + POST to search API; render RideCards.

Done when: Results list appears.

Test: Seed rides; matches render.


8.5 /requests (RSC)

Start: Placeholder.

Do: Two sections: Incoming (for rides I own) and Outgoing (my requests). Each card shows status + Accept/Decline/Cancel buttons.

Done when: Buttons call APIs; page reload shows new states.

Test: Full flow works manually.


8.6 Contact reveal (accepted only)

Start: Always hidden.

Do: In /ride/[id], if viewer is owner or has ACCEPTED membership, show owner Call/WhatsApp using phone.

Done when: Buttons gated correctly.

Test: Before vs after acceptance toggles visibility.



---

Phase 9 — Rules & Safety

9.1 Time lock (T−10m)

Start: No lock.

Do: In accept handler, if Date.now() > departureAt - 10m, reject with 400.

Done when: Late accepts blocked.

Test: Ride 5 minutes out → accept fails.


9.2 Dedupe by URL hash (optional)

Start: No dedupe.

Do: If URL provided, compute hash; on create, 409 if another ACTIVE ride has same hash.

Done when: Duplicate rejected.

Test: Post same URL twice → second returns 409.


9.3 Encrypt vendor share URL (optional)

Start: Plainstring or none.

Do: Implement AES-GCM encrypt/decrypt in lib/crypto.ts; store ciphertext in shareUrlEnc.

Done when: DB stores ciphertext; decrypt only for owner/accepted.

Test: Inspect DB → unreadable; accepted user receives plaintext.



---

Phase 10 — UX Polish

10.1 Loading & error boundaries

Start: Defaults.

Do: Add loading.tsx and error.tsx for major routes.

Done when: Shows spinner + friendly errors.

Test: Artificially delay RSC; throw in a handler to see error.


10.2 Toasts for mutations

Start: Silent actions.

Do: Add a toast hook; show success/error on request/accept/decline/cancel/complete.

Done when: Visual feedback appears.

Test: Trigger each action and see a toast.


10.3 Animated nav underline

Start: Static.

Do: Add ::after underline transition to nav buttons.

Done when: Hover animates smoothly.

Test: Manual hover check.



---

Phase 11 — Deployment

11.1 Prepare envs in Vercel

Start: Local only.

Do: Set:

DATABASE_URL

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

CLERK_SECRET_KEY

CLERK_WEBHOOK_SIGNING_SECRET

(optional) URL_ENC_KEY


Done when: Variables saved for Preview/Prod.

Test: Trigger a build; no missing env errors.


11.2 First deploy

Start: Connected repo.

Do: Deploy to Vercel (default Next build).

Done when: Production URL loads home.

Test: /api/healthz returns {ok:true}.


11.3 Webhook in production

Start: Deployed.

Do: In Clerk dashboard, set endpoint to https://<domain>/api/webhook/clerk and send a test.

Done when: 200 OK; user row upserts in prod DB.

Test: Check DB row and Vercel logs.



---

Phase 12 — QA Scenarios

12.1 Happy path flow

Start: Two accounts.

Do: Owner posts ride → joiner requests → owner accepts → contact revealed → complete


