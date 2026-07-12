export const dynamic = "force-dynamic";

import Link from "next/link";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Nav from "@/components/Nav";
import InterestActions from "./InterestActions";
import ListingMenu from "./ListingMenu";

export default async function OwnerDashboard() {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return (
      <main className="min-h-screen bg-parchment">
        <Nav dbUser={dbUser} />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-ink/60">This page is for owners only.</p>
        </div>
      </main>
    );
  }

  // NOTE: compatibility_scores is intentionally fetched as a *separate* query
  // below and merged in JS. It can't be embedded inside `interests(...)` here
  // via Supabase's nested-select syntax, because compatibility_scores has no
  // foreign key pointing at interests (it relates to listings/tenants
  // directly) — an earlier version tried to embed it that way and Supabase
  // silently failed the whole query as a result, which looked like "listings
  // aren't showing up" even though they existed in the database.
  const { data: listings, error: listingsError } = await supabaseAdmin
    .from("listings")
    .select("*, interests(id, status, created_at, tenant_id, tenant:tenant_id(name, email))")
    .eq("owner_id", dbUser.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Failed to load owner listings:", listingsError.message);
  }

  // Merge in compatibility scores for each (tenant, listing) pair shown above.
  const allInterests = (listings || []).flatMap((l) => l.interests || []);
  let scoreByKey = {};
  if (allInterests.length > 0) {
    const listingIds = [...new Set(allInterests.map((i) => i.listing_id).filter(Boolean))];
    const tenantIds = [...new Set(allInterests.map((i) => i.tenant_id))];
    const { data: scores } = await supabaseAdmin
      .from("compatibility_scores")
      .select("tenant_id, listing_id, score")
      .in("tenant_id", tenantIds);
    scoreByKey = Object.fromEntries((scores || []).map((s) => [`${s.tenant_id}:${s.listing_id}`, s.score]));
  }

  const totalPendingInterests = (listings || []).reduce(
    (sum, l) => sum + (l.interests?.filter((i) => i.status === "pending").length || 0),
    0
  );

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl text-ink">My listings</h1>
          <Link href="/owner/listings/new" className="px-4 py-2 bg-ink text-parchment rounded-card text-sm">
            + New listing
          </Link>
        </div>

        {totalPendingInterests > 0 && (
          <div className="mb-8 p-4 bg-moss/10 border border-moss/30 rounded-card text-sm text-moss font-medium">
            You have {totalPendingInterests} new interest{totalPendingInterests === 1 ? "" : "s"} waiting for a
            response below.
          </div>
        )}

        {listingsError && (
          <p className="text-clay text-sm mb-6">
            Couldn't load your listings right now — check the server logs for details.
          </p>
        )}

        {!listingsError && (!listings || listings.length === 0) && (
          <p className="text-ink/60">You haven't listed a room yet — click "+ New listing" above to post one.</p>
        )}

        <div className="space-y-6">
          {listings?.map((listing) => (
            <div key={listing.id} className="border border-ink/10 bg-linen rounded-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl text-ink">{listing.title}</h2>
                  <p className="text-sm text-ink/60">
                    {listing.location} · ₹{listing.rent}/mo{" "}
                    {listing.is_filled && <span className="text-clay ml-2">· Filled</span>}
                  </p>
                </div>
                <ListingMenu listingId={listing.id} isFilled={listing.is_filled} />
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-wide text-ink/40">
                  {listing.interests?.length || 0} interest{listing.interests?.length === 1 ? "" : "s"}
                </p>
                {(!listing.interests || listing.interests.length === 0) && (
                  <p className="text-xs text-ink/40">No one has expressed interest yet.</p>
                )}
                {listing.interests?.map((interest) => {
                  const score = scoreByKey[`${interest.tenant_id}:${listing.id}`];
                  return (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between bg-parchment border border-ink/10 rounded-card px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-ink">
                          {interest.tenant?.name || interest.tenant?.email}
                          {typeof score === "number" && (
                            <span className="ml-2 text-xs text-brass">{score}/100 match</span>
                          )}
                        </div>
                        <div className="text-xs text-ink/50">status: {interest.status}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <InterestActions interestId={interest.id} status={interest.status} />
                        {interest.status !== "declined" && (
                          <Link
                            href={`/chat/${interest.id}`}
                            className="text-xs px-3 py-1.5 bg-moss text-parchment rounded-card"
                          >
                            Chat
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
