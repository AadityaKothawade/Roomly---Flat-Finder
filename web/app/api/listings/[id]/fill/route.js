import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(_req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("owner_id")
    .eq("id", params.id)
    .single();

  if (!listing || listing.owner_id !== dbUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("listings")
    .update({ is_filled: true })
    .eq("id", params.id);

  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
}
