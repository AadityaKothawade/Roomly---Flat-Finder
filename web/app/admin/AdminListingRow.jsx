"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminListingRow({ listing }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${listing.title}" permanently? This can't be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between bg-linen border border-ink/10 rounded-card px-4 py-3">
      <div className="text-sm">
        <span className="font-medium text-ink">{listing.title}</span>{" "}
        <span className="text-ink/50">
          — {listing.location} &middot; ₹{listing.rent}/mo &middot; owner:{" "}
          {listing.owner?.name || listing.owner?.email}
          {listing.is_filled && " · filled"}
        </span>
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-3 py-1.5 border border-clay text-clay rounded-card disabled:opacity-50 shrink-0 ml-4"
      >
        Delete
      </button>
    </div>
  );
}