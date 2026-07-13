"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

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
    return <StatusBadge status={status} />;
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => decide("accepted")} disabled={loading} className="btn-moss !py-1.5 !px-3 text-xs">
        Accept
      </button>
      <button onClick={() => decide("declined")} disabled={loading} className="btn-danger !py-1.5 !px-3 text-xs">
        Decline
      </button>
    </div>
  );
}
