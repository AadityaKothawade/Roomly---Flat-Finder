"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import Link from "next/link";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

export default function ChatPage() {
  const { interestId } = useParams();
  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);
  const [listingTitle, setListingTitle] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [input, setInput] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let socket;

    async function init() {
      const res = await fetch(`/api/messages/${interestId}`);
      if (!res.ok) {
        if (!cancelled) {
          setError(await res.text());
          setConnectionState("error");
        }
        return;
      }
      const data = await res.json();
      if (cancelled) return;

      setMessages(data.messages);
      setListingTitle(data.listingTitle);
      setCurrentUserId(data.currentUserId);

      const token = await getToken();
      if (cancelled) return;

      socket = io(WS_URL, { auth: { token } });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (cancelled) {
          socket.disconnect();
          return;
        }
        socket.emit("join_room", { interestId }, (ack) => {
          if (cancelled) return;
          if (ack?.ok) {
            setConnectionState("connected");
          } else {
            setError(ack?.error || "Could not join chat");
            setConnectionState("error");
          }
        });
      });

      socket.on("new_message", (message) => {
        if (cancelled) return;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      });

      socket.on("connect_error", () => {
        if (cancelled) return;
        setConnectionState("error");
        setError("Could not reach the chat server. Is the WebSocket server running?");
      });
    }

    init();
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { interestId, body: input }, (ack) => {
      if (!ack?.ok) setError(ack?.error || "Failed to send");
    });
    setInput("");
  }

  return (
    <main className="min-h-screen bg-parchment flex flex-col">
      <div className="border-b border-ink/10 px-6 py-3 flex items-center justify-between max-w-2xl w-full mx-auto">
        <div className="min-w-0">
          <Link href="/listings" className="text-sm text-ink/50 hover:text-ink">
            ← Back
          </Link>
          <h1 className="font-display text-lg text-ink truncate">{listingTitle || "Chat"}</h1>
        </div>
        <span className="text-xs shrink-0 ml-3">
          {connectionState === "connected" && <span className="text-moss">● live</span>}
          {connectionState === "connecting" && <span className="text-brass">connecting…</span>}
          {connectionState === "error" && <span className="text-clay">offline</span>}
        </span>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-4 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-4 py-2 rounded-card text-sm ${
              m.sender_id === currentUserId
                ? "bg-ink text-parchment ml-auto"
                : "bg-linen text-ink border border-ink/10"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="max-w-2xl w-full mx-auto px-6 py-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={connectionState !== "connected"}
          className="flex-1 px-4 py-2.5 border border-ink/15 rounded-card bg-linen disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={connectionState !== "connected"}
          className="px-5 py-2.5 bg-ink text-parchment rounded-card disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}