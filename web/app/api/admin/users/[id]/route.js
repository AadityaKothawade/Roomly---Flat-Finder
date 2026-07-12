import { currentDbUser } from "@/lib/currentDbUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(_req, { params }) {
  const dbUser = await currentDbUser();
  if (!dbUser || dbUser.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  if (params.id === dbUser.id) {
    return new Response("You can't delete your own admin account", { status: 400 });
  }

  const { error } = await supabaseAdmin.from("users").delete().eq("id", params.id);
  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true });
}