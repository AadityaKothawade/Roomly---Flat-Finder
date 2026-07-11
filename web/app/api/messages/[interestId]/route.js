import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const { data: interest } = await supabaseAdmin
    .from("interests")
    .select("id, tenant_id, status, listing:listing_id(title, owner_id)")
    .eq("id", params.interestId)
    .single();

  if (!interest) return new Response("Not found", { status: 404 });
  if (interest.status === "declined") return new Response("This interest was declined", { status: 403 });

  const isParticipant = interest.tenant_id === dbUser.id || interest.listing?.owner_id === dbUser.id;
  if (!isParticipant) return new Response("Forbidden", { status: 403 });

  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("interest_id", params.interestId)
    .order("created_at", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ messages, listingTitle: interest.listing?.title, currentUserId: dbUser.id });
}
