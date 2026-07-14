# Roomly — Rent & Flatmate Finder

**Live app:** https://roomly-flat-finder.vercel.app/

Room listings ranked by an AI compatibility score, with real-time chat once
interest is expressed, and email notifications on key events.

**Stack:** Next.js (App Router, JavaScript) · Clerk (auth) · Supabase (Postgres)
· Node.js + socket.io (WebSocket chat server, deployed on Render) · Gemini API
(compatibility scoring) · Resend (email)

```
roomly/
  web/         <- the Next.js app (deployed on Vercel)
  ws-server/   <- the WebSocket server (deployed on Render)
```

---

## 1. Setup Guide (local development)

### Prerequisites
- Node.js 18.18+
- Free accounts: [Clerk](https://clerk.com), [Supabase](https://supabase.com), [Google AI Studio](https://aistudio.google.com/apikey) (Gemini), [Resend](https://resend.com)

### Supabase
1. Create a project at [app.supabase.com](https://app.supabase.com)
2. **SQL Editor** → run the full contents of `web/schema.sql`
3. **Project Settings → API** → copy the `Project URL` and `service_role` key (not `anon`)

### Clerk
1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. **API Keys** → copy the publishable key and secret key
3. No webhook setup needed — the app creates each user's database row automatically on first sign-in

### Gemini & Resend
- [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → create a free key
- [resend.com](https://resend.com) → sign up → copy your API key (test sender `onboarding@resend.dev` works out of the box)

### Run the web app
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```
App runs at `http://localhost:3000`

### Run the WebSocket chat server (second terminal)
```bash
cd ws-server
npm install
cp .env.example .env
npm run dev
```
Server runs at `http://localhost:4000`

---

## 2. Environment Variables

### `web/.env.local`

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | From Clerk dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Optional, unused by default — leave blank |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Project Settings → API (service_role, not anon) |
| `GEMINI_API_KEY` | From aistudio.google.com/apikey |
| `RESEND_API_KEY` | From Resend → API Keys |
| `NOTIFICATION_FROM_EMAIL` | `onboarding@resend.dev` (Resend's test sender) |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:4000` locally, or the deployed ws-server URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, or the deployed Vercel URL |

### `ws-server/.env`

| Variable | Notes |
|---|---|
| `PORT` | `4000` |
| `FRONTEND_URL` | `http://localhost:3000` locally, or the deployed Vercel URL |
| `SUPABASE_URL` | Same value as `NEXT_PUBLIC_SUPABASE_URL` above |
| `SUPABASE_SERVICE_ROLE_KEY` | Same value as above |
| `CLERK_SECRET_KEY` | Same value as above |

---

## 3. API Documentation

All routes live under `web/app/api/`. Auth is via Clerk session; role checks happen per-route.

| Method | Route | Role required | Description |
|---|---|---|---|
| POST | `/api/set-role` | any signed-in user | Sets tenant/owner role during onboarding |
| POST | `/api/listings` | owner | Create a listing |
| GET | `/api/listings/[id]` | owner or admin | Fetch a single listing (edit prefill) |
| PATCH | `/api/listings/[id]` | owner (own) or admin | Update a listing |
| DELETE | `/api/listings/[id]` | owner (own) or admin | Delete a listing |
| POST | `/api/listings/[id]/fill` | owner | Mark a listing as filled |
| GET | `/api/tenant-profile` | tenant | Fetch the current tenant's saved preferences |
| POST | `/api/tenant-profile` | tenant | Create/update preferences (upsert); triggers top-3-matches email |
| DELETE | `/api/tenant-profile` | tenant | Clear saved preferences |
| POST | `/api/interests` | tenant | Express interest in a listing; emails the owner |
| PATCH | `/api/interests/[id]` | owner | Accept/decline an interest; emails the tenant |
| POST | `/api/score` | tenant | Compute/fetch a cached compatibility score |
| GET | `/api/messages/[interestId]` | participant | Fetch chat history for an interest |
| DELETE | `/api/admin/users/[id]` | admin | Delete a user |
| POST | `/api/webhooks/clerk` | — | Optional push-based user sync (unused by default) |

**WebSocket events** (`ws-server`, connects via Clerk session token):

| Event | Direction | Description |
|---|---|---|
| `join_room` | client → server | Join a chat room for a given `interestId`; server verifies participation |
| `send_message` | client → server | Send a message; persisted to DB, then broadcast |
| `new_message` | server → client | Broadcast of a new message to everyone in the room |

---

## 4. Database Schema

Full schema in `web/schema.sql`. Summary:

| Table | Purpose |
|---|---|
| `users` | Mirrors Clerk identity; holds `role` (tenant/owner/admin) |
| `listings` | Room listings posted by owners |
| `tenant_profiles` | Tenant preferences (location, budget range, move-in date) |
| `compatibility_scores` | Cached AI/rule-based score per (tenant, listing) pair, with `source` flag |
| `interests` | Tenant → listing interest requests, with `status` (pending/accepted/declined) |
| `messages` | Chat messages, scoped to an `interest_id` |
| `notifications` | Log of notification-worthy events, independent of email delivery |

All tables have RLS enabled; the app only ever talks to Supabase from trusted
server-side code using the service role key, authorizing against the Clerk
session in application code.

---

## 5. LLM Prompt & Example I/O

**Prompt template** (`web/lib/geminiScore.js`):
```
Given this room listing: { location, rent, available_from, room_type, furnishing_status }
And this tenant profile: { preferred_location, budget_min, budget_max, move_in_date }
Compute a compatibility score from 0 to 100 based on budget and location match.
Respond with ONLY valid JSON in this exact shape:
{ "score": number, "explanation": string }
```

**Example input — listing:**
```json
{ "location": "Koramangala, Bangalore", "rent": 18000, "available_from": "2026-08-01", "room_type": "private", "furnishing_status": "furnished" }
```

**Example input — tenant profile:**
```json
{ "preferred_location": "Koramangala, Bangalore", "budget_min": 15000, "budget_max": 20000, "move_in_date": "2026-08-15" }
```

**Example output:**
```json
{
  "score": 92,
  "explanation": "Excellent match — the listing is in your exact preferred neighborhood, the rent falls comfortably within your budget range, and the availability date lines up well with your move-in date."
}
```

**Fallback:** used if the LLM call fails, times out, or returns malformed JSON (`web/lib/ruleBasedScore.js`) — a deterministic score combining up to 50 points for location match and up to 50 points for budget-range overlap, with `source: "fallback"` stored alongside it so the UI can label it "estimated."

---

## 6. System Design Write-Up

### Compatibility Scoring Design

Every tenant/listing pair is scored exactly once and cached, not recomputed on
every page view. When a tenant first views a listing (or updates their saved
preferences), the app checks the `compatibility_scores` table for an existing
row keyed by `(tenant_id, listing_id)`. If found, that cached score is served
directly. If not, the app calls the scoring pipeline, stores the result
(score, explanation, and a source flag of `"llm"` or `"fallback"`), and serves
it. This keeps browsing fast and keeps LLM usage proportional to actual
distinct pairs viewed, not to every request.

Editing a tenant's preferences invalidates their previously cached scores,
since a changed budget or location makes old scores stale; the next browse
recomputes fresh ones automatically. The same scoring function also powers a
"top 3 matches" feature: whenever a tenant saves their profile, the app scores
every currently open listing (capped at the 20 most recent, to bound LLM calls
per save) and emails the top 3 directly to the tenant with a link back into
the app.

### LLM Integration and Fallback

Compatibility scoring is delegated to Gemini (`gemini-2.5-flash`). The prompt
supplies the listing's location, rent, availability, room type, and
furnishing status alongside the tenant's preferred location, budget range,
and move-in date, and asks for strict JSON: `{ score: number, explanation: string }`.
The response is parsed and validated — the score must be a number between 0
and 100 and the explanation must be a string — before being trusted and
stored.

If the LLM call fails for any reason — network error, timeout, an invalid API
key, or malformed/out-of-range JSON in the response — the app falls back to a
deterministic rule-based scorer instead of surfacing an error to the user.
The fallback awards up to 50 points for location match (exact, partial, or
none) and up to 50 points for how far the listing's rent falls inside the
tenant's budget range, producing a comparable 0–100 score with a plain-text
explanation of how it was derived. Every stored score carries a `source`
field (`"llm"` or `"fallback"`), and the UI visibly marks fallback scores as
"estimated" so the distinction is never hidden from the user. This
guarantees the core ranking feature keeps working even if the LLM provider
is down, misconfigured, or rate-limited.

### Chat Implementation

Real-time chat runs on a dedicated Node.js server using socket.io, deployed
separately from the Next.js app, since serverless hosts like Vercel cannot
hold a persistent WebSocket connection open. The two services share the same
Supabase database and Clerk project. On connecting, a client sends its Clerk
session token as socket auth; the server verifies it server-side via
`@clerk/backend` and resolves it to the corresponding internal user row
before allowing any further action.

Chat is scoped per interest: a client must explicitly `join_room` with an
`interest_id`, and the server checks that the requesting user is actually one
of the two participants (the tenant or the listing's owner) on that interest,
and that the interest hasn't been declined, before allowing the join. Sent
messages are persisted to the `messages` table first and then broadcast to
everyone currently in that room, so chat history survives reconnects and
page reloads — message history for a given interest is fetched over a normal
authenticated REST endpoint on initial load, and the socket connection only
streams new messages from that point forward.

### Notification Flow

Two email events are wired through Resend. When a tenant expresses interest
in a listing, the owner is emailed immediately — every time, not only for
high scores — with the tenant's name and the cached compatibility score if
one exists by that point; scores above 80 get stronger "strong match" framing
in the subject line, but the notification itself is never gated behind a
score threshold, so an owner never misses an interested tenant. When the
owner accepts or declines that interest, the tenant is emailed the decision
in turn.

Every notification-worthy event is also logged to a `notifications` table
(recipient, type, and a JSON payload of relevant IDs/scores), independent of
whether the email itself succeeds — email sending is wrapped so a Resend
failure is logged and swallowed rather than breaking the underlying action
(e.g. expressing interest still succeeds even if the notification email
fails to send). This keeps a durable, queryable activity record — visible to
admins on the platform's admin dashboard — decoupled from the delivery
mechanism of any single email provider.

---

## 7. Deployment

| Service | Platform | Root directory | Notes |
|---|---|---|---|
| web | Vercel | `web` | Free Hobby tier, no card required |
| ws-server | Render | `ws-server` | Free tier — sleeps after 15 min idle, ~30-60s cold start on next request |

Both services share the same Supabase project and Clerk app. See the environment variable tables in section 2 for what each one needs.
