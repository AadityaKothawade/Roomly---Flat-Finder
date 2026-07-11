"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InterestActions({ interestId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(newStatus) {
    setLoading(true);
    await fetch(`/api/interests/${interestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status !== "pending") {
    return (
      <span className={`text-xs font-medium ${status === "accepted" ? "text-moss" : "text-clay"}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => decide("accepted")}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-moss text-parchment rounded-card disabled:opacity-50"
      >
        Accept
      </button>
      <button
        onClick={() => decide("declined")}
        disabled={loading}
        className="text-xs px-3 py-1.5 border border-clay text-clay rounded-card disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
