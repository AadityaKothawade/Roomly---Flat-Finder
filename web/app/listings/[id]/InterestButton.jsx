"use client";

import { useState } from "react";
import Link from "next/link";

export default function InterestButton({ listingId, alreadyExpressed, initialStatus, initialInterestId }) {
  const [status, setStatus] = useState(initialStatus || null);
  const [interestId, setInterestId] = useState(initialInterestId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const data = await res.json();
    setInterestId(data.id);
    setStatus("pending");
  }

  if (status || alreadyExpressed) {
    const displayStatus = status || initialStatus;
    return (
      <div className="flex items-center gap-3">
        <span className="px-4 py-2 rounded-card text-sm border border-ink/15 text-ink/60">
          Interest {displayStatus}
        </span>
        {displayStatus !== "declined" && interestId && (
          <Link href={`/chat/${interestId}`} className="text-sm text-moss underline">
            Open chat
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-5 py-2.5 bg-moss text-parchment rounded-card font-medium disabled:opacity-50"
      >
        {loading ? "Sending…" : "Express interest"}
      </button>
      {error && <p className="text-clay text-xs mt-2">{error}</p>}
    </div>
  );
}
