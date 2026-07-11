export const dynamic = "force-dynamic";

import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrComputeScore } from "@/lib/scoreListing";
import Nav from "@/components/Nav";
import CompatibilityMeter from "@/components/CompatibilityMeter";
import InterestButton from "./InterestButton";

export default async function ListingDetail({ params }) {
  const dbUser = await currentDbUser();

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("*, owner:owner_id(name, email)")
    .eq("id", params.id)
    .single();

  if (!listing) {
    return <main className="p-10 text-ink">Listing not found.</main>;
  }

  let score = null;
  let existingInterest = null;

  if (dbUser?.role === "tenant") {
    const { data: profile } = await supabaseAdmin
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", dbUser.id)
      .single();

    if (profile) {
      score = await getOrComputeScore(dbUser.id, listing, profile);
    }

    const { data: interest } = await supabaseAdmin
      .from("interests")
      .select("id, status")
      .eq("tenant_id", dbUser.id)
      .eq("listing_id", listing.id)
      .single();
    existingInterest = interest;
  }

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="font-display italic text-brass text-sm mb-2">{listing.location}</p>
        <h1 className="font-display text-4xl text-ink mb-4">{listing.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-ink/70 mb-8">
          <span>₹{listing.rent}/mo</span>
          <span>·</span>
          <span>Available {new Date(listing.available_from).toLocaleDateString()}</span>
          <span>·</span>
          <span className="capitalize">{listing.room_type}</span>
          <span>·</span>
          <span className="capitalize">{listing.furnishing_status}</span>
        </div>

        {score && (
          <div className="mb-8 p-5 bg-linen border border-ink/10 rounded-card">
            <p className="text-xs uppercase tracking-wide text-ink/40 mb-3">Your compatibility</p>
            <CompatibilityMeter score={score.score} explanation={score.explanation} source={score.source} />
          </div>
        )}

        {dbUser?.role === "tenant" && (
          <InterestButton
            listingId={listing.id}
            initialStatus={existingInterest?.status}
            initialInterestId={existingInterest?.id}
          />
        )}

        {!dbUser && <p className="text-ink/60 text-sm">Sign in as a tenant to express interest.</p>}
      </div>
    </main>
  );
}
