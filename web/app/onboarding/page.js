"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);

  async function choose(role) {
    setLoading(role);
    await fetch("/api/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.push(role === "owner" ? "/owner/listings/new" : "/tenant/profile");
  }

  return (
    <main className="min-h-screen bg-parchment flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <Link href="/" className="text-sm text-ink/50 hover:text-ink mb-6 inline-block">
          ← Home
        </Link>
        <h1 className="font-display text-2xl text-ink mb-8">What brings you to Roomly?</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => choose("tenant")}
            disabled={loading}
            className="p-5 border border-ink/15 rounded-card bg-linen hover:border-moss transition-colors text-left disabled:opacity-50"
          >
            <div className="font-display text-base text-ink mb-1">I'm looking for a room</div>
            <div className="text-sm text-ink/60">Set budget and location, get matched.</div>
          </button>
          <button
            onClick={() => choose("owner")}
            disabled={loading}
            className="p-5 border border-ink/15 rounded-card bg-linen hover:border-moss transition-colors text-left disabled:opacity-50"
          >
            <div className="font-display text-base text-ink mb-1">I have a room to list</div>
            <div className="text-sm text-ink/60">Post a listing and review tenants.</div>
          </button>
        </div>
      </div>
    </main>
  );
}
