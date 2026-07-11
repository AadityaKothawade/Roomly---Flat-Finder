# Rent & Flatmate Finder — WebSocket Chat Server

A standalone Node.js + socket.io server that powers real-time chat for the
Rent & Flatmate Finder app. Runs separately from the Next.js app because
Vercel's serverless functions can't hold persistent WebSocket connections.

## Setup

```bash
npm install
cp .env.example .env
# fill in .env (same Supabase project + same Clerk app as the Next.js app)
npm run dev
```

Server listens on `http://localhost:4000` by default.

## How it works

- Client connects with its Clerk session token in `socket.handshake.auth.token`.
- Server verifies the token with `@clerk/backend`, maps it to the internal Supabase user id.
- Client emits `join_room` with an `interestId` — server checks the interest is `accepted`
  and the user is one of its two participants before allowing the join.
- Client emits `send_message` — server persists it to the `messages` table, then
  broadcasts `new_message` to everyone in that room.

## Deploying

Deploy to Railway, Render, or Fly.io (needs a host that supports long-running processes).
Set the same environment variables there, and point `FRONTEND_URL` at your deployed
Next.js app's URL, and `NEXT_PUBLIC_WS_URL` in the Next.js app at this server's URL.
