import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET: fetch a single listing — used to prefill the edit form.
// Only the owning owner can fetch it via this route (browse page uses a
// separate public read path).
export async function GET(_req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: listing, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !listing) return new Response("Not found", { status: 404 });
  if (listing.owner_id !== dbUser.id) return new Response("Forbidden", { status: 403 });

  return Response.json(listing);
}

// PATCH: update a listing's details.
export async function PATCH(req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: existing } = await supabaseAdmin
    .from("listings")
    .select("owner_id")
    .eq("id", params.id)
    .single();

  if (!existing || existing.owner_id !== dbUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { title, location, rent, available_from, room_type, furnishing_status } = body;

  if (!title || !location || !rent || !available_from) {
    return new Response("Missing required fields", { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("listings")
    .update({ title, location, rent, available_from, room_type, furnishing_status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}

// DELETE: remove a listing entirely (cascades to interests/scores via FK).
export async function DELETE(_req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: existing } = await supabaseAdmin
    .from("listings")
    .select("owner_id")
    .eq("id", params.id)
    .single();

  if (!existing || existing.owner_id !== dbUser.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const { error } = await supabaseAdmin.from("listings").delete().eq("id", params.id);
  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true });
}
