"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserRow({ user, currentAdminId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentAdminId;

  async function handleDelete() {
    if (!confirm(`Delete user ${user.email}? This can't be undone.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
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
        <span className="font-medium text-ink">{user.name || "(no name)"}</span>{" "}
        <span className="text-ink/50">
          — {user.email} &middot; {user.role || "no role"}
          {isSelf && " (you)"}
        </span>
      </div>
      {!isSelf && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-3 py-1.5 border border-clay text-clay rounded-card disabled:opacity-50 shrink-0 ml-4"
        >
          Delete
        </button>
      )}
    </div>
  );
}