"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Reusable for both creating a new listing and editing an existing one.
// Pass `listingId` + `initial` to edit; omit both to create.
export default function ListingForm({ listingId, initial }) {
  const router = useRouter();
  const isEdit = Boolean(listingId);

  const [form, setForm] = useState(
    initial || {
      title: "",
      location: "",
      rent: "",
      available_from: "",
      room_type: "private",
      furnishing_status: "furnished",
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(isEdit ? `/api/listings/${listingId}` : "/api/listings", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    router.push("/owner/dashboard");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently? This can't be undone.")) return;
    setSubmitting(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setSubmitting(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    router.push("/owner/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <p className="font-display italic text-brass text-sm mb-2">{isEdit ? "edit listing" : "list a room"}</p>
      <h1 className="font-display text-3xl text-ink mb-8">
        {isEdit ? "Update the room details" : "Tell us about the room"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Sunny room near the park"
            className="input"
          />
        </Field>
        <Field label="Location">
          <input
            required
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Koramangala, Bangalore"
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly rent (₹)">
            <input
              required
              type="number"
              value={form.rent}
              onChange={(e) => update("rent", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Available from">
            <input
              required
              type="date"
              value={form.available_from}
              onChange={(e) => update("available_from", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Room type">
            <select
              value={form.room_type}
              onChange={(e) => update("room_type", e.target.value)}
              className="input"
            >
              <option value="private">Private room</option>
              <option value="shared">Shared room</option>
            </select>
          </Field>
          <Field label="Furnishing">
            <select
              value={form.furnishing_status}
              onChange={(e) => update("furnishing_status", e.target.value)}
              className="input"
            >
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </Field>
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-ink text-parchment rounded-card font-medium disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Post listing"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-5 py-3 border border-clay text-clay rounded-card font-medium disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border: 1px solid rgba(18, 33, 58, 0.15);
          border-radius: 6px;
          background: #f6f1e7;
          color: #12213a;
        }
        .input:focus {
          outline: 2px solid #3f6b4e;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-ink/70 mb-1">{label}</span>
      {children}
    </label>
  );
}
