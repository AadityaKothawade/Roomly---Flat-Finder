"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkFilledButton({ listingId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/listings/${listingId}/fill`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-3 py-1.5 border border-ink/20 rounded-card text-ink/70 hover:border-clay hover:text-clay disabled:opacity-50"
    >
      {loading ? "Updating…" : "Mark as filled"}
    </button>
  );
}
