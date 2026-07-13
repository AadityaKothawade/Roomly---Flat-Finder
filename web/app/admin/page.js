export const dynamic = "force-dynamic";

import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import AdminListingRow from "./AdminListingRow";
import AdminUserRow from "./AdminUserRow";

export default async function AdminPage() {
  const dbUser = await currentDbUser();

  if (!dbUser || dbUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-parchment">
        <Nav dbUser={dbUser} />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-ink/60">This page is for admins only.</p>
        </div>
      </main>
    );
  }

  const [{ data: users }, { data: listings }, { count: interestCount }, { data: recentInterests }] =
    await Promise.all([
      supabaseAdmin.from("users").select("*").order("created_at", { ascending: false }),
      supabaseAdmin
        .from("listings")
        .select("*, owner:owner_id(name, email)")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("interests").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("interests")
        .select("id, status, created_at, tenant:tenant_id(name, email), listing:listing_id(title)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const totalUsers = users?.length || 0;
  const totalOwners = users?.filter((u) => u.role === "owner").length || 0;
  const totalTenants = users?.filter((u) => u.role === "tenant").length || 0;
  const totalListings = listings?.length || 0;
  const openListings = listings?.filter((l) => !l.is_filled).length || 0;

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <PageHeader title="Admin" />
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <Stat label="Users" value={totalUsers} />
          <Stat label="Owners" value={totalOwners} />
          <Stat label="Tenants" value={totalTenants} />
          <Stat label="Listings" value={`${openListings}/${totalListings}`} sub="open/total" />
          <Stat label="Interests" value={interestCount ?? 0} />
        </div>

        <section className="mb-12">
          <h2 className="font-display text-xl text-ink mb-4">Recent activity</h2>
          <div className="space-y-2">
            {(!recentInterests || recentInterests.length === 0) && (
              <p className="text-sm text-ink/50">No activity yet.</p>
            )}
            {recentInterests?.map((i) => (
              <div
                key={i.id}
                className="text-sm bg-linen border border-ink/10 rounded-card px-4 py-3 flex justify-between"
              >
                <span>
                  <strong>{i.tenant?.name || i.tenant?.email}</strong> expressed interest in{" "}
                  <strong>{i.listing?.title}</strong>
                </span>
                <span className="text-ink/50">{i.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-xl text-ink mb-4">Listings ({totalListings})</h2>
          <div className="space-y-2">
            {listings?.map((listing) => (
              <AdminListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink mb-4">Users ({totalUsers})</h2>
          <div className="space-y-2">
            {users?.map((user) => (
              <AdminUserRow key={user.id} user={user} currentAdminId={dbUser.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="bg-linen border border-ink/10 rounded-card p-4 text-center">
      <div className="font-display text-2xl text-ink">{value}</div>
      <div className="text-xs text-ink/50 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-ink/30">{sub}</div>}
    </div>
  );
}