"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    preferred_location: "",
    budget_min: "",
    budget_max: "",
    move_in_date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      const res = await fetch("/api/tenant-profile");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setForm({
            preferred_location: data.preferred_location || "",
            budget_min: data.budget_min ?? "",
            budget_max: data.budget_max ?? "",
            move_in_date: data.move_in_date || "",
            notes: data.notes || "",
          });
          setHasExisting(true);
        }
      }
      setLoading(false);
    }
    loadExisting();
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/tenant-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setHasExisting(true);
    setSaved(true);
  }

  async function handleClear() {
    if (!confirm("Clear your saved preferences? You'll need to set them again to see matches.")) return;
    setSubmitting(true);
    await fetch("/api/tenant-profile", { method: "DELETE" });
    setForm({ preferred_location: "", budget_min: "", budget_max: "", move_in_date: "", notes: "" });
    setHasExisting(false);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-ink/50 text-sm">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 pb-12">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Preferred location">
          <input
            required
            value={form.preferred_location}
            onChange={(e) => update("preferred_location", e.target.value)}
              placeholder="Koramangala, Bangalore"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget min (₹)">
              <input
                required
                type="number"
                value={form.budget_min}
                onChange={(e) => update("budget_min", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Budget max (₹)">
              <input
                required
                type="number"
                value={form.budget_max}
                onChange={(e) => update("budget_max", e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Move-in date">
            <input
              required
              type="date"
              value={form.move_in_date}
              onChange={(e) => update("move_in_date", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Anything else? (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="input"
            />
          </Field>

          {error && <p className="text-clay text-sm">{error}</p>}
          {saved && <p className="text-moss text-sm">Saved.</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-ink text-parchment rounded-card font-medium disabled:opacity-50"
            >
              {submitting ? "Saving…" : hasExisting ? "Update preferences" : "Save preferences"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/listings")}
              className="px-6 py-3 border border-ink/20 text-ink rounded-card font-medium"
            >
              Browse listings
            </button>
          </div>

          {hasExisting && (
            <button
              type="button"
              onClick={handleClear}
              disabled={submitting}
              className="text-xs text-clay/80 hover:text-clay underline"
            >
              Clear my preferences
            </button>
          )}
        </form>

        <style jsx global>{`
          .input {
            width: 100%;
            padding: 0.65rem 0.85rem;
            border: 1px solid rgb(var(--color-ink) / 0.15);
            border-radius: 6px;
            background: rgb(var(--color-parchment));
            color: rgb(var(--color-ink));
          }
          .input:focus {
            outline: 2px solid rgb(var(--color-moss));
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
