import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendInterestEmail } from "@/lib/email";

export async function POST(req) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "tenant") {
    return new Response("Forbidden", { status: 403 });
  }

  const { listing_id } = await req.json();
  if (!listing_id) return new Response("Missing listing_id", { status: 400 });

  const { data: interest, error } = await supabaseAdmin
    .from("interests")
    .insert({ tenant_id: dbUser.id, listing_id })
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });

  // Look up the cached score (may not exist yet) + owner/listing details
  const [{ data: score }, { data: listing }] = await Promise.all([
    supabaseAdmin
      .from("compatibility_scores")
      .select("score")
      .eq("tenant_id", dbUser.id)
      .eq("listing_id", listing_id)
      .single(),
    supabaseAdmin
      .from("listings")
      .select("title, owner_id, owner:owner_id(email)")
      .eq("id", listing_id)
      .single(),
  ]);

  // Always notify the owner that someone is interested — not just high scores.
  if (listing?.owner?.email) {
    await sendInterestEmail({
      ownerEmail: listing.owner.email,
      tenantName: dbUser.name || dbUser.email,
      listingTitle: listing.title,
      score: score?.score,
    });
  }

  if (listing?.owner_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: listing.owner_id,
      type: score?.score > 80 ? "high_match" : "new_interest",
      payload: { listing_id, tenant_id: dbUser.id, score: score?.score ?? null },
    });
  }

  return Response.json(interest);
}
