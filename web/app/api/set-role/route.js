import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { currentDbUser } from "@/lib/currentDbUser";

export async function POST(req) {
  // currentDbUser() auto-creates the row if this is the user's first
  // authenticated request, so this always has a user to update.
  const dbUser = await currentDbUser();
  if (!dbUser) return new Response("Unauthorized", { status: 401 });

  const { role } = await req.json();
  if (!["tenant", "owner"].includes(role)) {
    return new Response("Invalid role", { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", dbUser.id);

  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true });
}
