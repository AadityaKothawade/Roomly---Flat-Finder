import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@clerk/backend";

// Supabase's client library expects a native WebSocket global for its
// realtime subsystem, which only exists natively starting in Node 22.
// This polyfills it so createClient() doesn't crash on Node 20/21 — we
// don't actually use realtime features here, but the client sets this up
// unconditionally regardless.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

// Verify the Clerk session token sent by the client on connect.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("No token provided");

    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    socket.clerkUserId = payload.sub;

    const { data: dbUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", payload.sub)
      .single();

    if (error || !dbUser) throw new Error("User not found");
    socket.dbUserId = dbUser.id;

    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (user ${socket.dbUserId})`);

  socket.on("join_room", async ({ interestId }, ack) => {
    try {
      const { data: interest, error } = await supabase
        .from("interests")
        .select("id, tenant_id, status, listings:listing_id(owner_id)")
        .eq("id", interestId)
        .single();

      if (error || !interest) return ack?.({ ok: false, error: "Interest not found" });
      if (interest.status === "declined") return ack?.({ ok: false, error: "This interest was declined" });

      const isParticipant =
        interest.tenant_id === socket.dbUserId || interest.listings?.owner_id === socket.dbUserId;

      if (!isParticipant) return ack?.({ ok: false, error: "Forbidden" });

      socket.join(interestId);
      ack?.({ ok: true });
    } catch (err) {
      console.error("join_room error:", err.message);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  socket.on("send_message", async ({ interestId, body }, ack) => {
    try {
      if (!body?.trim()) return ack?.({ ok: false, error: "Empty message" });

      const isInRoom = socket.rooms.has(interestId);
      if (!isInRoom) return ack?.({ ok: false, error: "Join the room first" });

      const { data: message, error } = await supabase
        .from("messages")
        .insert({ interest_id: interestId, sender_id: socket.dbUserId, body: body.trim() })
        .select()
        .single();

      if (error) return ack?.({ ok: false, error: error.message });

      io.to(interestId).emit("new_message", message);
      ack?.({ ok: true, message });
    } catch (err) {
      console.error("send_message error:", err.message);
      ack?.({ ok: false, error: "Server error" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});