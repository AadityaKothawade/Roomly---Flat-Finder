export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getOrComputeScore } from "@/lib/scoreListing";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
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
    return <main className="page-shell p-10 text-ink">Listing not found.</main>;
  }

  if (dbUser?.id === listing.owner_id) {
    redirect(`/owner/listings/${listing.id}/edit`);
  }

  let score = null;
  let existingInterest = null;
  let profile = null;

  if (dbUser?.role === "tenant") {
    const [{ data: fetchedProfile }, { data: interest }] = await Promise.all([
      supabaseAdmin.from("tenant_profiles").select("*").eq("tenant_id", dbUser.id).single(),
      supabaseAdmin
        .from("interests")
        .select("id, status")
        .eq("tenant_id", dbUser.id)
        .eq("listing_id", listing.id)
        .single(),
    ]);

    profile = fetchedProfile;
    if (profile) {
      score = await getOrComputeScore(dbUser.id, listing, profile);
    }
    existingInterest = interest;
  }

  const ownerName = listing.owner?.name || listing.owner?.email?.split("@")[0] || "Owner";

  return (
    <main className="page-shell">
      <Nav dbUser={dbUser} />
      <PageHeader title={listing.title} backHref="/listings" backLabel="Browse rooms" />
      <div className="page-content max-w-2xl">
        <div className="card p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-ink/10">
            <span className="w-8 h-8 rounded-full bg-moss/15 text-moss text-sm font-semibold flex items-center justify-center uppercase shrink-0">
              {ownerName[0]}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{ownerName}</p>
              <p className="text-xs text-ink/45">Listing owner</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="chip">{listing.location}</span>
            <span className="chip">₹{listing.rent.toLocaleString("en-IN")}/mo</span>
            <span className="chip capitalize">{listing.room_type}</span>
            <span className="chip capitalize">{listing.furnishing_status}</span>
            <span className="chip">
              Available {new Date(listing.available_from).toLocaleDateString()}
            </span>
          </div>

          {score && (
            <div className="pt-4 border-t border-ink/10">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40 mb-3">
                Your compatibility
              </p>
              <CompatibilityMeter
                score={score.score}
                explanation={score.explanation}
                source={score.source}
              />
            </div>
          )}

          {dbUser?.role === "tenant" && !profile && (
            <div className="alert-warn mt-4">
              <a href="/tenant/profile" className="font-medium underline">Set your preferences</a>{" "}
              to see your compatibility score for this room.
            </div>
          )}
        </div>

        {dbUser?.role === "tenant" ? (
          <InterestButton
            listingId={listing.id}
            initialStatus={existingInterest?.status}
            initialInterestId={existingInterest?.id}
          />
        ) : (
          !dbUser && (
            <div className="card p-5 text-center">
              <p className="text-sm text-ink/60 mb-3">Sign in as a tenant to express interest.</p>
              <a href="/sign-in" className="btn-primary">
                Sign in
              </a>
            </div>
          )
        )}
      </div>
    </main>
  );
}