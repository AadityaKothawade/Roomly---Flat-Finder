"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListingMenu({ listingId, isFilled }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkFilled() {
    setLoading(true);
    await fetch(`/api/listings/${listingId}/fill`, { method: "POST" });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently? This can't be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        aria-label="Listing options"
        className="w-8 h-8 flex items-center justify-center rounded-card hover:bg-ink/5 text-ink/60 hover:text-ink disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="9" cy="3.5" r="1.6" />
          <circle cx="9" cy="9" r="1.6" />
          <circle cx="9" cy="14.5" r="1.6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-parchment border border-ink/10 rounded-card shadow-lg py-1 z-20">
          <Link
            href={`/owner/listings/${listingId}/edit`}
            className="block px-4 py-2 text-sm text-ink hover:bg-linen"
            onClick={() => setOpen(false)}
          >
            Edit
          </Link>
          {!isFilled && (
            <button
              onClick={handleMarkFilled}
              disabled={loading}
              className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-linen disabled:opacity-50"
            >
              Mark as filled
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full text-left px-4 py-2 text-sm text-clay hover:bg-clay/10 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}