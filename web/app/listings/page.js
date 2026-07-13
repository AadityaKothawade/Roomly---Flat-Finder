export const dynamic = "force-dynamic";

import Link from "next/link";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getScoresForListings } from "@/lib/scoreListing";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import CompatibilityMeter from "@/components/CompatibilityMeter";

export default async function Listings({ searchParams }) {
  const dbUser = await currentDbUser();

  const location = searchParams?.location || "";
  const maxBudget = searchParams?.maxBudget || "";

  let query = supabaseAdmin.from("listings").select("*").eq("is_filled", false);
  if (dbUser?.id) query = query.neq("owner_id", dbUser.id);
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

  let scored = listings || [];
  if (profile && scored.length > 0) {
    const withScores = await getScoresForListings(dbUser.id, scored, profile);
    withScores.sort((a, b) => b.score.score - a.score.score);
    scored = withScores;
  } else {
    scored = scored.map((listing) => ({ listing, score: null }));
  }

  return (
    <main className="page-shell">
      <Nav dbUser={dbUser} />
      <PageHeader
        title="Browse rooms"
        subtitle={profile ? `${scored.length} listing${scored.length === 1 ? "" : "s"} ranked by your fit` : undefined}
      />
      <div className="page-content">
        {!profile && dbUser?.role === "tenant" && (
          <div className="alert-warn mb-6">
            <Link href="/tenant/profile" className="font-medium underline">
              Set your preferences
            </Link>{" "}
            to unlock AI compatibility scores on every listing.
          </div>
        )}

        <form className="card p-4 mb-6 flex flex-wrap gap-3" method="GET">
          <input
            name="location"
            defaultValue={location}
            placeholder="Location — e.g. Koramangala"
            className="input flex-1 min-w-[140px]"
          />
          <input
            name="maxBudget"
            defaultValue={maxBudget}
            type="number"
            placeholder="Max rent (₹)"
            className="input w-36"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {scored.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink mb-1">No rooms found</p>
            <p className="text-sm text-ink/50">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scored.map(({ listing, score }) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="card-hover flex items-center justify-between gap-4 p-4 md:p-5 group"
              >
                <div className="min-w-0">
                  <h2 className="font-display text-lg text-ink group-hover:text-moss transition-colors truncate">
                    {listing.title}
                  </h2>
                  <p className="text-sm text-ink/55 mt-1">{listing.location}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="chip">₹{listing.rent.toLocaleString("en-IN")}/mo</span>
                    <span className="chip capitalize">{listing.room_type}</span>
                    <span className="chip capitalize">{listing.furnishing_status}</span>
                  </div>
                </div>
                {score && (
                  <CompatibilityMeter
                    score={score.score}
                    explanation={score.explanation}
                    source={score.source}
                    static
                    compact
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
