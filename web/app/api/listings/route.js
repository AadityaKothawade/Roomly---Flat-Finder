import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "owner") {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const { title, location, rent, available_from, room_type, furnishing_status } = body;

  if (!title || !location || !rent || !available_from) {
    return new Response("Missing required fields", { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("listings")
    .insert({
      owner_id: dbUser.id,
      title,
      location,
      rent,
      available_from,
      room_type,
      furnishing_status,
    })
    .select()
    .single();

  if (error) return new Response(error.message, { status: 500 });
  return Response.json(data);
}
