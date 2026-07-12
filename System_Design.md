## System Design Write-Up

### 1 .Compatibility Scoring Design

Every tenant/listing pair is scored exactly once and cached, not recomputed on
every page view. When a tenant first views a listing (or updates their saved
preferences), the app checks the compatibility_scores table for an existing
row keyed by (tenant_id, listing_id). If found, that cached score is served
directly. If not, the app calls the scoring pipeline, stores the result
(score, explanation, and a source flag of "llm" or "fallback"), and serves
it. This keeps browsing fast and keeps LLM usage proportional to actual
distinct pairs viewed, not to every request.

Editing a tenant's preferences invalidates their previously cached scores,
since a changed budget or location makes old scores stale; the next browse
recomputes fresh ones automatically. The same scoring function also powers a
"top 3 matches" feature: whenever a tenant saves their profile, the app scores
every currently open listing (capped at the 20 most recent, to bound LLM calls
per save) and emails the top 3 directly to the tenant with a link back into
the app.

### 2. LLM Integration and Fallback

Compatibility scoring is delegated to Gemini (gemini-2.5-flash). The prompt
supplies the listing's location, rent, availability, room type, and
furnishing status alongside the tenant's preferred location, budget range,
and move-in date, and asks for strict JSON: { score: number, explanation: string }.
The response is parsed and validated — the score must be a number between 0
and 100 and the explanation must be a string — before being trusted and
stored.

If the LLM call fails for any reason — network error, timeout, an invalid API
key, or malformed/out-of-range JSON in the response — the app falls back to a
deterministic rule-based scorer instead of surfacing an error to the user.
The fallback awards up to 50 points for location match (exact, partial, or
none) and up to 50 points for how far the listing's rent falls inside the
tenant's budget range, producing a comparable 0–100 score with a plain-text
explanation of how it was derived. Every stored score carries a source
field ("llm" or "fallback"), and the UI visibly marks fallback scores as
"estimated" so the distinction is never hidden from the user. This
guarantees the core ranking feature keeps working even if the LLM provider
is down, misconfigured, or rate-limited.

### 3.Chat Implementation

Real-time chat runs on a dedicated Node.js server using socket.io, deployed
separately from the Next.js app, since serverless hosts like Vercel cannot
hold a persistent WebSocket connection open. The two services share the same
Supabase database and Clerk project. On connecting, a client sends its Clerk
session token as socket auth; the server verifies it server-side via
@clerk/backend and resolves it to the corresponding internal user row
before allowing any further action.

Chat is scoped per interest: a client must explicitly join_room with an
interest_id, and the server checks that the requesting user is actually one
of the two participants (the tenant or the listing's owner) on that interest,
and that the interest hasn't been declined, before allowing the join. Sent
messages are persisted to the messages table first and then broadcast to
everyone currently in that room, so chat history survives reconnects and
page reloads — message history for a given interest is fetched over a normal
authenticated REST endpoint on initial load, and the socket connection only
streams new messages from that point forward.

### 4.Notification Flow

Two email events are wired through Resend. When a tenant expresses interest
in a listing, the owner is emailed immediately — every time, not only for
high scores — with the tenant's name and the cached compatibility score if
one exists by that point; scores above 80 get stronger "strong match" framing
in the subject line, but the notification itself is never gated behind a
score threshold, so an owner never misses an interested tenant. When the
owner accepts or declines that interest, the tenant is emailed the decision
in turn.

Every notification-worthy event is also logged to a notifications table
(recipient, type, and a JSON payload of relevant IDs/scores), independent of
whether the email itself succeeds — email sending is wrapped so a Resend
failure is logged and swallowed rather than breaking the underlying action
(e.g. expressing interest still succeeds even if the notification email
fails to send). This keeps a durable, queryable activity record — visible to
admins on the platform's admin dashboard — decoupled from the delivery
mechanism of any single email provider.