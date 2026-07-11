export const dynamic = "force-dynamic";

import Link from "next/link";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrComputeScore } from "@/lib/scoreListing";
import Nav from "@/components/Nav";
import CompatibilityMeter from "@/components/CompatibilityMeter";

export default async function Listings({ searchParams }) {
  const dbUser = await currentDbUser();

  const location = searchParams?.location || "";
  const maxBudget = searchParams?.maxBudget || "";

  let query = supabaseAdmin.from("listings").select("*").eq("is_filled", false);
  if (location) query = query.ilike("location", `%${location}%`);
  if (maxBudget) query = query.lte("rent", Number(maxBudget));

  const { data: listings } = await query.order("created_at", { ascending: false });

  let profile = null;
  if (dbUser?.role === "tenant") {
    const { data } = await supabaseAdmin
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", dbUser.id)
      .single();
    profile = data;
  }

  // Compute/fetch scores server-side for ranking, only if the tenant has a profile
  let scored = listings || [];
  if (profile) {
    const withScores = await Promise.all(
      scored.map(async (listing) => ({
        listing,
        score: await getOrComputeScore(dbUser.id, listing, profile),
      }))
    );
    withScores.sort((a, b) => b.score.score - a.score.score);
    scored = withScores;
  } else {
    scored = scored.map((listing) => ({ listing, score: null }));
  }

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink mb-2">Browse rooms</h1>
        {!profile && dbUser?.role === "tenant" && (
          <p className="text-sm text-brass mb-6">
            <Link href="/tenant/profile" className="underline">
              Set your preferences
            </Link>{" "}
            to see compatibility scores.
          </p>
        )}

        <form className="flex gap-3 mb-8" method="GET">
          <input
            name="location"
            defaultValue={location}
            placeholder="Filter by location"
            className="flex-1 px-3 py-2 border border-ink/15 rounded-card bg-linen"
          />
          <input
            name="maxBudget"
            defaultValue={maxBudget}
            type="number"
            placeholder="Max rent"
            className="w-40 px-3 py-2 border border-ink/15 rounded-card bg-linen"
          />
          <button className="px-4 py-2 bg-ink text-parchment rounded-card text-sm">Filter</button>
        </form>

        {scored.length === 0 && <p className="text-ink/60">No listings match yet — check back soon.</p>}

        <div className="space-y-4">
          {scored.map(({ listing, score }) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="flex items-center justify-between border border-ink/10 bg-linen rounded-card p-5 hover:border-moss transition-colors"
            >
              <div>
                <h2 className="font-display text-lg text-ink">{listing.title}</h2>
                <p className="text-sm text-ink/60">
                  {listing.location} · ₹{listing.rent}/mo · from{" "}
                  {new Date(listing.available_from).toLocaleDateString()}
                </p>
              </div>
              {score && (
                <CompatibilityMeter
                  score={score.score}
                  explanation={score.explanation}
                  source={score.source}
                  static
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
