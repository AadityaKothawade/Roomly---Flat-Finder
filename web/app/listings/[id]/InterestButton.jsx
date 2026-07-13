"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

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
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={displayStatus} />
        <span className="text-sm text-ink/55">Your interest has been sent to the owner.</span>
        {displayStatus !== "declined" && interestId && (
          <Link href={`/chat/${interestId}`} className="btn-moss !py-2 !px-4 text-xs ml-auto">
            Open chat →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-moss w-full sm:w-auto">
        {loading ? "Sending…" : "Express interest"}
      </button>
      {error && <p className="text-clay text-sm mt-2">{error}</p>}
    </div>
  );
}
