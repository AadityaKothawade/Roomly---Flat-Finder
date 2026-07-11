import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Nav from "@/components/Nav";
import ListingForm from "../../new/ListingForm";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }) {
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

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!listing || listing.owner_id !== dbUser.id) {
    return (
      <main className="min-h-screen bg-parchment">
        <Nav dbUser={dbUser} />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-ink/60">Listing not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <ListingForm
        listingId={listing.id}
        initial={{
          title: listing.title,
          location: listing.location,
          rent: listing.rent,
          available_from: listing.available_from,
          room_type: listing.room_type,
          furnishing_status: listing.furnishing_status,
        }}
      />
    </main>
  );
}
