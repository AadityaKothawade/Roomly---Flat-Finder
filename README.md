# Roomly — Rent & Flatmate Finder

Room listings ranked by an AI compatibility score, with real-time chat once
interest is accepted.

**Stack:** Next.js (App Router, JavaScript) · Clerk (auth) · Supabase (Postgres)
· Node.js + socket.io (WebSocket chat server) · Gemini API (compatibility scoring) · Resend (email)

```
roomly/
  web/         <- the Next.js app (everything users interact with)
  ws-server/   <- the WebSocket server that powers real-time chat
```

You run both side by side in two terminals. All env variable *names* below are
kept exactly as before — nothing renamed.

---

## 1. Prerequisites

- Node.js 18.18+ (`node -v` to check)
- Free accounts: [Clerk](https://clerk.com), [Supabase](https://supabase.com),
  [Google AI Studio](https://aistudio.google.com/apikey) (Gemini), [Resend](https://resend.com)

---

## 2. Set up Supabase

1. Create a project at [app.supabase.com](https://app.supabase.com).
2. **SQL Editor** → paste and run the full contents of `web/schema.sql`.
3. **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` (web) / `SUPABASE_URL` (ws-server)
   - `service_role` key (not `anon`!) → `SUPABASE_SERVICE_ROLE_KEY` (both)

## 3. Set up Clerk

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. **API Keys** → copy the publishable key and secret key.

No webhook setup needed — the app creates each person's database row
automatically the first time they're authenticated (see section 11).

## 4. Set up Gemini
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) → create a free key → `GEMINI_API_KEY`.

## 5. Set up Resend
[resend.com](https://resend.com) → sign up → copy your API key → `RESEND_API_KEY`.
You can leave `NOTIFICATION_FROM_EMAIL=onboarding@resend.dev` for testing — it's
Resend's shared test sender, works instantly with no domain verification.

> ⚠️ Resend's test sender (`onboarding@resend.dev`) can only deliver to **the email
> address you signed up to Resend with**, until you verify your own domain. For
> testing, make sure your Clerk test accounts use that same email, or verify a
> domain in Resend if you want to send to arbitrary addresses.

---

## 6. Install & run the web app

```bash
cd web
npm install
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=            # leave blank, not used
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
RESEND_API_KEY=...
NOTIFICATION_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

```bash
npm run dev
```
→ **http://localhost:3000**

---

## 7. Install & run the WebSocket chat server

Second terminal, app from step 6 still running:

```bash
cd ws-server
npm install
cp .env.example .env
```

Fill in `.env` (same Supabase + Clerk project as above):
```
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CLERK_SECRET_KEY=...
```

```bash
npm run dev
```
→ runs on **http://localhost:4000**

---

## 8. Full walkthrough — try every feature

This exercises the whole app end to end, including chat and email, so you can
confirm everything works before you rely on it.

1. Visit `http://localhost:3000` → **Sign up** → choose **owner** → post a listing.
2. Sign out (or open an incognito window) → **sign up again** with a **different**
   email → choose **tenant** → set your preferences.
3. Go to **Browse rooms** — you'll see the listing with an AI compatibility score
   (click "why this score?" to see the explanation).
4. Click into the listing → **Express interest**.
   - Check the owner's inbox — Resend should send an email immediately, for every
     interest (not just high scores; the wording changes if the score is > 80).
     (Delivery only works if the tenant's email matches your Resend test-sender
     restriction — see the Resend note above.)
   - A **Chat** button/link appears right away on the tenant's side too — you
     don't have to wait for the owner to accept before chatting starts.
5. Switch back to the **owner** account → **My listings** → you'll see a banner
   ("X new interests") and the interest listed under that listing, along with the
   match score → click **Chat** to message the tenant right now, or **Accept**/
   **Decline** to formally respond.
   - Accepting or declining emails the tenant with the decision.
6. Open the chat on **both** accounts (two different browser windows/tabs, signed
   in as each user) → send a message from one side → **it should appear instantly
   on the other**, no refresh needed. That's the WebSocket connection working live.
7. Back in **My listings** (owner), try **Edit** on a listing — change the rent,
   save, confirm it updates. Try **Delete** on a test listing, confirm it disappears.
8. As the tenant, go to **My preferences** — you should see the values you saved
   earlier already filled in. Change your budget, save — go back to **Browse rooms**
   and the compatibility score should recompute (old scores are invalidated whenever
   you update your preferences).

**If chat doesn't work:** check that `ws-server` is actually running (step 7) and
that your browser's dev console doesn't show a connection error. The chat page
shows a small `● live` / `● connecting…` / `● <error>` indicator at the top — that
error text usually says exactly what's wrong (most often: ws-server isn't running,
or `NEXT_PUBLIC_WS_URL` in `web/.env.local` doesn't match where it's actually running).

**If email doesn't arrive:** check your `web` terminal for a logged error from
`lib/email.js` (it logs failures instead of crashing, by design) — usually a bad
`RESEND_API_KEY` or the test-sender restriction mentioned above.

---

## 9. Project structure

```
web/
  app/
    (auth)/sign-in, (auth)/sign-up      Clerk auth pages
    dashboard/                          smart post-login redirect (role/setup aware)
    onboarding/                         role selection (tenant/owner)
    owner/dashboard/                    listings + incoming interests
    owner/listings/new/                 create listing (ListingForm.jsx, shared)
    owner/listings/[id]/edit/           edit listing (reuses ListingForm.jsx)
    tenant/profile/                     view/update/clear preferences (ProfileForm.jsx)
    listings/, listings/[id]/           browse + detail + AI score + interest button
    chat/[interestId]/                  real-time chat (connects to ws-server)
    api/
      listings/                         POST create
      listings/[id]/                    GET / PATCH (edit) / DELETE
      listings/[id]/fill/               mark as filled
      tenant-profile/                   GET / POST (upsert) / DELETE
      interests/                        POST express interest
      interests/[id]/                   PATCH accept/decline
      score/                            compute + cache AI compatibility score
      messages/[interestId]/            chat history + access check
      set-role/                         onboarding role selection
      webhooks/clerk/                   optional push-sync (unused by default)
  components/
    CompatibilityMeter.jsx              signature radial AI-score visual
    Nav.jsx                             role-aware nav with active-page highlighting
  lib/
    supabaseAdmin.js, currentDbUser.js (auto-provisions users), geminiScore.js,
    ruleBasedScore.js, scoreListing.js, email.js
  schema.sql

ws-server/
  server.js       socket.io server, Clerk-authenticated chat rooms
  README.md
```

---

## 10. CRUD reference

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Listing | `POST /api/listings` | `GET /api/listings/[id]` (owner only) + public browse pages | `PATCH /api/listings/[id]` | `DELETE /api/listings/[id]` |
| Tenant profile | `POST /api/tenant-profile` (upsert) | `GET /api/tenant-profile` | same POST (upsert) | `DELETE /api/tenant-profile` |
| Interest | `POST /api/interests` | via owner dashboard / listing detail | `PATCH /api/interests/[id]` (accept/decline) | — (not deletable by design; it's a record of a decision) |
| Compatibility score | auto-created on first view | cached, served automatically | auto-invalidated when the tenant updates their profile | — |

---

## 11. Design notes

**Auth → database sync:** No Clerk webhook required. `lib/currentDbUser.js` checks
for a matching Supabase `users` row by `clerk_id` on every authenticated request,
and creates it on the spot (using the person's name/email from Clerk) if it's
missing. Simpler than webhook-based sync for local dev — the optional webhook
route still exists at `api/webhooks/clerk` if you want push-based sync later.

**Compatibility scoring:** Computed once per tenant/listing pair via Gemini,
cached in `compatibility_scores`. Falls back to a deterministic rule-based score
(`lib/ruleBasedScore.js`, combining location match + budget overlap) if Gemini
fails, times out, or returns malformed JSON — the UI marks these as "estimated."
Scores are invalidated and recomputed whenever a tenant edits their preferences.

**Chat:** Separate Node.js + socket.io server, since persistent WebSocket
connections aren't supported on serverless hosts like Vercel. Chat unlocks as
soon as a tenant expresses interest (any status except `declined`) — both sides
get a **Chat** button immediately, so they can start talking while the owner
decides. Clients send their Clerk session token on connect; the server verifies
it and confirms the user is a participant in that `interest_id` before letting
them join the room. Messages persist to Postgres before broadcast.

**Notifications:** The owner gets an email **every time** a tenant expresses
interest in one of their listings (with the compatibility score included when
available, and stronger framing for scores > 80). Accept/decline decisions
email the tenant. Both via Resend, both logged to `notifications`.

**Navigation:** `/dashboard` is the one stable link to send anyone to after
sign-in — it branches by role and setup-state so people always land somewhere
useful instead of a generic page. `Nav.jsx` highlights the current section and
surfaces a "Finish setup" prompt if onboarding hasn't been completed yet.

---

## 12. Deploying

- **web** → Vercel. Same env vars as `.env.local`, plus set `NEXT_PUBLIC_WS_URL`
  to your deployed ws-server's URL.
- **ws-server** → Railway, Render, or Fly.io (needs a host that keeps a process
  running — not serverless). Set `FRONTEND_URL` to your deployed Vercel URL.

Known tradeoff: pinned to Next.js **14.2.35** (final patched 14.x release) rather
than 15/16, since those changed how `params` work on every page — fine for a
demo, worth revisiting before production use.
