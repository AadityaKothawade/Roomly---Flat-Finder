export const dynamic = "force-dynamic";

import Link from "next/link";
import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import InterestActions from "./InterestActions";
import ListingMenu from "./ListingMenu";

export default async function OwnerDashboard() {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return (
      <main className="page-shell">
        <Nav dbUser={dbUser} />
        <div className="page-content-narrow py-20 text-center">
          <p className="text-ink/60">This page is for owners only.</p>
        </div>
      </main>
    );
  }

  const { data: listings, error: listingsError } = await supabaseAdmin
    .from("listings")
    .select("*, interests(id, status, created_at, tenant_id, tenant:tenant_id(name, email))")
    .eq("owner_id", dbUser.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Failed to load owner listings:", listingsError.message);
  }

  const allInterests = (listings || []).flatMap((l) => l.interests || []);
  let scoreByKey = {};
  if (allInterests.length > 0) {
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
    <main className="page-shell">
      <Nav dbUser={dbUser} />
      <PageHeader
        title="My listings"
        subtitle={`${listings?.length || 0} active listing${listings?.length === 1 ? "" : "s"}`}
        action={
          <Link href="/owner/listings/new" className="btn-primary !py-2">
            + New listing
          </Link>
        }
      />
      <div className="page-content">
        {totalPendingInterests > 0 && (
          <div className="alert-info mb-6">
            {totalPendingInterests} new interest{totalPendingInterests === 1 ? "" : "s"} waiting for your response.
          </div>
        )}

        {listingsError && (
          <p className="text-clay text-sm mb-6">Couldn&apos;t load your listings — check the server logs.</p>
        )}

        {!listingsError && (!listings || listings.length === 0) && (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink mb-2">No listings yet</p>
            <p className="text-sm text-ink/50 mb-5">Post your first room to start receiving tenant interest.</p>
            <Link href="/owner/listings/new" className="btn-primary">
              Create listing
            </Link>
          </div>
        )}

        <div className="space-y-5">
          {listings?.map((listing) => (
            <div key={listing.id} className="card p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-display text-xl text-ink">{listing.title}</h2>
                    {listing.is_filled && <StatusBadge status="filled" />}
                  </div>
                  <p className="text-sm text-ink/55">
                    {listing.location} · ₹{listing.rent.toLocaleString("en-IN")}/mo
                  </p>
                </div>
                <ListingMenu listingId={listing.id} isFilled={listing.is_filled} />
              </div>

              <div className="mt-5 pt-4 border-t border-ink/10">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/40 mb-3">
                  {listing.interests?.length || 0} interest{listing.interests?.length === 1 ? "" : "s"}
                </p>

                {(!listing.interests || listing.interests.length === 0) && (
                  <p className="text-sm text-ink/45 py-2">No interest yet — share your listing to attract tenants.</p>
                )}

                <div className="space-y-2">
                  {listing.interests?.map((interest) => {
                    const score = scoreByKey[`${interest.tenant_id}:${listing.id}`];
                    return (
                      <div
                        key={interest.id}
                        className="flex flex-wrap items-center justify-between gap-3 bg-parchment rounded-lg border border-ink/8 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-ink flex items-center gap-2 flex-wrap">
                            {interest.tenant?.name || interest.tenant?.email}
                            {typeof score === "number" && (
                              <span className="badge-brass">{score}/100</span>
                            )}
                          </div>
                          <StatusBadge status={interest.status} className="mt-1.5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <InterestActions interestId={interest.id} status={interest.status} />
                          {interest.status !== "declined" && (
                            <Link href={`/chat/${interest.id}`} className="btn-moss !py-1.5 !px-3 text-xs">
                              Chat
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
